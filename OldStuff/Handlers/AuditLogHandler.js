const { User } = require("eris");
const Eris = require("eris");
const { DataClient } = require("eris-boiler");
const SQLHandler = require("./SQLHandler");

class AuditLogHandler {
	/**
	 * Sets Audit Log Channel Internally. DO NOT USE EXTERNALLY. Does not run checks.
	 * @param {String} guildID 
	 * @param {String} channelID 
	 */
	static async setAuditLogChannel(guildID, channelID) {
		await SQLHandler.genericUpdate("guilddata", "id", guildID, {
			auditLogChannel: channelID
		});
		return true;
	}
	/**
	 * Sets Audit Log Channel Internally.USE EXTERNALLY. Does run checks.
	 * @param {String} guildID 
	 * @param {String} channelID 
	 * @param {Boolean} bypassChecks
	 * @returns {UpdateAuditLogChannelResponse}
	 */
	static async updateAuditLogChannel(guildID, channelID, bypassChecks) {
		/**
		 * @type {DataClient}
		 */
		let client = process.bot;
		/**
		 * @type {Eris.TextChannel}
		 */
		let newChan = client.getChannel(channelID);
		if (!bypassChecks) {
			if (!newChan || !newChan.guild || newChan.guild.id !== guildID)
				return {
					success: false,
					message: "Invalid Channel! Make sure the channel that you specified exists on this server!"
				};
			let botPerms = newChan.permissionsOf(client.user.id);
			if (!botPerms.has("sendMessages"))
				return {
					success: false,
					message: "I don't seem to have permission to send messages into that channel!"
				};
			if (!botPerms.has("embedLinks"))
				return {
					success: false,
					message: "I don't seem to have permission to send embeds into that channel!"
				};
			if (!botPerms.has("attachFiles"))
				return {
					success: false,
					message: "I don't seem to have permission to attach files in that channel!"
				};
		}
		await AuditLogHandler.setAuditLogChannel(guildID, channelID);
		return {
			success: true,
			message: `Successfully set <#${channelID}> as the audit log channel!`
		};

	}

	/**
	 * 
	 * @param {String} guildID 
	 * @param {String} actionTitle
	 * @param {String} actionDescription
	 * @param {Number} color
	 * @param {User} user
	 */
	static async sendAuditLogMessage(guildID, actionTitle, actionDescription, color, user) {
		let guildData = await SQLHandler.getGuild(guildID);
		if (!guildData.auditLogChannel) return false;
		/**
		 * @type {DataClient}
		 */
		let client = process.bot;
		/**
		 * @type {import("eris").TextableChannel}
		 */
		let channel = client.getChannel(guildData.auditLogChannel);
		await channel.createMessage({
			embed:{
				title: actionTitle,
				description: actionDescription,
				color: color,
				footer:{
					text: `Action by ${user.username}#${user.discriminator}`,
					icon_url: user.avatarURL
				},
				timestamp: require("dateformat")(Date.now(), "isoDateTime"),
			}
		});
		
	}
}
module.exports = AuditLogHandler;
/**
 * @typedef {Object} UpdateAuditLogChannelResponse
 * @property {Boolean} success
 * @property {String} message
 */