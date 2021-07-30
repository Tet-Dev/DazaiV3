const { GuildCommand, UserArgument } = require("eris-boiler/lib");
const RankCardDrawer = require("../Handlers/RankCardDrawer");
const SQLHandler = require("../Handlers/SQLHandler");
module.exports = new GuildCommand({
	name: "rank", // name of command
	description: "Displays your ranking!",
	run: (async (client, { params,channel,user,member }) => {
		channel.sendTyping();
		let mentionedUser = params.length ? params[0].match(/\d+/) : null;
		/** @type  {Member} */
		let mem;
		if (!mentionedUser)
			[mentionedUser, mem] = [user, member];
		else
			[mentionedUser, mem] = [mentionedUser[0], await client.getRESTGuildMember(member.guild.id, mentionedUser[0])];
		let userData = await SQLHandler.getUser(mentionedUser);
		let fileData = await RankCardDrawer.generate(mem,userData);
		channel.createMessage("Want to change your card design? try out `daz inventory` !",{
			file: fileData.buffer,
			name: `DazaiRankCard.${fileData.type}`,
		});

	}),
	options: {
		permissionNode: "pauseMusic",
		parameters: [new UserArgument("user","User to view rank details about",true)],
		// aliases: ["q"]
		// parameters: ["The index of the item or \"all\" to purge the queue"]
	}
});