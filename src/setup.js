const Discord = require("discord.js");

async function setup(client) {
    console.log(`Logged in as ${client.user.tag}!`);
    if (!client.application) await client.application.fetch();
    // await delete_command("reap", client);
    // await delete_command("timer", client);
    // await delete_command("stats", client);
    // await delete_command("leaderboard", client);
    // await delete_command("end", client);
    // await delete_command("start", client);
    // await delete_command("cooldown", client);
    // await delete_command("timecalc", client);
	console.log("test");
	client.application.commands.fetch().then(commands => console.log(`Fetched ${commands.size} commands`)).catch(console.error);
	// await client.application.commands.create({
    //     name: "reap",
    //     description: "Reap the time in the timer."
    // }).then().catch(console.error);
    // await client.application.commands.create({
    //     name: "freereap",
    //     description: "Use a free reap to reap the time in the timer."
    // }).then().catch(console.error);
    // await client.application.commands.create({
    //     name: "timer",
    //     description: "Get the time in the timer.",
    //     options: [{
    //         name: "private",
    //         description: "Whether only you can see the result or not. Default is false.",
    //         type: 5,
    //     }]
    // }).then().catch(console.error);
    // await client.application.commands.create({
    //     name: "stats",
    //     description: "Get a user's statistics.",
    //     options: [{
    //         name: "user",
    //         description: "The user to get the statistics for. Default is you.",
    //         type: 6,
    //     },
    //     {
    //         name: "private",
    //         description: "Whether only you can see the result or not. Default is false.",
    //         type: 5,
    //     }]
    // }).then().catch(console.error);
    // await client.application.commands.create({
    //     name: "leaderboard",
    //     description: "Get multiple people's statistics at once.",
    //     options: [{
    //         name: "page",
    //         description: "The page of the leaderboard, up to 10 users per page.",
    //         type: 4,
	// 		minValue: 1,
    //     },
    //     {
    //         name: "private",
    //         description: "Whether only you can see the result or not. Default is false.",
    //         type: 5,
    //     }]
    // }).then().catch(console.error);
    // await client.application.commands.create({
    //     name: "end",
    //     description: "End the ongoing game early. Requires a role named \"Reaper Admin\" or Administrator permissions."
    // }).then().catch(console.error);
    // await client.application.commands.create({
    //     name: "start",
    //     description: "Starts a new reaper game. Requires a role named \"Reaper Admin\" or Administrator permissions.",
    //     options: [{
    //         name: "goal",
    //         description: "The number of seconds to reap to win the game.",
    //         type: 4,
    //         required: true,
    //     },
    //     {
    //         name: "cooldown",
    //         description: "The time, in seconds, people must wait between reaps.",
    //         type: 4,
    //         required: true,
    //     },
    //     {
    //         name: "modifiers",
    //         description: "The chance to add 1 to the multiplier. <2 for no modifiers. Free reaps are as likely as 3x reaps.",
    //         type: 4
    //     },
    //     {
    //         name: "wait",
    //         description: "An optional amount of seconds to wait before starting the game.",
    //         type: 4
    //     }]
    // }).then().catch(console.error);
    // await client.application.commands.create({
    //     name: "cooldown",
    //     description: "Get a user's reap cooldown.",
    //     options: [{
    //         name: "user",
    //         description: "The user to get the cooldown for. Default is you.",
    //         type: 6,
    //     },
    //     {
    //         name: "private",
    //         description: "Whether only you can see the result or not. Default is false.",
    //         type: 5,
    //     }]
    // }).then().catch(console.error);
    // await client.application.commands.create({
    //     name: "timecalc",
    //     description: "Calculate the number of seconds from a number of hours, minutes, and seconds.",
    //     options: [{
    //         name: "hours",
    //         description: "The amount of hours.",
    //         type: 4,
    //     },
    //     {
    //         name: "minutes",
    //         description: "The amount of minutes.",
    //         type: 4,
    //     },
    //     {
    //         name: "seconds",
    //         description: "The amount of seconds.",
    //         type: 4,
    //     }]
    // }).then().catch(console.error);
    console.log("SETUP COMPLETE");
}

module.exports = setup;

/*async function delete_command(name, client) {
    await client.application.commands.create({
        name: name,
        description: "lol"
    }).then(async function (command) {
        await client.application.commands.delete(command);
    }).catch(console.error);
}*/