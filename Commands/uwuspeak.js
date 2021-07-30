const { GuildCommand } = require("eris-boiler/lib");
const AuditLogHandler = require("../Handlers/AuditLogHandler");
module.exports = new GuildCommand({
	name: "uwuspeak", // name of command
	description: "UwUifies a channel",
	run: (async (client, { msg, params,channel ,user}) => {
		let chan = (await client.SQLHandler.getChannel(channel.id));
		if (chan.uwuspeak) {
			await client.SQLHandler.updateChannel(channel.id,{uwuspeak:0});
				
				
		}else{
			await client.SQLHandler.updateChannel(channel.id,{uwuspeak:1});
			return "UwUSpeak now `ON` !";
		}
		AuditLogHandler.sendAuditLogMessage(channel.guild.id,"Toggle UwUSpeak",`UwUSpeak is now \`${chan.uwuspeak? "OFF": "ON"} in the channel <#${channel.id}>\``,0,user);
		return `UwUSpeak is now \`${chan.uwuspeak? "OFF": "On"}\` !`;
	}),
	options: {
		permissionNode: "uwuspeak",
		aliases: ["us"],
		optionalParameters: [],
		parameters: [],
	}
});