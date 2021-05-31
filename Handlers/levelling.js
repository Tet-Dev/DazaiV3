// const SQLHandler = require("../../sqlHandler/SQLCommunicator");
//------------------------------------------------ BASIC CONSTS
const sleep = (delay) => new Promise((resolve) => setTimeout(resolve, delay));
//------------------------------------------------
function SecsToFormat(string) {
	var sec_num = parseInt(string, 10);
	var hours = Math.floor(sec_num / 3600);
	var minutes = Math.floor((sec_num - hours * 3600) / 60);
	var seconds = sec_num - hours * 3600 - minutes * 60;

	if (hours < 10) {
		hours = "0" + hours;
	}
	if (minutes < 10) {
		minutes = "0" + minutes;
	}
	if (seconds < 10) {
		seconds = "0" + seconds;
	}
	return hours + ":" + minutes + ":" + seconds;
}
let sqlConnection = null;
let bot;
let getBal;
let setBal;
const fs = require("fs");
const fsp = fs.promises;
const { spawn } = require("child_process");
let LinkMap;
let ColorMap;
function nFormatter(num) {
	if (num >= 1000000000) {
		return (num / 1000000000).toFixed(3).replace(/\.0$/, "") + "b";
	}
	if (num >= 1000000) {
		return (num / 1000000).toFixed(3).replace(/\.0$/, "") + "m";
	}
	if (num >= 1000) {
		return (num / 1000).toFixed(3).replace(/\.0$/, "") + "k";
	}
	return num;
}
class LevellingHandler {
	constructor(b) {
		sqlConnection = b.SQLHandler;
		LinkMap = b.LinkMap;
		ColorMap = b.ColorMap;
		bot = b;
	}
	async getLB(userid, guildid) {
		let res = await sqlConnection.query("SELECT * FROM nadekoguilddata.guildleveling WHERE userguildid LIKE '" + guildid + "§%'");
		res.sort((b, x) => (x.level - b.level != 0 ? x.level - b.level : x.exp - b.exp));
		res = res.map(x => {
			return {
				id: x.userguildid.split("§")[1],
				level: x.level,
				exp: x.exp
			};
		});
		let pos = null;
		for (let i = 0; i < res.length; i++) {
			if (res[i].id === userid) {
				pos = i + 1;
				break;
			}
		}
		return {
			ranked: res,
			pos: pos ? pos : "N/A"
		};
	}
	async getUserData(userid, guildid, getInArr) {
		let res = await sqlConnection.query("SELECT * FROM nadekoguilddata.guildleveling WHERE userguildid = '" + guildid + "§" + userid + "'");
		if (!res || !res.length) {
			await sqlConnection.query("INSERT INTO `nadekoguilddata`.`guildleveling` (`userguildid`) VALUES ('" + guildid + "§" + userid + "')");
			res = await this.getUserData(userid, guildid, true);
		}
		return getInArr ? res : res[0];
	}
	async updateUserXP(userid, guildid, updateOBJ) {
		try {
			await this.getUserData(userid, guildid);
			let adds = Object.keys(updateOBJ);
			adds = adds.map(x => "`" + x + "` = '" + updateOBJ[x] + "'");
			await sqlConnection.query("UPDATE `nadekoguilddata`.`guildleveling` SET "+adds.join(", ") + " WHERE (`userguildid` = '" + guildid + "§" + userid + "')");
		} catch (error) {
			return false;
		}
	}
	async getStylePrefs(userid) {
		let res = await sqlConnection.query("SELECT * FROM nadekoguilddata.personaldata WHERE userid = '" + userid + "'");
		if (!res || !res.length) {
			await sqlConnection.query("INSERT INTO nadekoguilddata.personaldata (`userid`)  VALUES ('" + userid + "')");
			return (await this.getStylePrefs(userid));
		}
		return res[0];
	}
	async generateRankCard(mem, guild) {
		let userid = mem.id || mem;
		let memb = await (mem.id ? mem : bot.getRESTGuildMember(guildid, userid));
		let guildid = guild.id || guild;
		let nick = memb.nick || mem.user.username;
		let avatar = memb.user.dynamicAvatarURL("png", 256);
		let data = await this.getUserData(userid, guildid);
		let lb = await this.getLB(userid, guildid);

		let sprefs = await this.getStylePrefs(userid);
		const levelup = Math.round(100 * data.level ** 1.3);
		let cs = ColorMap.get(sprefs.personalcolor && sprefs.personalcolor === "default" ? "white" : sprefs.personalcolor) || [235, 235, 235];
		let bgLink = LinkMap.get(sprefs.personalbg) || LinkMap.get("spacegray");
		
		let rcpath = await bot.RankCardHandler.generateCard(data.level, data.exp, levelup, nFormatter(data.exp), nFormatter(levelup), cs[0], cs[1], cs[2], lb.pos, avatar, bgLink, nick);
		return {
			boofer: await fsp.readFile(rcpath),
			fe: rcpath.endsWith("gif")? "gif":"png",
			path: rcpath
		};

	}
	async awardEXP(userid, guildid, amnt) {
		
		let lvldata = await this.getUserData(userid,guildid);
		let exp = await lvldata.exp;
		let level = await lvldata.level;
		let newexp = exp + amnt;
		let lvlup = false;
		
		let levelup = Math.round(100 * level ** 1.3);
		while (newexp >= levelup){
			lvlup = true;
			levelup = Math.round(100 * level ** 1.3);
			newexp -= levelup;
			level++;
		}
		await this.updateUserXP(userid,guildid,{
			exp: newexp,
			level: level
		});
		return lvlup? {
			newlvl:level,
			oldlvl: lvldata.level}
			:false;
	}
	async getUserCurve(userid, guildid, getInArr) {
		let res = await sqlConnection.query("SELECT * FROM nadekoguilddata.levellingcurve WHERE userguildid = '" + guildid + "§" + userid + "'");
		if (!res || !res.length) {
			await sqlConnection.query("INSERT INTO `nadekoguilddata`.`levellingcurve` (`userguildid`) VALUES ('" + guildid + "§" + userid + "')");
			res = await this.getUserCurve(userid, guildid, true);
		}
		return getInArr ? res : res[0];
	}
	async updateCurve(userid, guildid, updateOBJ) {
		try {
			await this.getUserCurve(userid, guildid);
			let adds = Object.keys(updateOBJ);
			adds = adds.map(x => "`" + x + "` = '" + updateOBJ[x] + "'");
			await sqlConnection.query("UPDATE `nadekoguilddata`.`levellingcurve` SET "+adds.join(", ") + " WHERE (`userguildid` = '" + guildid + "§" + userid + "')");
		} catch (error) {
			console.trace(error);
			return false;
		}
	}
}
module.exports = LevellingHandler;