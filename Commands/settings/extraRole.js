const { Guild } = require("eris");
const { SettingCommand, RoleArgument } = require("eris-boiler/lib");
const AuditLogHandler = require("../../Handlers/AuditLogHandler");

module.exports = new SettingCommand({
	name: "extrarole",
	description: "Set the Extra Permissions Role for the server",
	options: {
		permissionNode: "admin",
		parameters: [new RoleArgument("extra_perms_role","Extra Permissions Role name/id/mention",false)],
	},
	displayName: "Extra Permissions Role",
	getValue: async (bot, { channel }) => {
		const dbGuild = await bot.SQLHandler.getGuild(channel.guild.id);
		const roleId = dbGuild.extraRole;
		/**
		 * @type {DataClient}
		 */
		let client = bot;
		/**@type {Guild} */
		let cguild = channel.guild;
		let roles = cguild && cguild.roles && cguild.roles.size ? Array.from(cguild.roles.values()) : await client.getRESTGuildRoles(channel.guild.id); 
		if (!roleId) {
			return "None";
		}

		return `${roles.find(role => role.id === roleId, { name: "Unknown Role" }).name}`;
	},
	run: async (bot, { msg, params,channel,member }) => {
		const [roleId] = params;
		const fullParam = params.join(" ");

		const guild = channel.guild;
		const role = guild.roles.get(roleId) || guild.roles.find((r) => r.name === fullParam || (fullParam.includes("<@&") && r.id === (fullParam.split("<@&")[1].split(">")[0])));

		if (!role) {
			return `Could not find role "${fullParam}"`;
		}

		const dbGuild = await bot.SQLHandler.getGuild(guild.id);
		if (role.id === dbGuild.extraRole) {
			return "Extra Permissions Role is already set to that role!";
		}

		await bot.SQLHandler.updateGuild(guild.id, { extraRole: role.id });
		await AuditLogHandler.sendAuditLogMessage(guild.id,"Update Extra Permissions Role", `New Extra Permissions role:\n<@&${role.id}>`,0,member.user);
		return "Extra Permissions Role set!";
	}
});
