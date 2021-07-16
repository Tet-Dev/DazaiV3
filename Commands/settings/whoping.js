const { SettingCommand } = require("eris-boiler/lib");
const AuditLogHandler = require("../../Handlers/AuditLogHandler");

module.exports = new SettingCommand({
	name: "whoping",
	description: "set whether or not whoping is on",
	options: {
		permissionNode: "admin",
		parameters: ["on / off"]
	},
	displayName: "Who Ping",
	getValue: async (bot, { channel }) => {
		const prefix = await bot.SQLHandler.getGuild(channel.guild.id);
		return (prefix.whoping? "On": "Off");
	},
	run: async (bot, { msg, params }) => {
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
		const guildData = await bot.SQLHandler.getGuild(msg.guildID);
		if (set === guildData.whoping) {
			return `Who ping is already ${set ? "ON" : "OFF"}`;
		}
		
		await bot.SQLHandler.updateGuild(msg.guildID, { whoping: set });
		await AuditLogHandler.sendAuditLogMessage(msg.guildID,"Toggle Whoping", `The feature **Whoping** is now toggled ${set? "on":"off"}!`,0,msg.author);
		return "Who ping set!";

	}
});
