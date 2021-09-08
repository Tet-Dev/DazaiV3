const { GuildCommand } = require("eris-boiler/lib");
const MusicHandler = require("../Handlers/MusicV5");
const TetLib = require("../Handlers/TetLib");
module.exports = new GuildCommand({
	name: "shuffle", // name of command
	description: "Skips song by force (forceSkip permission required)",
	run: (async (client, context) => {
		// Declare Types 
		/** @type {DataClient} */
		let bot = client;
		/** @type {Message} */
		let msg = context.msg;
		/** @type {Array<String>} */
		let params = context.params;

		let guildData = MusicHandler.getGuildData(context.channel.guild.id);
		if (!guildData || !guildData.queue?.length) return "There isn't anything in the queue right now! Hop into a Voice Channel and play some music!";
		TetLib.shuffle(guildData.queue);
		return "Shuffled Queue!";
	}),
	options: {
		permissionNode: "shuffle",
		// aliases: ["shu"],
		// parameters: [],
	} // functionality of command
	// list of things in object passed to run: bot (Databot), msg (Message), params (String[])
});