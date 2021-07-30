const { SettingCommand, StringArgument } = require("eris-boiler/lib");
const AuditLogHandler = require("../../Handlers/AuditLogHandler");
const PrefixManager = require("../../Handlers/PrefixManager");

module.exports = new SettingCommand({
	name: "prefix",
	description: "set prefix for server",
	options: {
		permissionNode: "admin",
		parameters: [new StringArgument("prefix", "desired prefix",false) ]
	},
	displayName: "Prefix",
	getValue: async (bot, { channel }) => {
		const prefix = await bot.SQLHandler.getGuild(channel.guild.id);
		return (prefix.prefix || bot.ora.defaultPrefix);
	},
	run: async (bot, { msg, params ,member}) => {
		const fullParam = params.join(" ");
		if (!fullParam) {
			return "Please provide a prefix!";
		}

		const guildData = await bot.SQLHandler.getGuild(member.guild.id);
		if (fullParam === guildData.prefix) {
			return `Prefix is already set to "${fullParam}"`;
		}

		await bot.SQLHandler.updateGuild(member.guild.id,{ prefix: fullParam });
		await PrefixManager(bot, msg);
		await AuditLogHandler.sendAuditLogMessage(member.guild.id,"Update Bot Prefix", `Old Prefix: \`\`\`${guildData.prefix}\`\`\`\nNew Prefix: \`\`\`${fullParam}\`\`\``,0,member.user);
		return "Prefix set!";
	}
});
