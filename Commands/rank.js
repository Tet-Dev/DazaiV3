const { GuildCommand } = require("eris-boiler/lib");
const RankCardDrawer = require("../Handlers/RankCardDrawer");
const SQLHandler = require("../Handlers/SQLHandler");
module.exports = new GuildCommand({
	name: "rank", // name of command
	description: "Displays your ranking!",
	run: (async (client, { msg, params }) => {
		msg.channel.sendTyping();
		let mentionedUser = params.length ? params[0].match(/\d+/) : null;
		/** @type  {Member} */
		let member;
		if (!mentionedUser)
			[mentionedUser, member] = [msg.author.id, msg.member];
		else
			[mentionedUser, member] = [mentionedUser[0], await client.getRESTGuildMember(msg.guildID, mentionedUser[0])];
		let userData = await SQLHandler.getUser(mentionedUser);
		let fileData = await RankCardDrawer.generate(member,userData);
		msg.channel.createMessage("Want to change your card design? try out `daz inventory` !",{
			file: fileData.buffer,
			name: `DazaiRankCard.${fileData.type}`,
		});

	}),
	options: {
		permissionNode: "pauseMusic",
		// aliases: ["q"]
		// parameters: ["The index of the item or \"all\" to purge the queue"]
	}
});