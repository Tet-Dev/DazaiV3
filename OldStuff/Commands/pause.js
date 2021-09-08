const { GuildCommand } = require("eris-boiler/lib");
const MusicHandler = require("../../Handlers/MusicV5");
module.exports = new GuildCommand({
	name: "pause", // name of command
	description: "Pauses music.",
	run: (async (client, { member, params }) => {
		try {
			let resp = await MusicHandler.pause(member.guild.id);
			if (resp) return "Music paused!";
			else return "The music was already paused?";
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