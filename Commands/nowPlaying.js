const { Message } = require("eris");
const { DataClient } = require("eris-boiler");
const { GuildCommand } = require("eris-boiler/lib");
const MusicDrawer = require("../Handlers/MusicDrawer");
const MusicHandler = require("../Handlers/MusicV5");
const TetLib = require("../Handlers/TetLib");
module.exports = new GuildCommand({
	name: "nowplaying", // name of command
	description: "Returns whats popping right now",
	run: (async (client, context) => {
		// Declare Types 
		/** @type {DataClient} */
		let bot = client;
		/** @type {Message} */
		let msg = context.msg;
		/** @type {Array<String>} */
		let params = context.params;
		/** @type {import("../Handlers/MusicV5").GuildData} */
		let gdata = MusicHandler.getGuildData(msg.guildID);
		if (!gdata || !gdata.playing) return "Theres nothing playing right now!";
		// let newMsg = await msg.channel.createMessage({
		// 	embed: {
		// 		title: gdata.currentlyPlaying.trackData.info.title,
		// 		description: `
		// 		${gdata.currentlyPlaying.trackData.info.author}

		// 		${TetLib.SecsToFormat(gdata?.player?.state?.position / 1000)} / ${TetLib.SecsToFormat(gdata.currentlyPlaying.trackData.info.length / 1000)}`,
		// 		thumbnail: {
		// 			url: "https://cdn.discordapp.com/avatars/747901310749245561/0d1cca7ffaa402de6a0d73e28734c13f.png?size=256",
		// 		},
		// 		footer: {
		// 			text: `Requested By: ${gdata.currentlyPlaying.requester.nick || gdata.currentlyPlaying.requester.username}#${gdata.currentlyPlaying.requester.discriminator}`
		// 		},
		// 		url: gdata.currentlyPlaying.trackData.info.uri
		// 	}
		// });
		msg.channel.sendTyping();
		let bufferThing = await MusicDrawer.generateNowPlayingCard(gdata.currentlyPlaying.trackData, `${gdata.currentlyPlaying.requester.nick || gdata.currentlyPlaying.requester.username}#${gdata.currentlyPlaying.requester.discriminator}`, gdata, msg.channel);

		await msg.channel.createMessage("",
			{
				file: bufferThing, name: "Dazai.png"
			});
		return;
	}),
	options: {
		permissionNode: "nowplaying",
		aliases: ["np"],
		// parameters: [],
	} // functionality of command
	// list of things in object passed to run: bot (Databot), msg (Message), params (String[])
});