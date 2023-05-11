class Player {
    constructor(id, name) {
        this.id = id;
        this.name = name;
        this.points = 0;
        this.reaps = 0;
        this.freeReaps = 0;
        this.lastReap = null;
    }
    reap(reapWhen, reapTime, modifiers, goal, freeReaped = false) {
		console.log("ENTERED");
        this.reaps++;
		if (!freeReaped) {
			this.lastReap = reapWhen;
		}
        let multiplier = 1;
        let freeReap = false;
        while (modifiers >= 2 && Math.floor(Math.random() * modifiers) == 0) {
            multiplier++;
        }
        if (modifiers >= 2 && Math.floor(Math.random() * modifiers) == 0 && Math.floor(Math.random() * modifiers) == 0) {
            freeReap = true;
            this.freeReaps++;
        }
        let points = Math.round(multiplier * reapTime);
        this.points += points;
        let text = "You reaped " + points + " points. You now have " + this.points + " points!";
        if (multiplier > 1) {
            text = "You got a " + multiplier + "x reap! " + text;
        }
        if (freeReap) {
            text += " You also gained a freeReap!";
        }
        if (this.points > goal) {
            return "WIN " + text;
        }
		console.log(text);
        return text;
    }
    toJSON() {
        return {
            id: this.id,
            name: this.name,
            points: this.points,
            reaps: this.reaps,
            freeReaps: this.freeReaps,
            lastReap: this.lastReap
        };
    }
    static fromJSON(data) {
        let player = new Player(data.id, data.name);
        player.points = data.points;
        player.reaps = data.reaps
        player.freeReaps = data.freeReaps;
        player.lastReap = data.lastReap;
        return player;
    }
}

module.exports = Player;