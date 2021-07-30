const { Command } = require("eris-boiler");
const moment = require("moment");
const os = require("os");
const { join } = require("path");
const MusicHandler = require("../Handlers/MusicV5");
module.exports = new Command({
	name: "test",
	description: "Runs test functions ",
	options: {
	},
	run: (async (bot, { msg, params,user }) => {
		if (!process.env.botMasters.includes(user.id))
			return "Only the bot owner may run this command!";
		msg.channel.createMessage(JSON.stringify(MusicHandler.runTest()));
		return "Test ran	!";
	})
});