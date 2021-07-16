const { SettingCommand } = require("eris-boiler/lib");
const AuditLogHandler = require("../../Handlers/AuditLogHandler");

module.exports = new SettingCommand({
	name: "prefix",
	description: "set prefix for server",
	options: {
		permissionNode: "admin",
		parameters: [ "desired prefix" ]
	},
	displayName: "Prefix",
	getValue: async (bot, { channel }) => {
		const prefix = await bot.SQLHandler.getGuild(channel.guild.id);
		return (prefix.prefix || bot.ora.defaultPrefix);
	},
	run: async (bot, { msg, params }) => {
		const fullParam = params.join(" ");
		if (!fullParam) {
			return "Please provide a prefix!";
		}

		const guildData = await bot.SQLHandler.getGuild(msg.guildID);
		if (fullParam === guildData.prefix) {
			return `Prefix is already set to "${fullParam}"`;
		}

		await bot.SQLHandler.updateGuild(msg.guildID,{ prefix: fullParam });
		await AuditLogHandler.sendAuditLogMessage(msg.guildID,"Update Bot Prefix", `Old Prefix: \`\`\`${guildData.prefix}\`\`\`\nNew Prefix: \`\`\`${fullParam}\`\`\``,0,msg.author);
		return "Prefix set!";
	}
});
