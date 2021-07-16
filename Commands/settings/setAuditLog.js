const { DataClient } = require("eris-boiler");
const { SettingCommand } = require("eris-boiler/lib");
const AuditLogHandler = require("../../Handlers/AuditLogHandler");
const SQLHandler = require("../../Handlers/SQLHandler");

module.exports = new SettingCommand({
	name: "setAuditLog",
	description: "Set the Audit Logs channel for the server (or `none` to clear)",
	options: {
		permissionNode: "admin",
		parameters: [ "Channel ID /mention" ],
	},
	displayName: "Audit Log Channel",
	getValue: async (bot, { channel }) => {
		/** @type {DataClient} */
		let client = bot;
		const dbGuild = await SQLHandler.getGuild(channel.guild.id);
		return dbGuild.auditLogChannel && client.getChannel(dbGuild.auditLogChannel) ? client.getChannel(dbGuild.auditLogChannel).name : "Channel not set!"
	},
	run: async (bot, { msg, params }) => {
		/** @type {String} */
		const [ channelID ] = params;
		/** @type {DataClient} */
		const client = bot;

		const guild = msg.channel.guild;
		if (channelID === "none"){
			await AuditLogHandler.updateAuditLogChannel(guild.id,"",true);
		}
		const cleanedChannelID = channelID.match(/\d+/g)[0];
		// const channel = client.getChannel(cleanedChannelID);
		// if (!channel) return "That channel does not exist!";
		// if (!channel.guild || channel.guild.id !== guild.id) return "That channel is not part of this server!";
		// if (typeof channel.createMessage === "undefined") return "That channel cannot be used as the audit log channel (Make sure it's a text channel)";
		// await SQLHandler.genericUpdate("guilddata","id",msg.guildID,{ auditLogChannel: channel.id });
		let setResult = await AuditLogHandler.updateAuditLogChannel(guild.id,cleanedChannelID,false);
		if (setResult.success){
			await AuditLogHandler.sendAuditLogMessage(msg.guildID, "Update Audit Log Channel",`Audit log channel updated to <#${cleanedChannelID}>`,16761688,msg.author);
		}
		return setResult.message;
	}
});
