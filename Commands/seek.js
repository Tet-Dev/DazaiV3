const { GuildCommand, NumberArgument, IntArgument } = require("eris-boiler/lib");
const MusicHandler = require("../Handlers/MusicV5");
const TetLib = require("../Handlers/TetLib");
module.exports = new GuildCommand({
	name: "seek", // name of command
	description: "Seek through a song",
	run: (async (client, { msg, params,channel }) => {
		console.log(await MusicHandler.seek(channel.guild.id,Number(params[0]),false));
		return `Seeking to ${TetLib.SecsToFormat((await MusicHandler.seek(channel.guild.id,Number(params[0]),false))/1000)}`;
	}),
	options: {
		permissionNode: "seek",
		// aliases: ["q"]
		parameters: [new IntArgument("seconds", "How many seconds to skip forwards or negative for backwards. DOES NOT ACCEPT MINUTES:SECONDS",false)],

	}
}); 