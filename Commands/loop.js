const { GuildCommand } = require("eris-boiler/lib");
const MusicHandler = require("../Handlers/MusicV5");
module.exports = new GuildCommand({
	name: "loop", // name of command
	description: "Toggles whether or not music loops (loops thru playlist)",
	run: (async (client, { msg, params }) => {
		try {
			let resp = await MusicHandler.getGuildData(msg.guildID);
			if (!resp) return "Nothing is currently playing!";
            resp.loop = !resp.loop;
            return resp.loop ? "Looping has been enabled" : "Looping has been disabled";

		} catch (error) {
			return "Nothing is playing...";
		}
	}),
	options: {
		permissionNode: "pauseMusic",
		// aliases: ["q"]
		// parameters: ["The index of the item or \"all\" to purge the queue"]
	}
}); 