const { GuildCommand } = require("eris-boiler/lib");
const MusicHandler = require("../Handlers/MusicV5");
const TetLib = require("../Handlers/TetLib");
module.exports = new GuildCommand({
	name: "seek", // name of command
	description: "Seek through a s",
	run: (async (client, { msg, params }) => {
		console.log(await MusicHandler.seek(msg.guildID,Number(params[0]),false));
		return `Seeking to ${TetLib.SecsToFormat((await MusicHandler.seek(msg.guildID,Number(params[0]),false))/1000)}`;
	}),
	options: {
		permissionNode: "seek",
		// aliases: ["q"]
		parameters: ["How many seconds to skip forwards or negative for backwards. Accepts decimals **DOES NOT ACCEPT MINUTES:SECONDS**"],

	}
}); 