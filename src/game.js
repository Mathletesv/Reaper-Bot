const Player = require("./player.js")
const { timeFromSeconds } = require("./utility.js");

class Game {
    constructor(guildID, channelID, goal, cooldown, modifiers) {
        this.guildID = guildID;
        this.channelID = channelID;
        this.goal = goal;
        this.cooldown = cooldown;
        this.modifiers = modifiers;
        this.lastReap = Date.now();
        this.players = {};
    }
    reap(user, now) {
        let id = user.id;
        if (!(id in this.players)) {
            this.players[id] = new Player(id, user.username);
        }
        let waitedTime = (now - this.players[id].lastReap) / 1000;
        if (!isNaN(this.players[id].lastReap) && waitedTime < this.cooldown) {
            return "You can't reap yet, wait " +
                timeFromSeconds(this.cooldown - waitedTime)
                + " (" + Math.ceil(this.cooldown - waitedTime) + " seconds)";
        }
        console.log(this.players[id].lastReap, (now - this.players[id].lastReap) / 1000)
        let reapedTime = (now - this.lastReap) / 1000;
        this.lastReap = now;
        return this.players[id].reap(now, reapedTime, this.modifiers, this.goal);
    }
    freeReap(user, now) {
        let id = user.id;
        if (!(id in this.players)) {
            this.players[id] = new Player(id, user.username);
        }
        if (this.players[id].freeReaps == 0) return "You don't have any free reaps!";
        this.players[id].freeReaps--;
        let reapedTime = (now - this.lastReap) / 1000;
        this.lastReap = now;
        return this.players[id].reap(now, reapedTime, this.modifiers, this.goal, true);
    }
    cd(id) {
        if (!(id in this.players)) return "This player has not joined the game.";
        let waitedTime = (Date.now() - this.players[id].lastReap) / 1000;
        if (!isNaN(this.players[id].lastReap) && waitedTime < this.cooldown) {
            return this.players[id].name + " needs to wait " +
                timeFromSeconds(this.cooldown - waitedTime)
                + " (" + Math.ceil(this.cooldown - waitedTime) + " seconds) to reap.";
        }
        return this.players[id].name + " can reap."
    }
    stats(id) {
        if (!(id in this.players)) return "This player has not joined the game.";
        let person = this.players[id];
        return person.name + " has " + person.points + " points from a total of "
            + person.reaps + " reaps for an average of " + person.points / person.reaps + " points per reap. They have " + person.freeReaps + " free reaps.";
    }
    end() {
        return Object.values(this.players);
    }
	lb(page) {
		let players = Object.values(this.players).sort((a, b) => { return b.points - a.points });
		let returnArr = [];
		for (let i = (page - 1) * 10; i <= Math.min(players.length - 1, page * 10); i++) {
			returnArr.push(players[i]);
		}
		return returnArr;
	}
    toJSON() {
        let json = {
            guildID: this.guildID,
            channelID: this.channelID,
            goal: this.goal,
            cooldown: this.cooldown,
			lastReap: this.lastReap,
            modifiers: this.modifiers,
            players: {}
        };
        for (let id in this.players) {
            json.players[id] = this.players[id].toJSON();
		}
		return JSON.stringify(json);
	}

	static fromJSON(data) {
        let game = new Game(data.guildID, data.channelID, data.goal, data.cooldown, data.modifiers) 
		game.lastReap = data.lastReap;
		for (let id in data.players)
		{
            game.players[id] = Player.fromJSON(data.players[id]);
        }
        return game;
    }
}

module.exports = Game;