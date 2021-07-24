const { SettingCommand } = require("eris-boiler/lib");
const AuditLogHandler = require("../../Handlers/AuditLogHandler");
// const { owner: permission } = require('../../permissions')

module.exports = new SettingCommand({
	name: "extrarole2",
	description: "Set the Second Extra Permissions Role for the server",
	options: {
		parameters: [ "Second Extra Permissions Role name/id/mention" ],
		// permission
		permissionNode: "admin",
	},
	displayName: "Second Extra Permissions Role",
	getValue: async (bot, { channel }) => {
		const dbGuild = await bot.SQLHandler.getGuild(channel.guild.id);
		const roleId = dbGuild.extraRole2;
		/**
		 * @type {DataClient}
		 */
		 let client = bot;
		 let cguild = channel.guild;
		let roles = cguild && cguild.roles && cguild.roles.size ? Array.from(cguild.roles.values()) : await client.getRESTGuildRoles(channel.guild.id); 
		 if (!roleId) {
			 return "None";
		 }
 
		 return `@${roles.find(role => role.id === roleId, { name: "Unknown Role" }).name}`;
	},
	run: async (bot, { msg, params }) => {
		const [ roleId ] = params;
		const fullParam = params.join(" ");

		const guild = msg.channel.guild;
		const role = guild.roles.get(roleId) || guild.roles.find((r) => r.name === fullParam || (fullParam.includes("<@&") && r.id === (fullParam.split("<@&")[1].split(">")[0])));

		if (!role) {
			return `Could not find role "${fullParam}"`;
		}

		const dbGuild = await bot.SQLHandler.getGuild(msg.guildID);
		if (role.id === dbGuild.extraRole2) {
			return "Second Extra Permissions Role is already set to that role!";
		}

		await bot.SQLHandler.updateGuild(msg.guildID,{ extraRole2: role.id });
		await AuditLogHandler.sendAuditLogMessage(msg.guildID,"Update Second Extra Permissions Role", `New Second Extra Permissions role:\n<@&${role.id}>`,0,msg.author);
		return "Second Extra Permissions Role set!";
	}
});
