const { GuildCommand } = require("eris-boiler/lib");
const MusicHandler = require("../Handlers/MusicV5");
module.exports = new GuildCommand({
	name: "forceskip", // name of command
	description: "Skips song by force (forceSkip permission required)",
	run: (async (client, context) => {
		// Declare Types 
		/** @type {DataClient} */
		let bot = client;
		/** @type {Message} */
		let msg = context.msg;
		/** @type {Array<String>} */
		let params = context.params;

		let guildData = MusicHandler.getGuildData(msg.guildID);
		if (!guildData || !guildData.playing) return "There isn't anything playing right now! Hop into a Voice Channel and play some music!";
		msg.channel.createMessage(`Skipping Song via ForceSkip from ${msg.author.mention}`);
		guildData.player.stop();
		return;
	}),
	options: {
		permissionNode: "forceSkip",
		aliases: ["fs"],
		// parameters: [],
	} // functionality of command
	// list of things in object passed to run: bot (Databot), msg (Message), params (String[])
});