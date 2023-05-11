const express = require('express');
const app = express();
const port = 8000;

app.get('/', function(req, res) {
	res.send("Bot online.");
});

app.listen(port, function() {
	console.log("Started bot.");
});

const Database = require("@replit/database")
const db = new Database()

const Discord = require("discord.js");
const RWLock = require("rwlock");

const Player = require("./src/player.js");
const setup = require("./src/setup.js");
const Game = require("./src/game.js");
require("dotenv").config()
const client = new Discord.Client({ intents: Discord.Intents.FLAGS.GUILDS, allowedMentions: { repliedUser: false } });
const TOKEN = process.env.DISCORD_TOKEN;

let lock = new RWLock();
let games = {};
db.list().then(keys => {
	console.log(keys);
	for (key of keys) {
		db.get(key).then((gameData) => {
			gameData = JSON.parse(gameData);
			console.log(gameData.channelID + ": " + JSON.stringify(gameData));
			if (gameData != null) {
				games[gameData.channelID] = Game.fromJSON(gameData)
			}
		})
	}
});
function update(id) { db.set(id, games[id].toJSON()).then(() => { console.log(id + " updated") }) }


client.on('ready', async (cli) => {
	console.log("ready");
	await setup(cli);
});

client.on('interactionCreate', (interaction) => {
	let reapMoment = Date.now();
	if (!interaction.isCommand()) {
		return;
	}
	//console.log(interaction);
	if (interaction.commandName == "timecalc") {
		let seconds = (interaction.options.getInteger("hours", false) !== null ? interaction.options.getInteger("hours", false) : 0) * 3600 +
			(interaction.options.getInteger("minutes", false) !== null ? interaction.options.getInteger("minutes", false) : 0) * 60 +
			(interaction.options.getInteger("seconds", false) !== null ? interaction.options.getInteger("seconds", false) : 0);
		interaction.reply({ content: seconds + " seconds.", ephemeral: true })
			.then(console.log)
			.catch(console.error);
	}
	lock.readLock(function(release) {
		if (!(interaction.channelId in games)) {
			if (interaction.commandName == "start" && authorize(interaction.member)) {
				let modifiers = interaction.options.getInteger("modifiers", false) !== null ? interaction.options.getInteger("modifiers", false) : 4;
				let goal = interaction.options.getInteger("goal", true);
				let cooldown = interaction.options.getInteger("cooldown", true);
				let wait = interaction.options.getInteger("wait", false) !== null ? interaction.options.getInteger("wait", false) : 0;
				release();
				if (wait != 0) {
					interaction.reply("A new game will begin in " + wait + " seconds.");
					return setTimeout(async function() {
						lock.writeLock(async function(release2) {
							games[interaction.channelId] = new Game(interaction.guildID, interaction.channelId, goal, cooldown, modifiers);
							release2();
							console.log(interaction.channel);
							update(interaction.channelId);
							await interaction.member.guild.channels.fetch(interaction.channelId).then((channel) => channel.send("A new reaper game has begun! Reap " + goal + " seconds to win. Wait " +
								cooldown + " seconds between reaps. Modifier: " + modifiers));
						})
					}, wait * 1000);
				}
				else {
					lock.writeLock(function(release2) {
						games[interaction.channelId] = new Game(interaction.guildID, interaction.channelId, goal, cooldown, modifiers);
						release2();
						update(interaction.channelId);
						interaction.reply("A new reaper game has begun! Reap " + goal +
							" to win. Wait " + cooldown + " between reaps. Modifier: " + modifiers);
					})
				}
			}
			else {
				interaction.reply("There is no reaper game in progress.");
			}
			return release();
		}
		else {
			release();
			if (interaction.commandName == "end" && authorize(interaction.member)) {
				lock.readLock(interaction.channelId, function(release2) {
					let finalLb = games[interaction.channelId].end();
					finalLb.sort((a, b) => { return b.points - a.points });
					delete games[interaction.channelId];
					db.delete(interaction.channelId.toString()).then(() => {
						console.log(interaction.channelId.toString());
						db.list().then(console.log);
					}).catch(console.log);
					console.log(games[interaction.channelId]);
					release2();
					if (finalLb.length == 0) {
						interaction.reply("Ended game. No reaps were made.").then(null).catch(console.error);
						return;
					}

					let replyObject = { ephemeral: false };
					let msgEmbed = new Discord.MessageEmbed()
						.setColor(0xd4af37)
						.setTimestamp(new Date())
						.setTitle("Final Leaderboard")
						.setDescription("The game has been ended. The top 10 people are listed here. Full standings are in the following file.");
					let fieldOne = "";
					let fieldTwo = "";
					for (let i = 0; i < Math.min(finalLb.length, 10); i++) {
						if (i > 0) {
							fieldOne += "\n";
							fieldTwo += "\n";
						}
						let person = finalLb[i];
						fieldOne += (i + 1) + ". <@" + person.id + ">";
						fieldTwo += person.points + " - " + person.reaps + " - " + Math.round((person.points / person.reaps) * 100) / 100;
					}
					console.log()
					msgEmbed.addField("Rank. Player", fieldOne, true);
					msgEmbed.addField("Time - Reaps - Average", fieldTwo, true);
					replyObject["embeds"] = [msgEmbed];
					replyObject["content"] = "The game has been manually ended. The winner is <@" + finalLb[0].id + ">!";
					interaction.reply(replyObject).then(null).catch(console.error);
					let fileStr = "Full Final Standings\nRank. Player: Time - Reaps - Average";
					for (let i = 0; i < finalLb.length; i++) {
						let person = finalLb[i];
						fileStr += `\n${i + 1}. ${person.name}: ${person.points} - ${person.reaps} - ${person.points / person.reaps}`;
					}
					console.log(interaction);
					client.channels.fetch(interaction.channelId).then(channel => channel
						.send({ files: [{ attachment: Buffer.from(fileStr, 'utf8'), name: "Reaper_Final_Standings.txt" }] }))
						.catch(console.error);
				});
				return;
			}
			else if (interaction.commandName == "reap" || interaction.commandName == "freereap") {
				lock.writeLock(interaction.channelId, function(release2) {
					let game = games[interaction.channelId];
					let text = interaction.commandName == "reap" ? game.reap(interaction.user, reapMoment)
						: game.freeReap(interaction.user, reapMoment);
					update(interaction.channelId);
					if (!text.startsWith("WIN")) {
						release2();
						interaction.reply(text).then(null).catch(console.error);
						return;
					}
					text = text.substring(4);
					let finalLb = games[interaction.channelId].end();
					finalLb.sort((a, b) => { return b.points - a.points });
					delete games[interaction.channelId];
					db.delete(interaction.channelId.toString()).then(() => {
						console.log(interaction.channelId.toString());
						db.list().then(console.log);
					}).catch(console.log);
					release2();
					let replyObject = { ephemeral: false };
					let msgEmbed = new Discord.MessageEmbed()
						.setColor(0xd4af37)
						.setTimestamp(new Date())
						.setTitle("Final Leaderboard")
						.setDescription("The top 10 people are listed here. Full standings are in the following file.");
					let fieldOne = "";
					let fieldTwo = "";
					for (let i = 0; i < Math.min(finalLb.length, 10); i++) {
						if (i > 0) {
							fieldOne += "\n";
							fieldTwo += "\n";
						}
						let person = finalLb[i];
						fieldOne += (i + 1) + ". <@" + person.id + ">";
						fieldTwo += person.points + " - " + person.reaps + " - " + Math.round((person.points / person.reaps) * 100) / 100;
					}
					msgEmbed.addField("Rank. Player", fieldOne, true);
					msgEmbed.addField("Time - Reaps - Average", fieldTwo, true);
					replyObject["embeds"] = [msgEmbed];
					replyObject["content"] = text + " You won the game!";
					interaction.reply(replyObject).then(null).catch(console.error);
					let fileStr = "Full Final Standings\nRank. Player: Time - Reaps - Average";
					for (let i = 0; i < finalLb.length; i++) {
						let person = finalLb[i];
						fileStr += `\n${i + 1}. ${person.name}: ${person.points} - ${person.reaps} - ${person.points / person.reaps}`;
					}
					console.log(interaction);
					client.channels.fetch(interaction.channelId).then(channel => channel
						.send({ files: [{ attachment: Buffer.from(fileStr, 'utf8'), name: "Reaper_Final_Standings.txt" }] }))
						.catch(console.error);
				})
			}
			else if (interaction.commandName == "timer") {
				lock.readLock(interaction.channelId, function(release2) {
					let game = games[interaction.channelId];
					let text = "There are " + Math.round((Date.now() - game.lastReap) / 1000) + " seconds on the clock.";
					let isPrivate = interaction.options.getBoolean("private", false) !== null ? interaction.options.getBoolean("private", false) : false;
					release2();
					interaction.reply({ ephemeral: isPrivate, content: text }).then(null).catch(console.error);
				})
			}
			else if (interaction.commandName == "cooldown") {
				let user = interaction.options.getMember("user", false) !== null ? interaction.options.getMember("user", false) : interaction.user;
				user = user.id;
				let isPrivate = interaction.options.getBoolean("private", false) !== null ? interaction.options.getBoolean("private", false) : false;
				lock.readLock(interaction.channelId, function(release2) {
					let game = games[interaction.channelId];
					console.log(game);
					let text = game.cd(user);
					release2();
					interaction.reply({ ephemeral: isPrivate, content: text }).then(null).catch(console.error);
				})
			}
			else if (interaction.commandName == "stats") {
				let user = interaction.options.getMember("user", false) !== null ? interaction.options.getMember("user", false) : interaction.user;
				user = user.id;
				let isPrivate = interaction.options.getBoolean("private", false) !== null ? interaction.options.getBoolean("private", false) : false;
				lock.readLock(interaction.channelId, function(release2) {
					let game = games[interaction.channelId];
					let text = game.stats(user);
					release2();
					interaction.reply({ ephemeral: isPrivate, content: text }).then(null).catch(console.error);
				})
			}
			else if (interaction.commandName == "leaderboard") {
				let page = interaction.options.getInteger("page", false) !== null ? interaction.options.getInteger("page", false) : 1;
				let isPrivate = interaction.options.getBoolean("private", false) !== null ? interaction.options.getBoolean("private", false) : false;
				let disabled = { one: false, two: false, secondLast: false, last: false };
				if (page == 1) disabled.one = true;
				if (page < 3) disabled.two = true;
				lock.readLock(interaction.channelId, function(release2) {
					let game = games[interaction.channelId];
					let playerCount = Object.keys(game.players).length
					let maxPages = Math.ceil(playerCount / 10.0);
					if (page > maxPages) page = maxPages;
					if (maxPages - page == 0) disabled.last = true;
					if (maxPages - page < 2) disabled.secondLast = true;
					let lb = game.lb(page);
					console.log(page);
					let msgEmbed = new Discord.MessageEmbed()
						.setColor(0x33fff8)
						.setTimestamp(new Date())
						.setTitle("Page " + page + " of " + Math.ceil(playerCount / 10.0))
						.setDescription("Players " + ((page - 1) * 10 + 1) + "-" + Math.min(playerCount, page * 10));
					let fieldOne = "";
					let fieldTwo = "";
					for (let i = 0; i < Math.min(lb.length, 10); i++) {
						if (i > 0) {
							fieldOne += "\n";
							fieldTwo += "\n";
						}
						let person = lb[i];
						fieldOne += (i + 1 + (page - 1) * 10) + ". <@" + person.id + ">";
						fieldTwo += person.points + " - " + person.reaps + " - " + Math.round((person.points / person.reaps) * 100) / 100;
					}
					msgEmbed.addField("Rank. Player", fieldOne, true);
					msgEmbed.addField("Time - Reaps - Average", fieldTwo, true);
					release2();
					const row = new Discord.MessageActionRow()
						.addComponents(
							new Discord.MessageButton()
								.setCustomId('back2-' + page)
								.setLabel('<<')
								.setStyle('PRIMARY')
								.setDisabled(disabled.one),
							new Discord.MessageButton()
								.setCustomId('back-' + page)
								.setLabel('<')
								.setStyle('PRIMARY')
								.setDisabled(disabled.two),
							new Discord.MessageButton()
								.setCustomId('forward-' + page)
								.setLabel('>')
								.setStyle('PRIMARY')
								.setDisabled(disabled.secondLast),
							new Discord.MessageButton()
								.setCustomId('forward2-' + page)
								.setLabel('>>')
								.setStyle('PRIMARY')
								.setDisabled(disabled.last),
						)
					interaction.reply({ ephemeral: isPrivate, embeds: [msgEmbed], components: [row] }).then(null).catch(console.error);
				})
			}
		}
	})
});

client.on("error", console.error);

console.log("Can Log In")

client.login(TOKEN).then(function(value) {
	console.log("logged in", client.isReady())
	//console.log(value)
}).catch(console.error);

function authorize(user) {
	console.log(user.permissions);
	if (user.permissions.has(Discord.Permissions.FLAGS.ADMINISTRATOR)) return true;
	console.log("FAILED");
	if (user.roles.cache.some(role => role.name == "reaper-admin")) return true;
	return false;
}

let i = 0;

//setInterval(() => {i++; console.log(client.isReady(), i);}, 500);