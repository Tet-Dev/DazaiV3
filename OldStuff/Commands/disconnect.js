const { GuildCommand } = require("eris-boiler/lib");
const MusicHandler = require("../Handlers/MusicV5");
module.exports = new GuildCommand({
	name: "disconnect", // name of command
	description: "Disconnects the bot. from the VC",
	run: (async (client, { channel, params }) => {
		MusicHandler.stop(channel.guild.id);
		return ("Disconnected.");

	}),
	options:{
		permissionNode: "forceDC",
		aliases: ["dc"]
		// parameters: ["The index of the item or \"all\" to purge the queue"]
	}
});