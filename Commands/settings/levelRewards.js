const { SettingCommand, StringArgument } = require("eris-boiler/lib");
const { StringArgumentChoice } = require("eris-boiler/lib/arguments/choices");
const { ReactionCollector, MessageCollector } = require("eris-collector");

// const pluri
function getNextMessageForPrompt(bot, channel, user) {
	return new Promise((res, rej) => {
		let msgs = new MessageCollector(bot, channel, (m) => m.author.id === user.id, { max: 1 });
		msgs.on("collect", masg => {
			res(masg);
		});
		setTimeout(() => {
			res("to");
		}, 300000);
	});
}
const EmbedPaginator = require("eris-pagination");
const AuditLogHandler = require("../../Handlers/AuditLogHandler");
const Pagination = require("../../Handlers/Pagination");
function parseLevelRewards(str) {
	if (!str) return [];
	return str.split("||").map(x => {
		if (!x) return null;
		let qd = x.split(",");
		return {
			level: qd[0].replace(/\|/g, ""),
			roleID: qd[1],
		};
	}).filter(x => x);
}
function stringifyLevelRewards(arr) {
	return arr.map(x => x.level + "," + x.roleID).join("||");
}
module.exports = new SettingCommand({
	name: "levelreward",
	description: "Creates, Deletes or Lists all possible role rewards for hitting a certain level",
	options: {
		parameters: [new StringArgument("option", "create/delete/list reaction roles!", false, [new StringArgumentChoice("create", "create"), new StringArgumentChoice("delete", "delete"), new StringArgumentChoice("list", "list")])],
		permissionNode: "admin",
		// permission
	},
	displayName: "Level Rewards",
	getValue: async (bot, { channel }) => {
		let guildData = await bot.SQLHandler.getGuild(channel.guild.id);
		let parsedAwards = parseLevelRewards(guildData.levelrewards);
		return "Customize roles awarded at certain levels!\n" + parsedAwards.length + "/50 Used.";
	},
	run: async (bot, { msg, params, channel, member, user }) => {

		// let msgs = await channel.awaitMessages({filter: (m) => m.author.id === msg.author.id,count:1});
		let guildData = await bot.SQLHandler.getGuild(channel.guild.id);
		let parsedAwards = parseLevelRewards(guildData.levelrewards);
		if (params[0].toLowerCase() === "create") {

			if (parsedAwards.length >= 50) return "You can only have 50 Level Reward Roles per server!";
			await bot.createMessage(channel.id, "What level would you like to gain this Role? (Enter a whole number or `cancel` to cancel");
			let res1 = await getNextMessageForPrompt(bot, channel, user);
			while (res1.content && (parseInt(res1.content) == 0 || isNaN(parseInt(res1.content))) && res1.content.toLowerCase() !== "cancel") {
				await bot.createMessage(channel.id, "Error! Your response was invalid! \nWhat level would you like to gain this Role? (Enter a whole number or `cancel` to cancel");
				res1 = await getNextMessageForPrompt(bot, channel, user);
			}
			let level = parseInt(res1.content);
			await bot.createMessage(channel.id, "*50% Complete* | What Role would you like to give out once a user has reached level *" + parseInt(level) + "*? (Give a role id or mention the role or `cancel` to cancel)");
			res1 = await getNextMessageForPrompt(bot, channel, user);
			let roles = member.guild.roles.map(x => x.id);
			let rolemen = res1.content.replace("<", "").replace("@", "").replace("&", "").replace(">", "");
			while (res1.content && res1.content.toLowerCase() !== "cancel" && (roles.filter(x => x === rolemen).length === 0)) {
				await bot.createMessage(channel.id, "I could not find the role you mentioned!\nWhat Role would you like to give out once a user has reached level *" + parseInt(res1.content) + "*? (Give a role id or mention the role or `cancel` to cancel)");
				res1 = await getNextMessageForPrompt(bot, channel, user);
				rolemen = res1.content.replace("<", "").replace("@", "").replace("&", "").replace(">", "");
			}
			if (!res1.content || res1.content.toLowerCase() === "cancel") {
				return "Request Cancelled!";
			}
			parsedAwards.push({
				level: level,
				roleID: rolemen
			});
			parsedAwards.sort((a, b) => a.level - b.level);
			await bot.SQLHandler.updateGuild(channel.guild.id, { levelrewards: stringifyLevelRewards(parsedAwards) });
			await AuditLogHandler.sendAuditLogMessage(channel.guild.id, "Added Level Up Role Award", `Members who reach level ${level} will now gain the role <@&${rolemen}>`, 0, member.user);
			return { embed: { description: "Creating a Level Up Reward Where when a user gets to Level **" + level + "**, They get the role <@&" + rolemen + ">" } };
		} else if (params[0].toLowerCase() === "list") {
			if (parsedAwards.length == 0) return "No Levelup Rewards";
			let splits = parsedAwards.map((y, ind) => "`" + (ind < 1000 ? (ind < 100 ? (ind < 10 ? "000" + ind : "00" + ind) : "0" + ind) : ind) + "`) When a user gets to level **" + y.level + "** give them the role <@&" + y.roleID + ">").chunk_inefficient(10);
			let pagi = splits.map(x => {

				return {
					description: x.join("\n")
				};
			});
			if (pagi.length == 1) {
				bot.createMessage(channel.id, { embed: pagi[0] });
			}
			let refmsg = await channel.createMessage(".");
			new Pagination(pagi,channel.id, (m, emoji, userID) => ((userID.id ? userID.id : userID) === member.id))
		} else if (params[0].toLowerCase() === "delete") {
			await bot.createMessage(channel.id, "What Level Reward would you like to delete (Enter the ID found in `settings levelreward list` or `cancel` to cancel");
			let res1 = await getNextMessageForPrompt(bot, channel, user);
			while (res1.content && (isNaN(parseInt(res1.content))) && res1.content.toLowerCase() !== "cancel") {
				await bot.createMessage(channel.id, "Error! Your response was invalid! \nWhat Level Reward would you like to delete (Enter the ID found in `settings levelreward list` or `cancel` to cancel");
				res1 = await getNextMessageForPrompt(bot, channel, user);
			}
			if (!res1.content || res1.content.toLowerCase() === "cancel") {
				return "Request Cancelled!";
			}
			let id = parseInt(res1.content);
			await bot.createMessage(channel.id, { embed: { description: "Are you sure you want to delete the Levelup award with the ID `" + id + "`?(Type `y` or `n`) Levelup award info :\nGain the role <@&" + parsedAwards[id].roleID + "> When a user reaches level " + parsedAwards[id].level } });
			res1 = await getNextMessageForPrompt(bot, channel, user);
			while (res1.content && !res1.content.toLowerCase().startsWith("y") && !res1.content.toLowerCase().startsWith("n")) {
				await bot.createMessage(channel.id, "Error! Your response was invalid! Accepted Responses: `y` or `n`");
				res1 = await getNextMessageForPrompt(bot, channel, user);
			}
			if (!res1.content || res1.content.toLowerCase().startsWith("n")) {
				return "Request Cancelled!";
			}
			let deletedItem = parsedAwards[id];

			parsedAwards.splice(id, 1);
			await bot.SQLHandler.updateGuild(channel.guild.id, { levelrewards: stringifyLevelRewards(parsedAwards) });
			await AuditLogHandler.sendAuditLogMessage(channel.guild.id, "Removed Level Up Role Award", `Members who reach level ${deletedItem.level} will no longer gain the role <@&${deletedItem.roleID}>`, 0, member.user);
			return "Deleted LevelUp Reward!";

		}



	}
});
