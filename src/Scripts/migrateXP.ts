import { DiscordScript } from '../types/misc';
import mysql2 from 'mysql2/promise';
import { XPManager } from '../Handlers/Levelling/XPManager';
export const migrateXP: DiscordScript = async (bot, interaction) => {
  const guildID = interaction.guildID;
  if (!guildID) {
    return interaction.createMessage({
      embeds: [
        {
          title: `Cannot run script`,
          description: `This command can only be used in a server!`,
          color: 16728385,
        },
      ],
    });
  }
  if (!interaction.member?.permissions.has('administrator')) {
    return interaction.createMessage({
      embeds: [
        {
          title: `Cannot run script`,
          description: `You must be an administrator to run this script!`,
        },
      ],
    });
  }
  console.log('acking...');
  await interaction.acknowledge();
  const start = Date.now();
  const sqlConnection = await mysql2.createConnection({
    host: env.sql.host,
    user: env.sql.user,
    password: env.sql.password,
    database: env.sql.database,
    charset: env.sql.charset,
  });
  console.log('connection', sqlConnection);
  //   get all rows from the xp table where the guild id is the guild id of the server
  /*
  level,exp,userguildid
5,385,1000072472533680218§779884916715683851
5,344,1000072472533680218§995571715843293264
2,204,1002729873061724250§741405160697364681
2,18,1002729873061724250§862406905225019432
2,77,1005238653808803850§1008505146503872563
3,228,1005238653808803850§709226031084732526
2,-84,1005238653808803850§719413167620620289
3,75,1005238653808803850§747452201403809912
2,-13,1005238653808803850§761018762450698250
2,-56,1005238653808803850§899402978975440967
*/
  const [rows] = await sqlConnection.execute(
    `SELECT * FROM guildleveling WHERE userguildid LIKE '${guildID}§%'`
  );
  //   rows look like
  const parseData = (rows as any[]).map((row: any) => {
    const [guildID, userID] = row.userguildid.split('§');
    return {
      guildID,
      userID,
      level: row.level,
      exp: row.exp,
    } as {
      guildID: string;
      userID: string;
      level: number;
      exp: number;
    };
  });
  // reverse addXP function
  // static async addXP(userid, guildid, xpAmount) {
  //     let oldXP = await LevellingHandler.getXP(userid, guildid);
  //     let newXP = Object.assign({}, oldXP);
  //     newXP.exp += xpAmount;
  //     while (newXP.exp >= Math.round(100 * newXP.level ** 1.3)) {
  //         newXP.exp -= Math.round(100 * newXP.level ** 1.3);
  //         newXP.level++;
  //     }
  //     return {
  //         old: oldXP,
  //         new: newXP,
  //         success: await LevellingHandler.setXP(userid, guildid, newXP.exp, newXP.level),
  //     };

  // }
  const reversedXP = parseData.map((row) => {
    const newXP = {
      exp: row.exp,
      level: row.level,
    };
    while (newXP.level > 0) {
      newXP.exp += Math.round(100 * newXP.level ** 1.3);
      newXP.level--;
    }

    return {
      ...row,
      ...newXP,
    };
  });
  console.log(
    'reversedXP',
    reversedXP.sort((a, b) => b.exp - a.exp).slice(0, 10)
  );
  await Promise.all(
    reversedXP.map(async (r, i) => {
      const xpData = await XPManager.getInstance().getGuildMemberXP(
        r.guildID,
        r.userID
      );
      console.log('migrating', r.userID);
      //@ts-ignore
      if (xpData?.migrated) {
        console.log('already migrated', r.userID);
        return;
      }
      await XPManager.getInstance().updateGuildMemberXP(guildID, r.userID, {
        xp: r.exp,
        //@ts-ignore
        migrated: true,
      });
      console.log('migrated', r.userID, `(${i + 1}/${reversedXP.length})`);
    })
  );
  await interaction.createMessage({
    embeds: [
      {
        title: `Migrated XP`,
        description: `Migrated XP in ${Date.now() - start}ms`,
        color: 16728385,
      },
    ],
  });
};
