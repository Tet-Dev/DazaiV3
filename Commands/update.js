const { Command } = require("eris-boiler");
const moment = require("moment");
const os = require("os");
const { join } = require("path");
const MusicHandler = require("../Handlers/MusicV5");
const simpleGit = require('simple-git');
module.exports = new Command({
	name: "update",
	description: "pulls latest updates from gh. (Bot Owner required) **DOES NOT RELOAD EVENTS**",
	options: {
	},
	run: (async (bot, { msg, params }) => {
		if (!process.env.botMasters.includes(msg.author.id))
			return "Only the bot owner may run this command!";
		const git = simpleGit();
		await msg.channel.createMessage(`:warning: **${msg.author.username}**, I'm pulling updates for the bot. This may take a while. :warning:`);
		await git.pull();
		await msg.channel.createMessage("I have finished pulling updates! Applying said updates...");
		Object.keys(require.cache).forEach(
			(key) => {
				if (!key.includes("/Handler"))
					delete require.cache[key];
			});
		bot.addCommands(join(process.cwd(), "Commands"));
		bot.addEvents(join(process.cwd(), "Events"));
		return "Commands reloaded!";
	})
});