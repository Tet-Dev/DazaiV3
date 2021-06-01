const SQLHandler = require("./SQLHandler");

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
}
module.exports = LevellingHandler;
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