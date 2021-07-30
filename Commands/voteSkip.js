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
	name: "voteskip", // name of command
	description: "votes to skip the next song",
	run: (async (client, context) => {
		// Declare Types 
		/** @type {DataClient} */
		let bot = client;
		/** @type {Message} */
		let msg = context.msg;
		/** @type {Array<String>} */
		let params = context.params;
		let member = context.member;

		let guildData = MusicHandler.getGuildData(context.channel.guild.id);
		if (!guildData || !guildData.playing) return "There isn't anything playing right now! Hop into a Voice Channel and play some music!";
		if (member?.voiceState?.channelID !== guildData.player.channelId) return "You must be in the same Voice Channel as the bot to VoteSkip!";
		let minimumRequired = Math.ceil(bot.getChannel(guildData.player.channelId).voiceMembers.filter(member=>!member.bot).length/2);
		if (guildData.skips.size >= minimumRequired)
		{
			channel.createMessage("Skipping Song with at least 50% of the vote!.");
			guildData.player.stop();
			return;
		}
		if (guildData.skips.has(member.id)) return `You already voted to skip this song! ${guildData.skips.size} / ${bot.getChannel(guildData.player.channelId).voiceMembers.filter(member=>!member.bot).length} voted to skip! You need 50% of the participants in this Voice Channel or ${minimumRequired} users to skip.`;
		guildData.skips.add(member.id);
		if (guildData.skips.size >= minimumRequired)
		{
			context.channel.createMessage("Skipping Song with at least 50% of the vote!.");
			guildData.player.stop();
			return;
		}
		context.channel.createMessage(`You have voted to skip this song! ${guildData.skips.size} / ${bot.getChannel(guildData.player.channelId).voiceMembers.filter(member=>!member.bot).length} voted to skip! You need 50% of the participants in this Voice Channel or ${minimumRequired} users to skip.`);

	}),
	options: {
		permissionNode: "voteSkip",
		aliases: ["vs"],
		// parameters: [],
	} // functionality of command
});