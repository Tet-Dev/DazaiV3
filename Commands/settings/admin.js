const { SettingCommand, RoleArgument } = require("eris-boiler/lib");
const AuditLogHandler = require("../../Handlers/AuditLogHandler");

module.exports = new SettingCommand({
	name: "admin",
	description: "Set the Admin Permissions Role for the server",
	options: {
		parameters: [new RoleArgument("admin_role","Admin Permissions Role name/id/mention",false)],
	},
	displayName: "Admin Permissions Role",
	getValue: async (bot, { channel }) => {
		const dbGuild = await bot.SQLHandler.getGuild(channel.guild.id);
		const roleId = dbGuild.adminRole;
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
	run: async (bot, { msg, params,member,channel }) => {
		if (member.guild.ownerID !== member.id) return "You must be the Owner of the server to run this command!";
		const [roleId] = params;
		const fullParam = params.join(" ");

		const guild = member.guild;
		const role = guild.roles.get(roleId) || guild.roles.find((r) => r.name === fullParam || (fullParam.includes("<@&") && r.id === (fullParam.split("<@&")[1].split(">")[0])));

		if (!role) {
			return `Could not find role "${fullParam}"`;
		}

		const dbGuild = await bot.SQLHandler.getGuild(channel.guild.id);
		if (role.id === dbGuild.adminRole) {
			return "Admin Permissions is already set to that role!";
		}

		await bot.SQLHandler.updateGuild(channel.guild.id, { adminRole: role.id });
		await AuditLogHandler.sendAuditLogMessage(channel.guild.id,"Update Admin Role", `New Admin role:\n<@&${role.id}>`,0,member.user);
		return "Admin Permissions set!";
	}
});
