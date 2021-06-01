const { GuildCommand } = require("eris-boiler/lib");
const ReactionHandler = require("eris-reactions");
const { DataClient } = require("eris-boiler");
const { Message } = require("eris");
const MusicHandler = require("../Handlers/MusicV5");
const TetLib = require("../Handlers/TetLib");
const EmbedPaginator = require("eris-pagination");
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
	name: "queue", // name of command
	description: "Views the music queue.",
	run: (async (client, context) => {
		// Declare Types 
		/** @type {DataClient} */
		let bot = client;
		/** @type {Message} */
		let msg = context.msg;
		/** @type {Array<String>} */
		let params = context.params;

		let guildData = MusicHandler.getGuildData(msg.guildID);
		if (!guildData || !guildData.queue?.length) return "There isn't anything in the queue right now! Join a Voice Channel and play some music!";
		if (guildData.queue.length > 10){
			let queuePages = TetLib.splitArrayIntoChunks(guildData.queue, 10).map((page, pageIndex) => {
				let mappedInfo = page.map((x, i) => {
					/** @type {import("../Handlers/MusicV5").SongRequest} */
					let item = x;
					return {
						name: `[ ${pageIndex * 10 + i + 1} ] ${item.trackData.info.title}`,
						value: `${SecsToFormat(Math.round(item.trackData.info.length / 1000))} | Requested by ${item.requester.mention}| [[Link]](${item.trackData.info.uri})`,
						inline: false,
	
					};
				});
				return {
					title: "Queue",
					description: "Whats up next",
					fields: mappedInfo,
				};
			});
			EmbedPaginator.createPaginationEmbed(msg,queuePages);
		}
		else {
			let mappedInfo = guildData.queue.map((x, i) => {
				let item = x;
				return {
					name: `[ ${i + 1} ] ${item.trackData.info.title}`,
					value: `${SecsToFormat(Math.round(item.trackData.info.length / 1000))} | Requested by ${item.requester.mention} | [[Link]](${item.trackData.info.uri})`,
					inline: false,

				};
			});
			bot.createMessage(msg.channel.id, {
				"embed":
				{
					title: "Queue",
					description: "Whats up next",
					fields: mappedInfo,
				}
			});
		}
	}),
	options: {
		// permissionNode: "playSong",
		aliases: ["q"],
		// parameters: [],
	} // functionality of command
	// list of things in object passed to run: bot (Databot), msg (Message), params (String[])
});