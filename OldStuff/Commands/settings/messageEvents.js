const { SettingCommand } = require("eris-boiler/lib");
const { ReactionCollector, MessageCollector } = require("eris-collector");
const { get, set } = require("lodash");
const ms = require("ms");
const AuditLogHandler = require("../../Handlers/AuditLogHandler");

// const pluri
function getNextMessageForPrompt(bot, msg) {
	return new Promise((res, _rej) => {
		let msgs = new MessageCollector(bot, channel, (m) => m.author.id === member.user.id, { max: 1 });
		msgs.on("collect", masg => {
			res(masg);
		});
		setTimeout(() => {
			res("to");
		}, 300000);
	});
}
module.exports = new SettingCommand({
	name: "messageevent",
	description: "Sets the message on an event",
	options: {
		permissionNode: "admin",
		// permission
		aliases: ["me"]
	},
	displayName: "Change Message Events",
	getValue: async (bot, { channel }) => {
		return `Stuff Dazai says`;

	},
	run: async (bot, { msg, params,channel,member,user }) => {
		await channel.createMessage(`Lets setup a message trigger upon an event.First off, I would suggest keeping this table of placeholders as a handy reference sheet.\`\`\`Placeholders:
		{USERNAME} = User's Name
		{MENTION} = Mention User
		{ID} = User's ID
		{OLDLVL} = User's Previous Level (levelup event only)
		{NEWLVL} = User's New Level (levelup event only)\`\`\` To cancel or abort the process, just either type \`cancel\` or not chat for about 5 minutes.`);
		// parameters: ["join/leave/joinDM/levelup", "(Channel Mention/ID) /`none`(For JoinDMOnly) / `same`(For LevelUp Only)", "the message you would like to send, or `none` to clear"],
		await channel.createMessage(`First, what type of message event do you want? 
		\`join\` - when a user joins, send a message in a certain channel.

		\`joindm\` - when a user joins, DM them a message.

		\`leave\` - when a user leaves, send them a goodbye message.

		\`levelup\` - when a user levels up, send them a message.
		`);
		let resmsg = await getNextMessageForPrompt(bot,channel,user);
		if (resmsg === "to") return "Operation timed out - Cancelled Operation";
		const setting = resmsg.content.toLowerCase();
		if (!["join","joindm","leave","levelup"].includes(setting)) return "Invalid event! valid events are: `list` `join` `leave` `joinDM` `levelup`";
		let chanID;
		if (setting !== "joindm"){
			await channel.createMessage("Next, which channel should I send the message? Note for the levelup event```If you want to send a message replying to the message that levelled up the user, you can put `same` here``` Otherwise, either provide a channel id or mention a channel!");
			let chanidMsg = await getNextMessageForPrompt(bot,channel,user);
			if (chanidMsg === "to") return "Operation timed out - Cancelled Operation";
			chanID = chanidMsg.content.toLowerCase().match(/\d+/g, "");
			chanID = chanID && chanID.length? chanID[0]:null;
			if (!chanID) return `You must either supply an id or ping a channel. The id for this channel is ${channel.id}, the pingable form is <#${channel.id}>`;
		}else{
			chanID = "none";
		}
		let chan = chanID !== "none" ? (await bot.getRESTChannel(chanID === "same" ? channel.id : chanID)) : (await bot.getDMChannel(member.user.id));
		if (!chan) return "I could not find that channel!";
		await channel.createMessage("Finally, what exactly would you like me to say? (typing none will clear the message event)");
		let cont = await getNextMessageForPrompt(bot,channel,user);
		if (cont === "to") return "Operation timed out - Cancelled Operation";
		let res = bot.SQLHandler.clean(cont.content);
		switch (setting) {
		case "join":
			await bot.SQLHandler.updateGuild(channel.guild.id, { joinchan: chanID, joinmsg: res });
			if (res === "none") break;
			chan.createMessage(res.replace(/\{USERNAME\}/g, member.user.username).replace(/\{MENTION\}/g, member.user.mention).replace(/\{I\D\}/g, member.user.id));
			break;
		case "joindm":
			
			await bot.SQLHandler.updateGuild(channel.guild.id, { joindmmsg: res });
			if (res === "none") break;
			chan.createMessage(res.replace(/\{USERNAME\}/g, member.user.username).replace(/\{MENTION\}/g, member.user.mention).replace(/\{I\D\}/g, member.user.id));
			break;
		case "leave":
			if (res === "none") break;
			await bot.SQLHandler.updateGuild(channel.guild.id, { leavechan: chanID, leavemsg: res });
			chan.createMessage(res.replace(/\{USERNAME\}/g, member.user.username).replace(/\{MENTION\}/g, member.user.mention).replace(/\{I\D\}/g, member.user.id));
			break;
		case "levelup":
			await bot.SQLHandler.updateGuild(channel.guild.id, { levelmsgchan: (chanID === "same" ? "none" : chanID), levelmsgs: res });
			if (res === "none") return;
	
			chan.createMessage(res.replace(/\{USERNAME\}/g, member.user.username).replace(/\{MENTION\}/g, member.user.mention).replace(/\{I\D\}/g, member.user.id).replace(/\{OL\DLVL}/g, "999").replace(/\{NEWLVL\}/g, "1000"));
			break;
			// case "list":
	
		default:
			return "Invalid event! valid events are: \"list\",\"join\",\"leave\",\"joinDM\",\"levelup\"";
		}
		await AuditLogHandler.sendAuditLogMessage(channel.guild.id,"Update Message Events", `Message Event: \`\`\`${setting}\`\`\` Message to send: \`\`\`${res.replace(/`/g," ` ")}\`\`\``,0,member.user);
		return "Event Message set! there will be a test message sent to test it out!";

	}
});
