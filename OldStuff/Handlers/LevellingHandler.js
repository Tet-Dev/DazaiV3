const SQLHandler = require("../../src/Handlers/SQLHandler");

class LevellingHandler {
	/** @type {LevellingHandler} */
	static self = null;

	constructor() {
		LevellingHandler.self = this;
	}
	init() {
		new LevellingHandler();
	}
	/**
	 * Gets the XP of a user with their userid and guildID 
	 * @param {String} userid 
	 * @param {String} guildid 
	 * @returns {xpData}
	 */
	static async getXP(userid, guildid) {
		return await SQLHandler.genericGet("guildleveling", "userguildid", `${guildid}§${userid}`);
	}
	/**
	 * Sets a user's exp. DO NOT USE!
	 * @param {String} userId 
	 * @param {String} guildid 
	 * @param {Number} exp 
	 * @param {Number} level 
	 * @returns {Boolean} success?
	 */
	static async setXP(userid, guildid, exp, level) {
		return await SQLHandler.genericUpdate("guildleveling", "userguildid", `${guildid}§${userid}`, {
			exp,
			level
		});
	}
	/**
	 * 
	 * @param {String} userid 
	 * @param {String} guildid 
	 * @param {Number} xpAmount 
	 * @returns {addedXPData}
	 */
	static async addXP(userid, guildid, xpAmount) {
		let oldXP = await LevellingHandler.getXP(userid, guildid);
		let newXP = Object.assign({}, oldXP);
		newXP.exp += xpAmount;
		while (newXP.exp >= Math.round(100 * newXP.level ** 1.3)) {
			newXP.exp -= Math.round(100 * newXP.level ** 1.3);
			newXP.level++;
		}
		return {
			old: oldXP,
			new: newXP,
			success: await LevellingHandler.setXP(userid, guildid, newXP.exp, newXP.level),
		};

	}
	/**
	 * Gets current User Curve
	 * @param {String} userid 
	 * @param {String} guildid 
	 * @returns {curveData}
	 */
	static async getUserCurve(userid, guildid) {
		return await SQLHandler.genericGet("levellingcurve","userguildid",`${guildid}§${userid}`);
	}
	static async updateCurve(userid, guildid, updateOBJ) {
		return await SQLHandler.genericUpdate("levellingcurve","userguildid",`${guildid}§${userid}`,updateOBJ);
	}
	/**
	 * Get all level info for everyone in the guild
	 * @param {String} guildid
	 */
	static async getLevelStatsInGuild(guildid){
		//I know this is a bad sol rn but idk how to just get the position
		/**
		 * @type {Array<xpData>}
		 */
		let res = await SQLHandler.query("SELECT * FROM nadekoguilddata.guildleveling WHERE userguildid LIKE '" + SQLHandler.clean(guildid) + "§%'"); 
		return res.sort((b, x) => (x.level - b.level != 0 ? x.level - b.level : x.exp - b.exp));
	}
	/**
	 * Gets the position of a user in a guild
	 * @param {String} guildid
	 * @param {String} userid
	 * @returns {leaderboardData}
	 */
	static async getPositionInGuild(guildid, userid){
		let LB = await this.getLevelStatsInGuild(guildid);
		LB = LB.map(x => {
			return {
				id: x.userguildid.split("§")[1],
				level: x.level,
				exp: x.exp
			};
		});
		let pos = -1;
		for (let i = 0; i < LB.length; i++) {
			if (LB[i].id === userid) {
				pos = i + 1;
				break;
			}
		}
		return {
			position : pos,
			leaderboard: LB
		}

	}
}
module.exports = LevellingHandler;
/**
 * @typedef {Object} leaderboardData
 * @property {Array<xpData>} leaderboard
 * @property {Number} position
 */
/**
 * @typedef {Object} xpData
 * @property {Number} level
 * @property {Number} exp
 * @property {String} userguildid
 */
/**
 * @typedef {Object} addedXPData
 * @property {xpData} old
 * @property {xpData} new
 */
/**
 * @typedef {Object} curveData
 * @property {String} userguildid
 * @property {Number} currentlevelcurve
 * @property {Number} timeStarted
 */