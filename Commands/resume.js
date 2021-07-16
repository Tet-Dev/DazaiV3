const { GuildCommand } = require("eris-boiler/lib");
const MusicHandler = require("../Handlers/MusicV5");
module.exports = new GuildCommand({
	name: "resume", // name of command
	description: "Resumes music when paused.",
	run: (async (client, { msg, params }) => {
		try {
			let resp = await MusicHandler.resume(msg.guildID);
			if (resp) return "Music resumed!";
			else return "The music wasn't paused?";	
		} catch (error) {
			return "Nothing playing?";
		}


	}),
	options:{
		permissionNode: "resumeMusic",
		// aliases: ["q"]
		// parameters: ["The index of the item or \"all\" to purge the queue"]
	}
});