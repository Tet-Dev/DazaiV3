const { Member } = require("eris");
const { DataClient } = require("eris-boiler");
const moment = require("moment");
const AuditLogHandler = require("./AuditLogHandler");
const SQLHandler = require("./SQLHandler");

const punishmentTypes = {
	warn: 1,
	mute: 2,
	ban: 3,
	kick: 4,
}
const punishmentNames = ["warned", "muted", "banned", "kicked"];
const punishmentTitles = ["Warn", "Mute", "Ban", "Kick"];
class PunishmentsHandler {


	static getEnums(){
		return {
			punishmentTypes: punishmentTypes,
			punishmentNames: punishmentNames,
			punishmentTitles: punishmentTitles,
		};
	}

	/**
	 *
	 * @param {Member} punisher
	 * @param {Member} punished
	 * @param {Number} type
	 * @param {String} reason
	 * @param {Number} timeEnds
	 */

	static async addPunishment(punisher, punished, type, reason, timeEnds) {
		await SQLHandler.genericSet("punishments", "punishmentID", `${punisher.guild.id}${Date.now().toString(36)}`,
			{
				guildID: punisher.guild.id,
				punishmentType: type,
				recipientID: punished.id,
				punisher: punisher.id,
				endsAt: timeEnds,
				timestamp: Date.now(),
				reason: reason || "No reason provided.",
				unpunished: 0,
			});
		await AuditLogHandler.sendAuditLogMessage(punisher.guild.id, `Moderation Action : ${punishmentTitles[type - 1]}`, `${punished.user.username}#${punished.user.discriminator}(${punished.mention}) has been ${punishmentNames[type - 1]}${timeEnds > Date.now() ? ` for ${moment.duration(timeEnds - Date.now()).humanize()}.` : "."}\n\`\`\`${reason || "No reason provided."}\`\`\``, 16757870, punisher.user);
		try {
			/** @type {DataClient} */
			const bot = process.bot;
			(await bot.getDMChannel(punished.id)).createMessage(`You have been ${punishmentNames[type - 1]} by ${punisher.user.username}#${punisher.user.discriminator}. \`\`\`${reason || "No reason provided."}\`\`\``);
		} catch (error) { }
	}
	/**
	 * Gets a list of punishments for a user
	 * @param {String} guildID
	 * @param {Member} user
	 * @returns {Promise<Array<SQLPunishment>>}
	 */
	static async getPunishments(guildID,user) {
		const data = await SQLHandler.query(`SELECT * FROM nadekoguilddata.punishments where guildID="${SQLHandler.clean(guildID)}" and recipientID="${SQLHandler.clean(user)}";`)
		return data;
	}
	/**
	 * 
	 * @param {Member} punisher
	 * @param {Member} punished
	 * @param {String} reason
	 */
	static async warnUser(punisher, punished, reason) {
		await this.addPunishment(punisher, punished, punishmentTypes.warn, reason, -1);
	}
	/**
	 * 
	 * @param {Member} punisher
	 * @param {Member} punished
	 * @param {String} reason
	 * @param {Number} days
	 * @param {Number} hours
	 * @param {Number} minutes
	 * @param {Number} seconds
	 */
	static async muteUser(punisher, punished, reason, days, hours, minutes, seconds) {
		await this.addPunishment(punisher, punished, punishmentTypes.mute, reason, Date.now() + (days * 86400000) + (hours * 3600000) + (minutes * 60000) + (seconds * 1000));
		try {
			/** @type {DataClient} */
			const bot = process.bot;
			(await bot.getDMChannel(punished.id)).createMessage(`Mute duration: \`${moment.duration((days * 86400000) + (hours * 3600000) + (minutes * 60000) + (seconds * 1000)).humanize()}\``);
		} catch (error) { }
	}
	/**
	 * 
	 * @param {Member} punisher
	 * @param {Member} punished
	 * @param {String} reason
	 * @param {Number} days
	 * @param {Number} hours
	 * @param {Number} minutes
	 * @param {Number} seconds
	 */
	static async banUser(punisher, punished, reason, days, hours, minutes, seconds) {
		await this.addPunishment(punisher, punished, punishmentTypes.ban, reason, Date.now() + (days * 86400000) + (hours * 3600000) + (minutes * 60000) + (seconds * 1000));
		try {
			/** @type {DataClient} */
			const bot = process.bot;
			(await bot.getDMChannel(punished.id)).createMessage(`Ban duration: \`${moment.duration((days * 86400000) + (hours * 3600000) + (minutes * 60000) + (seconds * 1000)).humanize()}\``);
			await punished.ban(0, reason);
		} catch (error) { }
	}
}
module.exports = PunishmentsHandler;

/**
 * 
 * @typedef {Object} SQLPunishment
 * @property {String} punishmentID
 * @property {String} guildID
 * @property {Number} punishmentType
 * @property {String} recipientID
 * @property {String} punisher
 * @property {String} endsAt
 * @property {String} reason
 * @property {String} timestamp
 * @property {Number} unpunished
 */