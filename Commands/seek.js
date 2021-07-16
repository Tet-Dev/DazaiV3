const { GuildCommand } = require("eris-boiler/lib");
const MusicHandler = require("../Handlers/MusicV5");
module.exports = new GuildCommand({
	name: "seek", // name of command
	description: "Seek through a s",
	run: (async (client, { msg, params }) => {
		await MusicHandler.seek(msg.guildID,Number(params[0]),false); 
		return 
	}),
	options: {
		permissionNode: "seek",
		// aliases: ["q"]
		parameters: ["How many seconds to skip forwards or negative for backwards. Accepts decimals **DOES NOT ACCEPT MINUTES:SECONDS**"],

	}
}); 