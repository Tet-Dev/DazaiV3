import { Guild } from 'eris';
import { GuildCommand } from 'eris-boiler';
import * as DatabaseHandler from '../../Handlers/DatabaseHandler';
import SQLHandler from '../../Handlers/SQLHandler';
import tetGlobal from '../../tetGlobal';
type LevelReward = {
	level: number;
	roleID: string;
}
function parseLevelRewards(str: string) {
	if (!str) return [];
	return str.split('||').map(x => {
		if (!x) return null;
		let qd = x.split(',');
		return {
			level: parseInt(qd[0].replace(/\|/g, '')) || 0,
			roleID: qd[1],
		};
	}).filter(x => x) as LevelReward[];
}

//|769235184133603334§769246805304934491,<:D20:769245803226202203>,769235184125870080|769254904748572682§769259723831902219,?️,769238973951639582
function parseReactionRoles(str: string) {
	let allEStr = str.split('|').filter(x => x);
	return allEStr.map(x => {
		let miniargs = x.split(',');
		let msgChannel = miniargs[0].split('§');
		return {
			channel: msgChannel[0],
			id: msgChannel[1],
			emote: miniargs[1].replace('<', '').replace(/\:/g, '').replace('>', ''),
			roleID: miniargs[2],
			type: 0,
		};
	});
}
export const migrateFromSQL = new GuildCommand({
	name: 'migrateFromSQL',
	description: 'migrates old data from SQL',
	options: {

	},
	run: (async (bot, { member, channel }) => {
		if (!tetGlobal.Env.botMasters.includes(member?.id! || '')) {
			return 'You must be a Bot Master to run this command!';
		}
		channel.createMessage(`Migrating ${bot.guilds.size} Guilds to MongoDB... This may take a while`);
		let progressMSG = await channel.createMessage(`Progress: 0/${bot.guilds.size} guilds migrated!`);
		let guildList = bot.guilds.map(x => x) as Guild[];
		//iterate through guildList
		for (let i = 0; i < guildList.length; i++) {
			const guild = guildList[i];
			if (i % 10 === 0 && i > 0) {
				progressMSG.edit(`Progress: ${i + 1}/${bot.guilds.size} guilds migrated!`);
			}
			let data = await SQLHandler.getGuild(guild.id);
			if (data) {
				await DatabaseHandler.createGuildData(
					guild.id,
					{
						prefix: data.prefix || 'daz',
						auditLogChannel: data.auditLogChannel || '',
						inviter: data.inviter || '',
						levelrewards: parseLevelRewards(data.levelrewards) || [],
						keepRolesWhenLevel: data.keepRolesWhenLevel || 0,
						giveRolesWhenJoin: data.giveRolesWhenJoin || '',
						reactionroles: parseReactionRoles(data.reactionroles || "") || [],
						joinmsg: data.joinmsg|| '',
						joinDMMessage: data.joindmmsg || '',
						leavemsg: data.leavemsg	 || '',
						levelmsg: data.levelmsgs || '',
						levelmsgChannel: data.levelmsgchan || '',
						joinChannel: data.joinchan || '',
						leaveChannel: data.leavechan || '',
						xpCurve: data.xpCurve || 0,
						beta: data.beta || 0,
					}
				)
			}
		}
		return 'done!'
	})
});
export default migrateFromSQL;