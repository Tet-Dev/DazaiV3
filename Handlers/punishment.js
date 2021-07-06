// const SQLHandler = require("../../sqlHandler/SQLCommunicator");
const moment = require("moment");
//------------------------------------------------ BASIC CONSTS
const sleep = (delay) => new Promise((resolve) => setTimeout(resolve, delay));
function genID(length) {
	var result = "";
	var characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
	var charactersLength = characters.length;
	for (var i = 0; i < length; i++) {
		result += characters.charAt(Math.floor(Math.random() * charactersLength));
	}
	return result;
}
//------------------------------------------------
let sqlConnection;
let bot;
let mutes = [];
let bans = [];
function pruneEntries() {
	bans = bans.filter(x => x.expires + 60 >= (Date.now() / 1000) || !isFinite(x.expires));
	mutes = mutes.filter(x => x.expires + 60 >= (Date.now() / 1000) || !isFinite(x.expires));
}
function parsePunish(str) {
	return str.split("|").map(x => {
		let temp = x.split(",");
		return {
			userid: temp[0],
			expires: temp[1],
		};
	});
}
function stringifyPunish(arr) {
	return arr.map(x => x.userid + "," + x.expires).join("|");
}
class PunishmentHandler {
	constructor(b) {
		sqlConnection = b.SQLHandler;
		bot = b;
	}
	async loadPunishments() {
		if (!sqlConnection) return Promise.reject("Object Not Initted!");
		let allGuildPunishes = await sqlConnection.query("SELECT * FROM nadekoguilddata.guildpunishments");
		allGuildPunishes.forEach(guild => {
			if (guild.muted) {
				mutes.concat((guild.muted || "").split("|").map(x => {
					let tempda = x.split(",");
					return {
						userid: tempda[0],
						guild: guild.guildid,
						expires: Number(tempda[1]),
						timeout: (tempda[1] - (Date.now() / 1000) <= 86400 ? setTimeout(async () => {
							let server = await bot.getRESTGuild(guild.guildid);
							let mem = await bot.getRESTGuildMember(server.id, tempda[0]);
							let mutedRoles = server.roles.filter(x => x.name === "Muted");
							let mRoleIds = mutedRoles.map(x => x.id);
							let hasroles = mem.roles.filter(x => mRoleIds.includes(x));
							hasroles.forEach((x) => {
								mem.removeRole(x, "Unmuted");
							});
							if (hasroles.length != 0) {
								let dmChan = await bot.getDMChannel(mem.id);
								bot.createMessage(dmChan.id, "Your time is up! You have been unmuted from **" + server.name + "**.");
							}
						}, (tempda[1] * 1000) - Date.now()) : null),
					};
				}));
			}
			if (guild.tempbanned) {
				bans.concat((guild.tempbanned || "").split("|").map(x => {
					let tempda = x.split(",");
					return {
						userid: tempda[0],
						guild: guild.guildid,
						expires: Number(tempda[1]),
						timeout: (tempda[1] - (Date.now() / 1000) <= 86400 ? setTimeout(async () => {
							let server = await bot.getRESTGuild(guild.guildid);
							server.unbanMember(tempda[0], "Temp-ban time up");
							let dmChan = await bot.getDMChannel(tempda[0]);
							bot.createMessage(dmChan.id, "Your time is up! You have been Unbanned from **" + server.name + "**.");
						}, (tempda[1] * 1000) - Date.now()) : null),
					};
				}));
			}

		});
		this.startLoop();
	}
	async getPunishmentsForGuild(guildid) {
		return mutes.filter(x => x.guild === guildid && x.expires > Date.now() / 1000).concat(bans.filter(x => x.guild === guildid && x.expires > Date.now() / 1000));
	}
	async startLoop() {
		setInterval(() => {
			bans.map(x => {
				if (x.expires - (Date.now() / 1000) <= 86400 && x.timeout == null) {
					x.timeout = setTimeout(async () => {
						let server = await bot.getRESTGuild(x.guild);
						server.unbanMember(x.userid, "Temp-ban time up");
						let dmChan = await bot.getDMChannel(x.userid);
						bot.createMessage(dmChan.id, "Your time is up! You have been Unbanned from **" + server.name + "**.");
					}, (x.expires * 1000) - Date.now());
				}
				return x;
			});
			mutes.map(y => {
				if (y.expires - (Date.now() / 1000) <= 86400 && y.timeout == null) {
					y.timeout = setTimeout(async () => {
						let server = await bot.getRESTGuild(y.guild);
						let mem = await bot.getRESTGuildMember(server.id, y.userid);
						let mutedRoles = server.roles.filter(x => x.name === "Muted");
						let mRoleIds = mutedRoles.map(x => x.id);
						let hasroles = mem.roles.filter(x => mRoleIds.includes(x));
						hasroles.forEach((x) => {
							mem.removeRole(x, "Unmuted");
						});
						if (hasroles.length != 0) {
							let dmChan = await bot.getDMChannel(mem.id);
							bot.createMessage(dmChan.id, "Your time is up! You have been unmuted from **" + server.name + "**.");
						}
					}, (y.expires * 1000) - Date.now());
				}
				return y;
			});
			pruneEntries();
		}, 120000);

	}
	async addWarn(userid, warnerId, guildId, reason) {
		let warnID = genID(16);
		await bot.SQLHandler.genericSet("guildwarnings", "warningID", warnID, {
			userid: userid,
			guildid: guildId,
			reason: reason,
			warner: warnerId,
			timestamp: Date.now()
		});
		return warnID;
	}
	async addPunishment(guild, member, type, durationInMS, reason, modResponsible) {
		let guildid = guild.id;
		let userid = member.user.id;
		let allGuildPunishes = await sqlConnection.getPunishments(guildid);
		let mutePunishes = allGuildPunishes.muted ? parsePunish(allGuildPunishes.muted) : [];
		let banPunishes = allGuildPunishes.tempbanned ? parsePunish(allGuildPunishes.tempbanned) : [];
		if (durationInMS === -1) {
			durationInMS = Infinity;
		}
		if (type === "mute") {

			mutePunishes.push({
				userid: userid,
				expires: Math.floor((durationInMS + Date.now()) / 1000),
			});
			try {
				let dmChann = await bot.getDMChannel(userid);
				await bot.createMessage(dmChann.id, "**You have been muted from `" + guild.name + "` for `" + moment.duration(durationInMS).humanize() + "`**\n__Reason__\n```" + reason + "```\nMuted by " + modResponsible.username + "#" + modResponsible.discriminator);
				// eslint-disable-next-line no-empty
			} catch { }
			//Add Muted Role
			(async () => {
				let mutedRoles = guild.roles.filter(x => x.name === "Muted");
				mutedRoles.sort((a, b) => b.position - a.position);
				let mutedRole = mutedRoles[0];
				if (!mutedRole) {
					let botmem = await bot.getRESTGuildMember(guild.id, bot.user.id);
					let botRoles = guild.roles.filter(x => botmem.roles.includes(x.id));
					botRoles.sort((a, b) => b.position - a.position);
					let newRole = await bot.createRole(guild.id, {
						name: "Muted",
						permissions: 0,
						mentionable: false,
					});
					await newRole.editPosition(botRoles[0].position > 0 ? botRoles[0].position - 1 : 0);
					
					let allChans = member.guild.channels.filter(x=>x.type == 0 || x.type == 4);
					
					for (let i = 0 ;i < allChans.length;i++){
						await allChans[i].editPermission(newRole.id, 0, 2048, "role", `Muted by ${modResponsible.id}`);
					}
					mutedRole = newRole;
				}
				await member.addRole(mutedRole.id, "Muted");
			})().catch(er=>console.trace(er));
			mutes.push({
				userid: userid,
				guild: guildid,
				expires: Math.floor(durationInMS + Date.now() / 1000),
				timeout: (Math.floor(durationInMS / 1000) <= 86400 ? setTimeout(async () => {
					let server = await bot.getRESTGuild(guildid);
					let mem = await bot.getRESTGuildMember(server.id, userid);
					let mutedRoles = server.roles.filter(x => x.name === "Muted");
					let mRoleIds = mutedRoles.map(x => x.id);
					let hasroles = mem.roles.filter(x => mRoleIds.includes(x));
					hasroles.forEach((x) => {
						mem.removeRole(x, "Unmuted");
					});
					if (hasroles.length != 0) {
						let dmChan = await bot.getDMChannel(mem.id);
						bot.createMessage(dmChan.id, "Your time is up! You have been unmuted from **" + server.name + "**.");
					}
				}, (durationInMS)) : null),
			});
		} else if (type === "ban") {

			banPunishes.push({
				userid: userid,
				expires: Math.floor((durationInMS + Date.now()) / 1000),
			});
			try {
				let dmChann = await bot.getDMChannel(userid);
				bot.createMessage(dmChann.id, `**You have been banned from \`${guild.name}\` for \`${moment.duration(durationInMS).humanize()}\`**
__Reason__
\`\`\`${reason}\`\`\`
Banned by ${modResponsible.username}#${modResponsible.discriminator}`);
			} catch (error) {

			}
			member.ban(0, "Banned by " + modResponsible.username + "#" + modResponsible.discriminator);
			bans.push({
				userid: userid,
				guild: guildid,
				expires: Math.floor((durationInMS + Date.now()) / 1000),
				timeout: ((durationInMS / 1000) <= 86400 ? setTimeout(async () => {
					let server = await bot.getRESTGuild(guildid);
					server.unbanMember(userid, "Temp-ban time up");
					let dmChan = await bot.getDMChannel(userid);
					bot.createMessage(dmChan.id, "Your time is up! You have been Unbanned from **" + server.name + "**.");
				}, (durationInMS)) : null),
			});

		} else if (type === "warn") {
			try {
				let dmChann = await bot.getDMChannel(userid);
				bot.createMessage(dmChann.id, `You have been warned from \`${guild.name}\` for \`\`\`${reason}\`\`\`
Warned by **${modResponsible.username}**#**${modResponsible.discriminator}**`);
				await this.addWarn(userid, modResponsible.id, guildid, reason);
			} catch (error) {
				console.trace(error);
			}



		} else {
			return Promise.reject("Not mute or ban");
		}
		await sqlConnection.updatePunishments(guild.id, {
			muted: stringifyPunish(mutePunishes),
			tempbanned: stringifyPunish(banPunishes),
		});
		return moment.duration(durationInMS).humanize();
	}

}
module.exports = PunishmentHandler;