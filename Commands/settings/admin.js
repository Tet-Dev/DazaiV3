const { SettingCommand } = require("eris-boiler/lib");
const AuditLogHandler = require("../../Handlers/AuditLogHandler");

module.exports = new SettingCommand({
	name: "admin",
	description: "Set the Admin Permissions Role for the server",
	options: {
		parameters: ["Admin Permissions Role name/id/mention"],
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
	run: async (bot, { msg, params }) => {
		if (msg.member.guild.ownerID !== msg.author.id) return "You must be the Owner of the server to run this command!";
		const [roleId] = params;
		const fullParam = params.join(" ");

		const guild = msg.channel.guild;
		const role = guild.roles.get(roleId) || guild.roles.find((r) => r.name === fullParam || (fullParam.includes("<@&") && r.id === (fullParam.split("<@&")[1].split(">")[0])));

		if (!role) {
			return `Could not find role "${fullParam}"`;
		}

		const dbGuild = await bot.SQLHandler.getGuild(msg.guildID);
		if (role.id === dbGuild.adminRole) {
			return "Admin Permissions is already set to that role!";
		}

		await bot.SQLHandler.updateGuild(msg.guildID, { adminRole: role.id });
		await AuditLogHandler.sendAuditLogMessage(msg.guildID,"Update Admin Role", `New Admin role:\n<@&${role.id}>`,0,msg.author);
		return "Admin Permissions set!";
	}
});
