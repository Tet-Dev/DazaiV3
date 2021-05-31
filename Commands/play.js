const { GuildCommand } = require("eris-boiler/lib");
const ReactionHandler = require("eris-reactions");
const { ReactionCollector, MessageCollector } = require("eris-collector");
const { DataClient } = require("eris-boiler");
const { Message } = require("eris");
const MusicHandler = require("../Handlers/MusicV5");
//------------------------------------------------ BASIC CONSTS
const sleep = (delay) => new Promise((resolve) => setTimeout(resolve, delay));
//------------------------------------------------
function text_truncate(str, len) {
	let array = str.split("");
	array.length = len - 3;
	return array.join("") + "...";
}
function SecsToFormat(string) {
	let sec_num = parseInt(string, 10);
	let hours = Math.floor(sec_num / 3600);
	let minutes = Math.floor((sec_num - hours * 3600) / 60);
	let seconds = sec_num - hours * 3600 - minutes * 60;
	if (hours < 10) hours = "0" + hours;
	if (minutes < 10) minutes = "0" + minutes;
	if (seconds < 10) seconds = "0" + seconds;
	return hours + ":" + minutes + ":" + seconds;
}
function getChoice(bot, msg, userid) {
	return new Promise(async (res, rej) => {
		let filter = (m, emoji, userID) => userID === userid;
		/* Create collector */
		let collector = new ReactionCollector(bot, msg, filter, {
			time: 1000 * 60
		});
		collector.on("collect", (m, emoji, userID) => {
			res(emoji);
		});
		setTimeout(() => {
			msg.delete();
			res(null);
		}, 60000);
	});
}
module.exports = new GuildCommand({
	name: "play", // name of command
	description: "Plays music.",
	run: (async (client, context) => {
		// Declare Types 
		/** @type {DataClient} */
		let bot = client;
		/** @type {Message} */
		let msg = context.msg;
		/** @type {Array<String>} */
		let params = context.params;

		let channelID = msg?.member?.voiceState?.channelID;
		let search = params.join(" ");
		if (channelID) {
			await MusicHandler.joinVC(channelID, msg.channel)
			let spotifyType = search.match(/(?<=https:\/\/open.spotify.com\/)(playlist|album|track)\/\w+/);
			let spotifyID;
			if (spotifyType) {
				[spotifyType, spotifyID] = spotifyType[0].split("/");
				spotifyType = spotifyType.toLowerCase();
				msg.channel.createMessage("Loading content..");
				let restracks
				if (spotifyType === "playlist") restracks = await MusicHandler.self.spotiPlaylist(spotifyID);
				else if (spotifyType === "album") restracks = await MusicHandler.self.spotiAlbum(spotifyID);
				else if (spotifyType === "track") {
					let resTrack = await MusicHandler.self.spotiSong(spotifyID);
					let resthing = await MusicHandler.addToQueue(resTrack, msg, MusicHandler.getGuildData(msg.guildID));
					if (resthing)
						msg.channel.createMessage(resthing);
					return;
				}
				restracks = restracks.filter(x => x);
				let resthing;
				if (restracks.length)
					resthing = await MusicHandler.addArrayToQueue(restracks, msg, MusicHandler.getGuildData(msg.guildID));
				if (resthing)
					msg.channel.createMessage(resthing);
			}
			else if (search.includes("list=")) {
				// DazaiMsg(msg.channel.id, "Sorry! Playlists are Disabled atm!")
				// return
				let resTrack = await MusicHandler.self.resolveTrack(search);
				let resthing = await MusicHandler.queueArray(msg, resTrack.tracks);
				if (resthing)
					msg.channel.createMessage(resthing);
			} else if (search.split("https://www\.youtube\.com/watch?").length > 1 || search.includes("https://youtu.be/")) {
				let resTrack = await MusicHandler.self.resolveTrack(search);
				let resthing = await MusicHandler.addToQueue(resTrack?.tracks[0],msg,MusicHandler.getGuildData(msg.guildID)).catch(er => console.trace(er));
				if (resthing)
					msg.channel.createMessage(resthing);

			} else {
				let searchArr = await MusicHandler.self.getTracksFromSearch(search);//, { limit: 20 }).catch(er => console.trace(er));
				// if (!searchArr || ! searchArr.items) searchArr = await  ytsr(search, { limit: 20 }).catch(er => console.trace(er));
				// if (!searchArr || !searchArr.items) return "I could not find anything relating to your search.";
				// searchArr.items = searchArr.items.filter(x => x && x.type === "video");
				if (searchArr.tracks.length > 8) searchArr.tracks.length = 8;
				const choices = ["1️⃣", "2️⃣", "3️⃣", "4️⃣", "5️⃣", "6️⃣", "7️⃣", "8️⃣"];
				let fields = searchArr.tracks.map((x, ind) => {

					return {
						name: choices[ind] + " | " + x.info.title,
						value: `${SecsToFormat(Math.round(x.info.length / 1000))} | [「Link」](${x.info.uri})\nBy: 《${x.info.author}》`,
						inline: false,
					};
				});

				let promptMSG = await bot.createMessage(msg.channel.id, {
					embed: {


						description: "Select which one you would like to play!",
						color: 0,
						fields: fields,
					},
				});
				promptMSG.addReaction("❌");
				(async () => {

					for (var i = 0; i < fields.length; i++) {

						try {
							let failed = false;
							await promptMSG.addReaction(choices[i]).catch(() => {
								failed = true;
							});
							if (failed) break;
						} catch (er) {
							break;
						}
					}
				})();
				let choice = await getChoice(bot, promptMSG, msg.author.id);
				if (!choice) return;
				if (choice.name === "❌") promptMSG.delete();
				for (var i = 0; i < choices.length; i++) {
					if (choice.name === choices[i]) {
						let resthing = await MusicHandler.queueSong(msg, searchArr.tracks[i],);
						if (resthing)
							msg.channel.createMessage(resthing);
						promptMSG.delete();
						break;
					}
				}
			}

		} else {
			return "You are not in a vc!";
		}

	}),
	options: {
		permissionNode: "playSong",
		aliases: ["p"],
		parameters: ["Song Youtube Link / Spotify Playlist / Youtube Playlist / Song Name"]
	} // functionality of command
	// list of things in object passed to run: bot (Databot), msg (Message), params (String[])
});