import { GuildCommand, UserArgument } from "eris-boiler";
import { getUser } from "../../Handlers/DatabaseHandler";
import RankCardDrawer from "../../Handlers/Levelling/RankCardDrawer";

export const rank = new GuildCommand({
	name: "rank", // name of command
	description: "Displays your ranking!",
	run: (async (client, { params, channel, user, member }) => {


		channel.sendTyping();
		let mentionedUserRegex = params.length ? params[0].match(/\d+/) : null;
		/** @type  {Member} */
		let mem;
		let mentionedUser = "";

		if (!mentionedUserRegex)
			[mentionedUser, mem] = [user.id, member];
		else
			[mentionedUser, mem] = [mentionedUserRegex[0], await client.getRESTGuildMember(member!.guild.id, mentionedUserRegex[0])];


		let userData = await getUser(mentionedUser);


		let fileData = await RankCardDrawer.generate(mem!, userData!);

		await channel.createMessage("Want to change your card design? try out `daz inventory` !", {
			file: fileData.buffer,
			name: `DazaiRankCard.${fileData.type || "png"}`,
		});
		return "";

	}),
	options: {
		// permissionNode: "pauseMusic",
		parameters: [new UserArgument("user", "User to view rank details about", true)],
		// aliases: ["q"]
		// parameters: ["The index of the item or \"all\" to purge the queue"]
	}
});
export default rank;