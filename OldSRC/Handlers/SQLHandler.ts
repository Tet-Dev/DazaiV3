const mysql = require("mysql2");
import { createPool } from "mysql2";
import { Pool } from "mysql2";
import env from "../env";
class SQLHandler {
	/** @type {SQLHandler} */
	static sql: SQLHandler;
	guildDB: Pool;
	constructor() {
		this.guildDB = createPool({
			host: env.SQLHOST,
			user: env.SQLUSER || "root",
			password: env.SQLPASSWORD,
			database: env.SQLDATABASE,
			charset: "utf8mb4",
		});
		console.log({
			host: env.SQLHOST,
			user: env.SQLUSER || "root",
			password: env.SQLPASSWORD,
			database: env.SQLDATABASE,
			charset: "utf8mb4",
		})
	}
	static init() {
		SQLHandler.sql = new SQLHandler();
	}
	static clean(str: string) {
		return str.replace(/[";`']/g, m => "\\" + m);
	}
	handleDisconnect() {
		(() => {
			this.guildDB = mysql.createPool({
				host: "sql.dazai.app",
				user: env.SQLUSER || "root",
				password: env.SQLPASSWORD,
				database: "nadekoguilddata",
				charset: "utf8mb4",
			});
		})();

	}
	queryDB(str: string) {
		return new Promise((resolve, reject) => {
			if (!this || !this.guildDB) {
				reject("Object not Initiated");
			} else {
				this.guildDB.query(str, function (err, res) {
					(err ? reject(err) : resolve(res));
				});
			}
		});
	}
	static query(str: string) {
		return SQLHandler.sql.queryDB(str);
	}

	static async genericGet(db: string, keyname: string, keyval: string, disableCreateIfNull: boolean, dirty: boolean, getInArr: boolean) {

		let data = await SQLHandler.query(`SELECT * FROM nadekoguilddata.${db} WHERE ${dirty ? keyname : SQLHandler.clean(keyname)} = "${dirty ? keyval : SQLHandler.clean(keyval)}"`) as Object[];
		if ((!data || !data.length) && !disableCreateIfNull) {
			await SQLHandler.genericSet(db, keyname, keyval);
			data = await SQLHandler.query(`SELECT * FROM nadekoguilddata.${db} WHERE ${dirty ? keyname : SQLHandler.clean(keyname)} = "${dirty ? keyval : SQLHandler.clean(keyval)}"`) as Object[];
		}
		return getInArr ? data : data[0];
	}
	static async genericGetAll(db: string) {
		
		let data = await SQLHandler.query(`SELECT * FROM nadekoguilddata.${db}`);
		return data;
	}
	static async genericSet(db: string, keyname: string, keyval: string, updateOBJ?: any) {
		try {
			let adds = updateOBJ ? Object.keys(updateOBJ) : [];
			let vals = updateOBJ ? Object.values(updateOBJ) : [];
			vals = vals.map(x => SQLHandler.clean(x + ""));
			await SQLHandler.query(`INSERT INTO \`nadekoguilddata\`.\`${db}\` (\`${keyname}\` ${adds.length ? ",`" + adds.join("`,`") + "`" : ""}) VALUES ('${keyval}'${vals.length ? ",'" + vals.join("','") + "'" : ""})`);
		} catch (error) {
			console.trace(error);
			return false;
		}
		return true;
	}
	static async genericUpdate(db: string, keyname: string, keyval: string, updateOBJ: any) {
		try {
			let adds = Object.keys(updateOBJ);
			adds = adds.map(x => "`" + x + "` = '" + updateOBJ[x] + "'");
			await SQLHandler.query("UPDATE `nadekoguilddata`.`" + db + "` SET " + adds.join(", ") + " WHERE (`" + keyname + "` = '" + SQLHandler.clean(keyval) + "')");
			return true;
		} catch (error) {
			console.trace(error);
			return false;
		}
	}
	static async genericDelete(db: string, keyname: string, keyval: string, dirty: string) {
		await SQLHandler.query(`DELETE FROM \`nadekoguilddata\`.\`${db}\` WHERE (\`${dirty ? keyname : SQLHandler.clean(keyname)}\` = '${dirty ? keyval : SQLHandler.clean(keyval)}')`);
	}
	static async getGuild(guildID: string) {
		return await SQLHandler.genericGet("guilddata", "id", guildID, false, true, false) as SQLGuildData;
	}
	static async updateGuild(guildID: string, updateOBJ: string) {
		return await SQLHandler.genericUpdate("guilddata", "id", guildID, updateOBJ);
	}
	static async getChannel(channelID: string) {
		return await SQLHandler.genericGet("channeldata", "channelID", channelID, false, true, false) as SQLChannelData;
	}
	static async updateChannel(channelID: string, updateOBJ: any) {
		return await SQLHandler.genericUpdate("channeldata", "channelID", channelID, updateOBJ);
	}
	static async getUser(userID: string) {
		return await SQLHandler.genericGet("personaldata", "userid", userID, false, true,false) as SQLUserData;
	}
	static async setUser(userID: string, updateOBJ: any) {
		return await SQLHandler.genericUpdate("personaldata", "userid", userID, updateOBJ);
	}

}
export default SQLHandler;
//Convert SQLGuildData to a TS Type;
export type SQLGuildData = {
	id: string,
	guilddatabg: string,
	guilddatacolor: string,
	inviter: string,
	levelrewards: string,
	keepRolesWhenLevel: number,
	giveRolesWhenJoin: string,
	reactionroles: string,
	premium: number,
	levelremoves: string,
	joinmsg: string,
	leavemsg: string,
	joindmmsg: string,
	levelmsgs: string,
	levelmsgchan: string,
	joinchan: string,
	leavechan: string,
	punishments: string,
	boosters: string,
	prefix: string,
	modRole: string,
	adminRole: string,
	djRole: string,
	modRolePerms: string,
	djRolePerms: string,
	extraRolePerms: string,
	extraRole2Perms: string,
	extraRole2: string,
	extraRole: string,
	everyonePerms: string,
	lockedGuildMemberNames: string,
	xpCurve: number,
	beta: number,
	AImessagesLeft: number,
	whoping: number,
	auditLogChannel: string
}
/**
 * @typedef {Object} SQLChannelData
 * @property {String} channelID
 * @property {Number} disable_smartquoting
 * @property {Number} gainxp
 * @property {Number} uwuspeak
 * @property {String} parentGuild
 *
 */
export type SQLChannelData = {
	channelID: string,
	disable_smartquoting: number,
	gainxp: number,
	uwuspeak: number,
	parentGuild: string
}
/**
 *
 * @typedef {Object} SQLUserData
 * @property {String} userid
 * @property {String} personalbg
 * @property {String} personalcolor
 * @property {String} design
 * @property {String} ColorUnlocks
 * @property {String} CardUnlocks
 * @property {String} redeems
 * @property {String} lastdaily
 * @property {Number} streak
 * @property {Number} autoSelectSongs
 */
export type SQLUserData = {
	userid: string,
	personalbg: string,
	personalcolor: string,
	design: string,
	ColorUnlocks: string,
	CardUnlocks: string,
	redeems: string,
	lastdaily: string,
	streak: number,
	autoSelectSongs: number
}
/**
 *
 * @typedef {Object} SQLPunishmentData
 * @property {String} punishmentID
 * @property {String} guildID
 * @property {Number} punishmentType
 * @property {String} recipientID
 * @property {String} punisher
 * @property {String} endsAt
 * @property {String} timestamp
 * @property {String} reason
 * @property {Number} unpunished
 */
export type SQLPunishmentData = {
	punishmentID: string,
	guildID: string,
	punishmentType: number,
	recipientID: string,
	punisher: string,
	endsAt: string,
	timestamp: string,
	reason: string,
	unpunished: number
}