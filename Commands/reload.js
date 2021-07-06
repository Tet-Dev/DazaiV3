const { Command } = require("eris-boiler");
const moment = require("moment");
const os = require("os");
const { join } = require("path");
const MusicHandler = require("../Handlers/MusicV5");
module.exports = new Command({
	name: "reload",
	description: "Reloads bot commands live without restart. (Bot Owner required) **DOES NOT RELOAD EVENTS**",
	options: {
	},
	run: (async (bot, { msg, params }) => {
		if (!process.env.botMasters.includes(msg.author.id))
			return "Only the bot owner may run this command!";
		Object.keys(require.cache).forEach( (key) => { delete require.cache[key]; });
		bot.addCommands(join(process.cwd(), "Commands"));
		return "Commands reloaded!";
	})
});