const { SettingCommand, StringArgument } = require("eris-boiler/lib");
const { StringArgumentChoice } = require("eris-boiler/lib/arguments/choices");
const AuditLogHandler = require("../../Handlers/AuditLogHandler");

module.exports = new SettingCommand({
	name: "whoping",
	description: "set whether or not whoping is on",
	options: {
		permissionNode: "admin",
		parameters: [new StringArgument("whoping_on","Should the WhoPing option be enabled?",false,[new StringArgumentChoice("yes","yes"),new StringArgumentChoice("no","no")])],
	},
	displayName: "Who Ping",
	getValue: async (bot, { channel }) => {
		const prefix = await bot.SQLHandler.getGuild(channel.guild.id);
		return (prefix.whoping? "On": "Off");
	},
	run: async (bot, { msg, params ,channel,member}) => {
		const fullParam = params.join(" ");
		if (!fullParam) {
			return "Missing either `yes` or `no` !";
		}
		let set = 1;
		if (fullParam.toLowerCase() === "yes") {
			set = 1;
		} else if (fullParam.toLowerCase() === "no") {
			set = 0;
		} else {
			return "Missing either `yes` or `no` !";
		}
		const guildData = await bot.SQLHandler.getGuild(channel.guild.id);
		if (set === guildData.whoping) {
			return `Who ping is already ${set ? "ON" : "OFF"}`;
		}
		
		await bot.SQLHandler.updateGuild(channel.guild.id, { whoping: set });
		await AuditLogHandler.sendAuditLogMessage(channel.guild.id,"Toggle Whoping", `The feature **Whoping** is now toggled ${set? "on":"off"}!`,0,member.user);
		return "Who ping set!";

	}
});
