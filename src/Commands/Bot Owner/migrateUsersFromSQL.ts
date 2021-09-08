import { GuildCommand } from 'eris-boiler';
import SQLHandler, { SQLUserData } from '../../Handlers/SQLHandler';
import tetGlobal from '../../tetGlobal';
export const migrateFromSQL = new GuildCommand({
	name: 'migrateUsersFromSQL',
	description: 'migrates old data from SQL',
	options: {

	},
	run: (async (_, { member, channel }) => {
		if (!tetGlobal.Env.botMasters.includes(member?.id! || '')) {
			return 'You must be a Bot Master to run this command!';
		}
		let allMems = await SQLHandler.genericGetAll("personaldata") as SQLUserData[];

		channel.createMessage(`Migrating ${allMems.length} Users to MongoDB... This may take a while`);
		let progressMSG = await channel.createMessage(`Progress: 0/${allMems.length} guilds migrated!`);
		let startTime = Date.now();
		for (let i = 0; i < allMems.length; i++) {
			const member = allMems[i];
			if (i % 200 === 0 && i > 0) {
				progressMSG.edit(`Progress: ${i + 1}/${allMems.length} guilds migrated!`);
			}
			if (member.personalbg === 'null') member.personalbg = "default";
			if (member.personalcolor === 'null') member.personalcolor = "default";

			//personalbg, personalcolor, design, userid, ColorUnlocks, CardUnlocks, redeems, lastdaily, streak, autoSelectSongs
			await tetGlobal.MongoDB?.db("Users").collection("UserData").insertOne({
				personalbg: member.personalbg || "default",
				personalcolor: member.personalcolor || "default",
				design: member.design || 0,
				userid: member.userid,
				ColorUnlocks: member.ColorUnlocks?.split(",") || [],
				CardUnlocks: member.CardUnlocks?.split(",") || 	[],
				redeems: member.redeems || 0,
				lastdaily: member.lastdaily || 0,
				streak: member.streak || 0,
				autoSelectSongs: member.autoSelectSongs || 0,
			})

		}
		return `Operation completed in ${Date.now()-startTime}ms`;
	})
});
export default migrateFromSQL;