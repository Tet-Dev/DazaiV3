const { DiscordEvent } = require("eris-boiler/lib");
const axios = require("axios");
const faces = ["(・`ω´・)", ";;w;;", "owo", "UwU", ">w<", "^w^"];
const httpRegex = /(\b(https?|ftp):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/gim;
function parseEmotes(str) {
	let allEStr = str.split("|").filter(x => x);
	return allEStr.map(x => {
		let miniargs = x.split(",");
		let msgChannel = miniargs[0].split("§");
		let emoot = miniargs[1];
		return {
			channel: msgChannel[0],
			id: msgChannel[1],
			emote: miniargs[1].replace("<", "").replace(/\:/g, "").replace(">", ""),
			roleID: miniargs[2]
		};
	});
}
let reroCache = new Map();
module.exports = new DiscordEvent({
	name: "messageReactionAdd",
	run: async (bot, msg, emoji, reactor) => {
		if (!msg.guildID) return;
		let emotesList;
		let data = await bot.SQLHandler.getGuild(msg.guildID);
		emotesList = data.reactionroles ? parseEmotes(data.reactionroles.replace(/\<\@\&/g, "").replace(/\>/g, "")) : [];
		if (emotesList.length === 0) return;
		let possiblereros = emotesList.filter(x => x.id === msg.id && x.channel === msg.channel.id && (x.emote === emoji.name || x.emote === emoji.id));
		if (possiblereros.length === 0) return;
		let gainRoles = possiblereros.map(x => x.roleID);

		gainRoles.forEach(async (roleid) => {
			await bot.addGuildMemberRole(msg.channel.guild.id, reactor, roleid, "Reaction Role, Message `" + msg.channel.id + "-" + msg.id + "`");
		});
	}
});