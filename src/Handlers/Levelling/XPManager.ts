import { EmbedField } from 'eris';
import { rarityEmojiMap, rarityNameMap } from '../../constants/cardNames';
import { InventoryManager } from '../Crates/InventoryManager';
import { LevellingRewards } from './LevelRewards';
import { RankCardManager } from './RankCardManager';

export type GuildXPPreference = {
  guildID: string;
  enabled: boolean;
  useChannelWhitelist: boolean;
  channelIDs: string[];
  blacklist: string[];
  xpRange: [number, number];
  diminishingReturns: number; // <1 = diminishing returns, >1 = increasing returns
  cooldown: number;
  resetPeriod: number;
};
const defaultXPPreference: GuildXPPreference = {
  guildID: '',
  enabled: true,
  useChannelWhitelist: false,
  channelIDs: [],
  blacklist: [],
  xpRange: [10, 20],
  diminishingReturns: 1,
  cooldown: 5, //1000 * 30,
  resetPeriod: 1000 * 60 * 60 * 24, // 24 hours
};
export type GuildMemeberXP = {
  guildID: string;
  userID: string;
  level: number;
  xp: number;
  dailyMessages: number;
  resetAt: number;
  kitten?: number; // 0 = no kitten, 1 = kitten, 2 = forced kitten
};
const defaultGuildMemberXP: GuildMemeberXP = {
  guildID: '',
  userID: '',
  level: 0,
  xp: 0,
  dailyMessages: 0,
  resetAt: 0,
};

export class XPManager {
  static instance: XPManager;
  static getInstance(): XPManager {
    if (!XPManager.instance) XPManager.instance = new XPManager();
    return XPManager.instance;
  }
  private constructor() {
    // this.init();
  }
  async getGuildXPPreference(guildID: string): Promise<GuildXPPreference> {
    const data = ((await MongoDB.db('EXP')
      .collection('guildPreferences')
      .findOne({
        guildID,
      })) as any as GuildXPPreference) || { ...defaultXPPreference, guildID };
    return data;
  }
  async updateGuildXPPreference(
    guildID: string,
    data: Partial<GuildXPPreference>
  ): Promise<GuildXPPreference> {
    const newData = {
      ...defaultXPPreference,
      ...data,
      guildID,
    } as GuildXPPreference;
    await MongoDB.db('EXP').collection('guildPreferences').updateOne(
      {
        guildID,
      },
      {
        $set: newData,
      },
      {
        upsert: true,
      }
    );
    return newData;
  }
  async getGuildMemberXP(guildID: string, userID: string) {
    const data = (await MongoDB.db('EXP').collection('userLevels').findOne({
      guildID,
      userID,
    })) as GuildMemeberXP | null;

    return data || defaultGuildMemberXP;
  }
  async getAllGuildMemberXP(guildID: string) {
    const data = (await MongoDB.db('EXP')
      .collection('userLevels')
      .find({
        guildID,
      })
      .toArray()) as unknown as GuildMemeberXP[];
    return data;
  }
  updateGuildMemberXP(
    guildID: string,
    userID: string,
    data: Partial<GuildMemeberXP>
  ) {
    const newData = {
      guildID,
      userID,
      ...data,
    } as GuildMemeberXP;
    return MongoDB.db('EXP').collection('userLevels').updateOne(
      {
        guildID,
        userID,
      },
      {
        $set: newData,
      },
      {
        upsert: true,
      }
    );
  }
  async messageXP(
    guildID: string,
    userID: string,
    xpData?: GuildXPPreference,
    xpMultiplier?: number
  ) {
    xpData = xpData ?? (await this.getGuildXPPreference(guildID));
    const memberXP = await this.getGuildMemberXP(guildID, userID);
    if (memberXP.resetAt < Date.now()) {
      memberXP.resetAt = Date.now() + xpData.resetPeriod;
      memberXP.dailyMessages = 0;
    }
    const randomXP = parseFloat(
      (
        (xpData.xpRange[0] +
          ~~(Math.random() * (xpData.xpRange[1] - xpData.xpRange[0]))) *
        xpData.diminishingReturns ** memberXP.dailyMessages *
        (xpMultiplier ?? 1)
      ).toFixed(3)
    ); // 10-20 * 1^dailyMessages
    memberXP.dailyMessages++;
    const newXP = await this.giveGuildMemberXP(
      guildID,
      userID,
      randomXP,
      memberXP,
      true
    );
    console.log(
      'Giving XP',
      randomXP,
      'to',
      userID,
      'newXP',
      newXP.data.xp,
      'newLevel',
      newXP.data.level
    );
    await this.updateGuildMemberXP(guildID, userID, newXP.data);
    return newXP;
  }
  async giveGuildMemberXP(
    guildID: string,
    userID: string,
    xp: number,
    userXPData?: GuildMemeberXP,
    dontUpdate?: boolean
  ): Promise<{ data: GuildMemeberXP; rewardsPromise: Promise<void> }> {
    const xpData = userXPData ??
      (await this.getGuildMemberXP(guildID, userID)) ?? {
        guildID,
        userID,
        level: 0,
        xp: 0,
        dailyMessages: 0,
        resetAt: 0,
      };
    let newXP = xpData.xp + xp;
    let newLevel = xpData.level;
    let XPForNextLevel = this.getRequiredXPForLevel(xpData.level + 1);
    while (newXP >= XPForNextLevel) {
      newXP -= XPForNextLevel;
      newLevel++;
      XPForNextLevel = this.getRequiredXPForLevel(newLevel);
    }
    const levelDiff = newLevel - xpData.level;
    console.log('level diff', levelDiff);
    const rewardsPromise = new Promise(async (resolve) => {
      if (levelDiff > 0) {
        const awards =
          await LevellingRewards.getInstance().processGuildRewardsForMember(
            guildID,
            userID,
            [xpData.level, newLevel]
          );
        const dmChannel = await bot.getDMChannel(userID);
        const guild =
          bot.guilds.get(guildID) || (await bot.getRESTGuild(guildID));
        const awardFields = [] as EmbedField[];
        if (awards?.roles.length) {
          awardFields.push({
            name: '__New Roles__',
            value: `\`\`\`${awards.roles
              .map((r) => {
                const roleData = guild.roles.get(r[0]);
                return roleData ? `@${roleData.name}` : 'Unknown Role';
              })
              .join('\n')}\`\`\``,
          });
        }
        if (awards?.cards.length) {
          awardFields.push({
            name: '__New Rank Cards__',
            value: `\`\`\`${awards.cards
              .map((r) => {
                return `- x${r[1]} 「 ${r[0].name} 」  ${
                  rarityEmojiMap[r[0].rarity]
                } — ${rarityNameMap[r[0].rarity]}`;
              })
              .join('\n')}\`\`\``,
          });
        }
        if (awards?.crates.length) {
          awardFields.push({
            name: '__New Crates__',
            value: `\`\`\`${awards.crates
              .map((r) => {
                return `- x${r[1]} 「 ${r[0].name} 」`;
              })
              .join('\n')}\`\`\``,
          });
        }
        if (!awardFields.length) return resolve();
        dmChannel.createMessage({
          embed: {
            title: 'Level Up!',
            description: `You have leveled up to level **__${newLevel}__** in **${
              guild?.name
            }**!\n
${
  awardFields.length > 0
    ? 'In addition, you also have received the following rewards!'
    : ''
}`,
            thumbnail: {
              url:
                guild?.dynamicIconURL('png', 64) ||
                'https://images-wixmp-ed30a86b8c4ca887773594c2.wixmp.com/f/15e13870-8518-4f22-92c4-faa2555110e4/dej1xz0-79ff858a-d77f-439d-9cab-76e25ba7f8e9.png/v1/fill/w_1280,h_1280,q_80,strp/wan__dazai_by_gummysnail_dej1xz0-fullview.jpg?token=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ1cm46YXBwOjdlMGQxODg5ODIyNjQzNzNhNWYwZDQxNWVhMGQyNmUwIiwiaXNzIjoidXJuOmFwcDo3ZTBkMTg4OTgyMjY0MzczYTVmMGQ0MTVlYTBkMjZlMCIsIm9iaiI6W1t7ImhlaWdodCI6Ijw9MTI4MCIsInBhdGgiOiJcL2ZcLzE1ZTEzODcwLTg1MTgtNGYyMi05MmM0LWZhYTI1NTUxMTBlNFwvZGVqMXh6MC03OWZmODU4YS1kNzdmLTQzOWQtOWNhYi03NmUyNWJhN2Y4ZTkucG5nIiwid2lkdGgiOiI8PTEyODAifV1dLCJhdWQiOlsidXJuOnNlcnZpY2U6aW1hZ2Uub3BlcmF0aW9ucyJdfQ.ObDVGDRlq0hjQNhpECT930IVlNlYMtZ7Vffe4zwXdvk',
            },
            fields: awardFields,
            footer: {
              text: `Sent from ${guild?.name}`,
              icon_url: guild?.dynamicIconURL('png', 64) ?? undefined,
            },
          },
        });
      }
      !dontUpdate &&
        (await this.updateGuildMemberXP(guildID, userID, {
          level: newLevel,
          xp: newXP,
        }));
      resolve();
    }) as Promise<void>;
    return {
      data: {
        guildID,
        userID,
        level: newLevel,
        xp: newXP,
        dailyMessages: xpData.dailyMessages,
        resetAt: xpData.resetAt,
      },
      rewardsPromise,
    };
    // each level
  }

  getRequiredXPForLevel(level: number): number {
    if (level <= 3) return level * 75;
    return Math.floor((100 * level ** 1.2) / 250) * 250;
  }
  async getLeaderboard(guildID: string, limit = 25, offset = 0) {
    console.log('getLeaderboard', guildID, limit, offset);
    const data = await MongoDB.db('EXP')
      .collection('userLevels')
      .find({
        guildID,
      })
      .sort({
        level: -1,
        xp: -1,
      })
      .skip(offset)
      .limit(limit)
      .toArray();
    return data as unknown as GuildMemeberXP[];
  }
  async generateRankCard(guildID: string, userID: string) {
    const guildXP = await this.getGuildXPPreference(guildID);
    const memberXP = await this.getGuildMemberXP(guildID, userID);
    const top = await this.getLeaderboard(guildID, 1000);
    const rank = top.findIndex((x) => x.userID === userID) + 1;
    const user =
      (await bot.users.get(userID)) ?? (await bot.getRESTUser(userID));
    const inventory = await InventoryManager.getInstance().getSelectedCard(
      userID,
      guildID
    );
    const rankCardBuffer = await RankCardManager.getInstance().getRankCardImage(
      {
        avatar: user.dynamicAvatarURL('png', 256),
        username: user.username,
        discriminator: user.discriminator,
        level: memberXP.level,
        rank,
        xp: memberXP.xp,
        xpToNext: this.getRequiredXPForLevel(memberXP.level + 1),
        background: inventory ? inventory.url : undefined,
      }
    );
    return rankCardBuffer;
  }
}
