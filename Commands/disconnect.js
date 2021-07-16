const { GuildCommand } = require("eris-boiler/lib");
const MusicHandler = require("../Handlers/MusicV5");
module.exports = new GuildCommand({
	name: "disconnect", // name of command
	description: "Disconnects the bot.",
	run: (async (client, { msg, params }) => {
		MusicHandler.stop(msg.channel.guild.id);
        return ("Disconnected.");

	}),
	options:{
		permissionNode: "forceDC",
		aliases: ["dc"]
		// parameters: ["The index of the item or \"all\" to purge the queue"]
	}
});