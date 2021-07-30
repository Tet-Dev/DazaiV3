const { DataClient } = require("eris-boiler");
const { SettingCommand, RoleArgument } = require("eris-boiler/lib");
const AuditLogHandler = require("../../Handlers/AuditLogHandler");


module.exports = new SettingCommand({
	name: "mod",
	description: "set the Moderator Permissions Role for the server",
	options: {
		permissionNode: "admin",
		parameters: [new RoleArgument("mod_perms_role","Moderator Permissions Role name/id/mention",false)],
		// permission
	},
	displayName: "Mod Permissions Role",
	getValue: async (bot, { channel }) => {

		const dbGuild = await bot.SQLHandler.getGuild(channel.guild.id);
		const roleId = dbGuild.modRole;
		/**
		 * @type {DataClient}
		 */
		let client = bot;
		let cguild = channel.guild;
		let roles = cguild && cguild.roles && cguild.roles.size ? Array.from(cguild.roles.values()) : await client.getRESTGuildRoles(channel.guild.id);
		if (!roleId) {
			return "None";
		}

		return `${roles.find(role => role.id === roleId, { name: "Unknown Role" }).name}`;
	},
	run: async (bot, { msg, params,member}) => {
		const [roleId] = params;
		const fullParam = params.join(" ");

		const guild = member.guild;
		const role = guild.roles.get(roleId) || guild.roles.find((r) => r.name === fullParam || r.id === (fullParam.split("<@&")[1].split(">")[0]));

		if (!role) {
			return `Could not find role "${fullParam}"`;
		}

		const dbGuild = await bot.SQLHandler.getGuild(guild.id);
		if (role.id === dbGuild.modRole) {
			return "Moderator Permissions is already set to that role!";
		}
		await AuditLogHandler.sendAuditLogMessage(guild.id,"Update Moderator Role", `New Moderator role:\n<@&${role.id}>`,0,member.user);
		await bot.SQLHandler.updateGuild(guild.id, { modRole: role.id });
		return "Moderator Permissions set!";
	}
});
