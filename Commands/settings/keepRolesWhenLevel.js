const { SettingCommand, StringArgument } = require("eris-boiler/lib");
const { StringArgumentChoice } = require("eris-boiler/lib/arguments/choices");
const AuditLogHandler = require("../../Handlers/AuditLogHandler");

module.exports = new SettingCommand({
	name: "keeproleswhenlevel",
	description: "Set keep old level awards for the server, ignore if you are not using levelling,defaults to `Yes`",
	options: {
		parameters: [ new StringArgument("keep_old_levels","Keep old level rewards when new level up rewards are given? yes/no", false,[new StringArgumentChoice("yes","yes"), new StringArgumentChoice("no","no")]) ],
		// permission
		permissionNode: "admin",
	},
	displayName: "Keep Old Role Levels",
	getValue: async (bot, { channel }) => {
		const dbGuild = await bot.SQLHandler.getGuild(channel.guild.id);
		const roleId = dbGuild.keepRolesWhenLevel;

		if (!roleId) {
			return "Yes";
		}

		return roleId == 1? "Yes":"No";
	},
	run: async (bot, { msg, params,member }) => {
		const [ roleId ] = params;
		const fullParam = params.join(" ").toLowerCase();

		const guild = member.guild;
		const role = fullParam.includes("yes") || fullParam.includes("no") ? (fullParam === "yes"? 1:0):false;
		if (role === false) return "Choice must be either `yes` or `no`";
		const dbGuild = await bot.SQLHandler.getGuild(guild.id);
		if (role === dbGuild.keepRolesWhenLevel) {
			return "Keep Roles when level was already set to that!";
		}

		await bot.SQLHandler.updateGuild(guild.id,{ keepRolesWhenLevel: role });
		await AuditLogHandler.sendAuditLogMessage(guild.id,"Toggle Keep Roles when Level", `Members who levelup and unlock a new role will now ${!role && "no longer "} keep their previous roles`,0,member.user);
		return "Keep Roles When Level now " + (role? "on":"off");
	}
});
