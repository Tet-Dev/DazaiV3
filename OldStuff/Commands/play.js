const { GuildCommand, StringArgument } = require("eris-boiler/lib");
const ReactionHandler = require("eris-reactions");
const { DataClient } = require("eris-boiler");
const { Message, TextChannel, Member } = require("eris");
const MusicHandler = require("../Handlers/MusicV5");
const SQLHandler = require("../Handlers/SQLHandler");
const PrefixManager = require("../Handlers/PrefixManager");

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
		let filter = (userID) => userID === userid;
		let result = await ReactionHandler.collectReactions(msg, filter, {
			maxMatches: 1,
			time: 1000 * 60,
		});
		if (result[0]?.emoji?.name)
			res(result[0]?.emoji);
		else {
			// eslint-disable-next-line no-unused-vars
			msg.delete().catch(_ => { });
			res(null);
		}
	});
}
module.exports = new GuildCommand({
	name: "play", // name of command
	description: "Plays music.",
	run: (async (client, context) => {
		// Declare Types 
		/** @type {DataClient} */
		let bot = client;
		/** @type {TextChannel} */
		let channel = context.channel;
		/** @type {Member} */
		let member = context.member;
		/** @type {Array<String>} */
		let params = context.params;

		let channelID = member.voiceState?.channelID;
		let search = params.join(" ");
		if (channelID) {
			await MusicHandler.joinVC(channelID, channel);
			let spotifyType = search.match(/(?<=https:\/\/open.spotify.com\/)(playlist|album|track)\/\w+/);
			let spotifyID;
			if (spotifyType) {
				[spotifyType, spotifyID] = spotifyType[0].split("/");
				spotifyType = spotifyType.toLowerCase();
				channel.createMessage("Loading content..");
				let restracks;
				if (spotifyType === "playlist") restracks = await MusicHandler.self.spotiPlaylist(spotifyID);
				else if (spotifyType === "album") restracks = await MusicHandler.self.spotiAlbum(spotifyID);
				else if (spotifyType === "track") {
					let resTrack = await MusicHandler.self.spotiSong(spotifyID);
					let resthing = MusicHandler.addToQueue(resTrack,channel, member, member.guild.id);
					if (resthing)
						channel.createMessage(resthing);
					return;
				}
				restracks = restracks.filter(x => x);
				let resthing;
				if (restracks.length)
					resthing = MusicHandler.addArrayToQueue(restracks, member, member.guild.id);
				if (resthing)
					channel.createMessage(resthing);
			}
			else if (search.includes("list=")) {
				// return
				let resTrack = await MusicHandler.self.resolveTrack(search);
				let resthing = MusicHandler.addArrayToQueue(resTrack?.tracks, member, member.guild.id);
				if (resthing)
					channel.createMessage(resthing);
			} else if (search.split("https://www\.youtube\.com/watch?").length > 1 || search.includes("https://youtu.be/")) {
				let resTrack = await MusicHandler.self.resolveTrack(search);
				let resthing = MusicHandler.addToQueue(resTrack?.tracks[0],channel, member, member.guild.id);
				if (resthing)
					channel.createMessage(resthing);

			} else {
				let searchArr = await MusicHandler.self.getTracksFromSearch(search);
				if ((await SQLHandler.getUser(member.user.id)).autoSelectSongs) {
					let resthing = MusicHandler.addToQueue(searchArr.tracks[0],channel, member, member.guild.id);
					if (resthing)
						channel.createMessage(resthing);
					return;
				}
				if (!searchArr?.tracks || !searchArr?.tracks?.length) return channel.createMessage("No results found!");
				if (searchArr.tracks.length > 8) searchArr.tracks.length = 8;
				const choices = ["1️⃣", "2️⃣", "3️⃣", "4️⃣", "5️⃣", "6️⃣", "7️⃣", "8️⃣"];
				let fields = searchArr.tracks.map((x, ind) => {

					return {
						name: choices[ind] + " | " + x.info.title,
						value: `${SecsToFormat(Math.round(x.info.length / 1000))} | [「Link」](${x.info.uri})\nBy: 《${x.info.author}》`,
						inline: false,
					};
				});

				let promptMSG = await bot.createMessage(channel.id, {
					embed: {
						title: "Search Results",
						description: `Select which one you would like to play! (To turn this off do \`${await PrefixManager(bot, {guildID: member.guild.id})} prefs autoselectmusic on\``,
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
				let choice = await getChoice(bot, promptMSG, member.id);
				if (!choice) return;
				if (choice.name === "❌") promptMSG.delete();
				for (var i = 0; i < choices.length; i++) {
					if (choice.name === choices[i]) {
						let resthing = MusicHandler.addToQueue(searchArr.tracks[i],channel, member, member.guild.id);
						if (resthing)
							channel.createMessage(resthing);
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
		parameters: [new StringArgument("song","Provide a search term. Accepts Spotify & Youtube URLs",false)]
	}
	// list of things in object passed to run: bot (Databot), msg (Message), params (String[])
});