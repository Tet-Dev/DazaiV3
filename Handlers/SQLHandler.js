const mysql = require("mysql2");
class SQLHandler {
	/** @type {SQLHandler} */
	static sql = null;
	constructor() {
		this.guildDB = mysql.createPool({
			host: process.env.SQLHOST,
			user: process.env.SQLUSER || "root",
			password: process.env.SQLPASSWORD,
			database: process.env.SQLDATABASE,
			charset: "utf8mb4",
		});
		this.guildDB.on("error", function (err) {
			console.trace("db error", err);

			if (err.code === "PROTOCOL_CONNECTION_LOST") {
				this.handleDisconnect();
			} else {

				throw err;
			}
		});
	}
	static init(){
		SQLHandler.sql = new SQLHandler();
	}
	static clean(str) {
		return str.replace(/[";`']/g, m => "\\" + m);
	}
	handleDisconnect() {
		(() => {
			this.guildDB = mysql.createPool({
				host: "sql.dazai.app",
				user:  process.env.SQLUSER || "root",
				password: process.env.SQLPASSWORD,
				database: "nadekoguilddata",
				charset: "utf8mb4",
			});
		})();

	}
	queryDB(str) {
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
	static query(str) {
		return SQLHandler.sql.queryDB(str);
	}

	static async genericGet(db,keyname,keyval,disableCreateIfNull,dirty,getInArr){

		let data = await SQLHandler.query(`SELECT * FROM nadekoguilddata.${db} WHERE ${dirty?keyname:SQLHandler.clean(keyname)} = "${dirty?keyval:SQLHandler.clean(keyval)}"`);
		if (!data || !data.length){
			await SQLHandler.genericSet(db,keyname,keyval);
			data = await SQLHandler.query(`SELECT * FROM nadekoguilddata.${db} WHERE ${dirty?keyname:SQLHandler.clean(keyname)} = "${dirty?keyval:SQLHandler.clean(keyval)}"`);
		} 
		return getInArr? data:data[0];
	}
	static async genericGetAll(db){

		let data = await SQLHandler.query(`SELECT * FROM nadekoguilddata.${db}`);
		return data;
	}
	static async genericSet(db,keyname,keyval,updateOBJ){
		try {
			let adds = updateOBJ? Object.keys(updateOBJ):[];
			let vals = updateOBJ? Object.values(updateOBJ):[];
			vals = vals.map(x=>SQLHandler.clean(x+""));
			await SQLHandler.query(`INSERT INTO \`nadekoguilddata\`.\`${db}\` (\`${keyname}\` ${adds.length?",`"+adds.join("`,`")+"`":""}) VALUES ('${keyval}'${vals.length? ",'"+vals.join("','")+"'":""})`);
		} catch (error) {
			console.trace(error);
			return false;
		}
	}
	static async genericUpdate(db,keyname,keyval,updateOBJ){
		try {
			let adds = Object.keys(updateOBJ);
			adds = adds.map(x => "`" + x + "` = '" + updateOBJ[x] + "'");
			await SQLHandler.query("UPDATE `nadekoguilddata`.`"+db+"` SET " + adds.join(", ") + " WHERE (`"+keyname+"` = '" + SQLHandler.clean(keyval) + "')");
			return true;
		} catch (error) {
			console.trace(error);
			return false;
		}
	}
	static async genericDelete(db,keyname,keyval,dirty){
		await SQLHandler.query(`DELETE FROM \`nadekoguilddata\`.\`${db}\` WHERE (\`${dirty?keyname:SQLHandler.clean(keyname)}\` = '${dirty?keyval:SQLHandler.clean(keyval)}')`);
	}
	/**
	 * 
	 * @param {String} guildID 
	 * @returns {SQLGuildData}
	 */
	static async getGuild(guildID){
		return await SQLHandler.genericGet("guilddata","id",guildID,false,true);
	}
	static async updateGuild(guildID,updateOBJ){
		return await SQLHandler.genericUpdate("guilddata","id",guildID,updateOBJ);
	}
	static async getChannel(channelID){

	}
	static async updateChannel(channelID,updateOBJ){

	}
	/**
	 * 
	 * @param {String} userID
	 * @returns {SQLUserData}
	 */
	static async getUser(userID){
		return await SQLHandler.genericGet("personaldata","userid",userID,false,true);
	}
	static async setUser(userID,updateOBJ){
		return await SQLHandler.genericUpdate("personaldata","userid",userID,updateOBJ);
	}
	
}
module.exports = SQLHandler;
/**
 * @typedef {Object} SQLGuildData
 * @property {String} id
 * @property {String} guilddatabg
 * @property {String} guilddatacolor
 * @property {String} inviter
 * @property {String} levelrewards
 * @property {Number} keepRolesWhenLevel
 * @property {String} giveRolesWhenJoin
 * @property {String} reactionroles
 * @property {Number} premium
 * @property {String} levelremoves
 * @property {String} joinmsg
 * @property {String} leavemsg
 * @property {String} joindmmsg
 * @property {String} levelmsgs
 * @property {String} levelmsgchan
 * @property {String} joinchan
 * @property {String} leavechan
 * @property {String} punishments
 * @property {String} boosters
 * @property {String} prefix
 * @property {String} modRole
 * @property {String} adminRole
 * @property {String} djRole
 * @property {String} modRolePerms
 * @property {String} djRolePerms
 * @property {String} extraRolePerms
 * @property {String} extraRole2Perms
 * @property {String} extraRole2
 * @property {String} extraRole
 * @property {String} everyonePerms
 * @property {String} lockedGuildMemberNames
 * @property {Number} xpCurve
 * @property {Number} beta
 * @property {Number} AImessagesLeft
 * @property {Number} whoping
 * @property {String} auditLogChannel
 */
/**
 * @typedef {Object} SQLChannelData
 * @property {String} channelID
 * @property {Number} disable_smartquoting
 * @property {Number} gainxp
 * @property {Number} uwuspeak
 * @property {String} parentGuild
 * 
 */
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
//punishmentID, guildID, punishmentType, recipientID, punisher, endsAt, reason