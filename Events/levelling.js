const { DiscordEvent } = require("eris-boiler/lib");
const LevellingHandler = require("../Handlers/LevellingHandler");
const SQLHandler = require("../Handlers/SQLHandler");
const sleep = (delay) => new Promise((resolve) => setTimeout(resolve, delay));
function getRandomInt(min, max) {
	min = Math.ceil(min);
	max = Math.floor(max);
	return Math.floor(Math.random() * (max - min)) + min;
}
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
const cooldownMaps = new Map();
module.exports = new DiscordEvent({
	name: "messageCreate",
	run: async (bot, msg) => {
		if (!bot.cooldownMaps)
			bot.cooldownMaps = cooldownMaps;
		if (!msg.guildID || msg.author.bot) return true;
		if (cooldownMaps.has(msg.author.id) && cooldownMaps.get(msg.author.id) > Date.now() / 1000) return;
		cooldownMaps.set(msg.author.id, (Date.now() / 1000));
		let guild = await SQLHandler.getGuild(msg.guildID);
		let UserCurve = await LevellingHandler.getUserCurve(msg.author.id, msg.guildID);
		let guildCurve = guild.xpCurve;
		delete UserCurve.userguildid;
		if (UserCurve.timeStarted + 86400 < (Date.now() / 1000)) {
			UserCurve.timeStarted = Math.round(Date.now() / 1000);
			UserCurve.currentlevelcurve = 0;
		}
		let amntXP = getRandomInt(Math.round(15 * (guildCurve ** UserCurve.currentlevelcurve)), Math.round(30 * (guildCurve ** UserCurve.currentlevelcurve)));
		let res = await LevellingHandler.addXP(msg.author.id, msg.guildID, amntXP);
		UserCurve.currentlevelcurve++;
		await LevellingHandler.updateCurve(msg.author.id, msg.guildID, UserCurve);
		console.log(res);
		
		if (res.old.level !== res.new.level) {
			let dmchan = await bot.getDMChannel(msg.author.id);
			if (guild.levelmsgs && guild.levelmsgs !== "none") {
				let lmsg = guild.levelmsgs;
				lmsg = lmsg.replace(/{MENTION}/g, msg.author.mention).replace(/{OLDLVL}/g, (res.old.level)).replace(/{NEWLVL}/g, (res.new.level) + "").replace(/{USERNAME}/g, msg.author.username).replace(/{ID}/g, msg.author.id);
				await bot.createMessage(guild.levelmsgchan && guild.levelmsgchan !== "none" ? guild.levelmsgchan : dmchan.id, lmsg);
			}
			
			let parseLvl = guild.levelrewards ? parseLevelRewards(guild.levelrewards) : [];
			let awards = parseLvl.filter(x => x.level <= res.new.level && x.level > res.old.level).map(x => x.roleID);

			let dmChannel = await bot.getDMChannel(msg.author.id);

			awards.forEach(async (role) => {
				if (role === "none" || !role) return;
				let getRole = await msg.member.guild.roles.filter(x => x.id === role);
				if (getRole.length == 0) return;
				getRole = getRole[0];

				bot.createMessage(dmChannel.id, "Congrats! You got the role ```" + getRole.name + "``` from the server`" + msg.member.guild.name + "`! ");
				msg.member.addRole(role, "Levelup Reward");
			});
			if (!guild.keepRolesWhenLevel && awards.length) {
				parseLvl.filter(x => x.level < res.newlvl).map(x => x.roleID).filter(x => msg.member.roles.includes(x)).forEach(async (role) => {
					if (role === "none" || !role) return;
					let getRole = await msg.member.guild.roles.filter(x => x.id === role);
					if (getRole.length == 0) return;
					getRole = getRole[0];
					// bot.createMessage(dmChannel.id, "Role Lost: ```"+getRole.name + "``` from the server`"+msg.member.guild.name+"`! ");
					msg.member.removeRole(role, "Levelup Role Loss");


				});
			}
			if (guild.levelremoves) {
				let pardeDLvl = parseLevelRewards(guild.levelremoves);
				let delvlrewards = pardeDLvl.filter(x => x.level == res.newlvl).map(x => x.roleID);
				delvlrewards.forEach(async (role) => {
					if (role === "none" || !role) return;
					let getRole = await msg.member.guild.roles.filter(x => x.id === role);
					if (getRole.length == 0) return;
					getRole = getRole[0];
					bot.createMessage(dmChannel.id, `While you were chatting on **${msg.member.guild.name}** you dropped something. It seems you dropped \`\`\`${getRole.name}\`\`\`!\n*You have lost the role ${getRole.name}`);
					msg.member.removeRole(role, "Levelup Remove Reward");
				});
			}
		}
	}
});

