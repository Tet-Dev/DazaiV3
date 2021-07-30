const { SettingCommand, RoleArgument } = require("eris-boiler/lib");
const AuditLogHandler = require("../../Handlers/AuditLogHandler");

module.exports = new SettingCommand({
	name: "dj",
	description: "Set the DJ Permissions Role for the server",
	options: {
		permissionNode: "admin",
		parameters: [new RoleArgument("dj_role", "DJ Permissions Role name/id/mention",false) ],
	},
	displayName: "DJ Permissions Role",
	getValue: async (bot, { channel }) => {
		const dbGuild = await bot.SQLHandler.getGuild(channel.guild.id);
		const roleId = dbGuild.djRole;
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
	run: async (bot, { msg, params,channel,member }) => {
		const [ roleId ] = params;
		const fullParam = params.join(" ");

		const guild = channel.guild;
		const role = guild.roles.get(roleId) || guild.roles.find((r) => r.name === fullParam || (fullParam.includes("<@&") && r.id === (fullParam.split("<@&")[1].split(">")[0])));

		if (!role) {
			return `Could not find role "${fullParam}"`;
		}

		const dbGuild = await bot.SQLHandler.getGuild(channel.guild.id);
		if (role.id === dbGuild.djRole) {
			return "DJ Permissions Role is already set to that role!";
		}

		await bot.SQLHandler.updateGuild(channel.guild.id,{ djRole: role.id });
		await AuditLogHandler.sendAuditLogMessage(channel.guild.id,"Update DJ Role", `New DJ role:\n<@&${role.id}>`,0,member.user);
		return "DJ Permissions Role set!";
	}
});
