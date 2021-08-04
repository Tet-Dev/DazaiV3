const { GuildCommand, UserArgument } = require("eris-boiler/lib");
const RankCardDrawer = require("../Handlers/RankCardDrawer");
const SQLHandler = require("../Handlers/SQLHandler");
module.exports = new GuildCommand({
	name: "rank", // name of command
	description: "Displays your ranking!",
	run: (async (client, { params,channel,user,member }) => {
		let startTime = Date.now();
		console.log("Starting to generate rank", Date.now() - startTime);
		startTime = Date.now();
		channel.sendTyping();
		let mentionedUser = params.length ? params[0].match(/\d+/) : null;
		/** @type  {Member} */
		let mem;
		console.log("Fetching discord user data", Date.now() - startTime);
		startTime = Date.now();
		if (!mentionedUser)
			[mentionedUser, mem] = [user.id, member];
		else
			[mentionedUser, mem] = [mentionedUser[0], await client.getRESTGuildMember(member.guild.id, mentionedUser[0])];
		console.log("Fetching sql user data", Date.now() - startTime);
		startTime = Date.now();
		let userData = await SQLHandler.getUser(mentionedUser);
		console.log("Fetched Data in ; Starting generation of card", Date.now() - startTime);
		startTime = Date.now();
		let fileData = await RankCardDrawer.generate(member, userData);
		console.log("Generated card in ", Date.now() - startTime);
		let sendMessage = Date.now();
		await channel.createMessage("Want to change your card design? try out `daz inventory` !",{
			file: fileData.buffer,
			name: `DazaiRankCard.${fileData.type || "png"}`,
		});
		console.log("Sent message out in ", Date.now() - sendMessage);

	}),
	options: {
		permissionNode: "pauseMusic",
		parameters: [new UserArgument("user","User to view rank details about",true)],
		// aliases: ["q"]
		// parameters: ["The index of the item or \"all\" to purge the queue"]
	}
});