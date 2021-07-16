const { Member } = require("eris");
const { SettingCommand } = require("eris-boiler");
const LevellingHandler = require("../../Handlers/levelling");
const sleep = (delay) => new Promise((resolve) => setTimeout(resolve, delay));
function parseLevelRewards(str) {
	return str.split("||").map(x => {
		if (!x) return null;
		let qd = x.split(",");
		return {
			level: qd[0],
			roleID: qd[1],
		};
	}).filter(x => x);
}
module.exports = new SettingCommand({
	name: "recursivelyAddMissedLevels",
	getValue: () => "Adds back all the missed levels!",
	run: (async (bot, { msg, params }) => {
		if (!msg.guildID || msg.author.bot) return;
		let guild = await bot.SQLHandler.getGuild(msg.guildID);
		let fetchMsg = msg.channel.createMessage("Fetching all members. Time Limit : 1 Minute");
		/**
		 * @typedef {Array<Member>[]}
		 */
		let allMembers = await Promise.race([sleep(60000), msg.member.guild.fetchMembers({
			timeout: 61000
		})]);
		if (!allMembers) {
			(await fetchMsg).edit({
				content: "Could not fetch members in 1 minute :("
			});
			return;
		}
		(await fetchMsg).edit({
			content: `Fetched ${allMembers.length} members. Applying Level Rewards.`
		});
		let parseLvl = guild.levelrewards ? parseLevelRewards(guild.levelrewards) : [];
		for (let i = 0; i < allMembers.length; i++) {
			let member = allMembers[i];
			/** 
			 * @typedef {LevellingHandler}
			*/
			let handler = bot.LevellingHandler;
			let udata = await handler.getUserData(member.id, msg.guildID);
			let awards = parseLvl.filter(x => x.level <= udata.level).map(x => x.roleID);
			let rolesGained = 0;
			let lastIndex;
			await Promise.all(awards.map(async (role, ind) => {
				if (role === "none" || !role) return;
				let getRole = await member.guild.roles.filter(x => x.id === role);
				if (getRole.length == 0) return;
				getRole = getRole[0];
				lastIndex = ind;
				rolesGained++;
				await member.addRole(role, "Levelup Reward");
			}));
			if (!guild.keepRolesWhenLevel && awards.length) {
				await Promise.all(parseLvl.filter((x, ind) => ind < lastIndex).map(x => x.roleID).filter(x => member.roles.includes(x)).map(async (role) => {
					if (role === "none" || !role) return;
					let getRole = await member.guild.roles.filter(x => x.id === role);
					if (getRole.length == 0) return;
					getRole = getRole[0];
					rolesGained--;
					// bot.createMessage(dmChannel.id, "Role Lost: ```"+getRole.name + "``` from the server`"+member.guild.name+"`! ");
					await member.removeRole(role, "Levelup Role Loss");


				}));
			}
			if (guild.levelremoves) {
				let pardeDLvl = parseLevelRewards(guild.levelremoves);
				let delvlrewards = pardeDLvl.filter(x => x.level == udata.level).map(x => x.roleID);
				delvlrewards.forEach(async (role) => {
					if (role === "none" || !role) return;
					let getRole = await member.guild.roles.filter(x => x.id === role);
					if (getRole.length == 0) return;
					getRole = getRole[0];
					await member.removeRole(role, "Levelup Remove Reward");
					rolesGained;
				});
			}
			if (rolesGained)
				msg.channel.createMessage({
					embed: {
						description: `${member.username}#${member.discriminator}'s Roles have been updated. Change in role count: ${rolesGained}; ${allMembers.length - i} more members to go!`
					}
				});
		}
	}),
	description: "Recursively adds missed levels",

	options: {
		permissionNode: "administrator"
	}
});