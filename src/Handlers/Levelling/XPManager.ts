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
  async messageXP(guildID: string, userID: string, xpData?: GuildXPPreference) {
    xpData = xpData ?? (await this.getGuildXPPreference(guildID));
    const memberXP = await this.getGuildMemberXP(guildID, userID);
    if (memberXP.resetAt < Date.now()) {
      memberXP.resetAt = Date.now() + xpData.resetPeriod;
      memberXP.dailyMessages = 0;
    }
    const randomXP =
      (xpData.xpRange[0] +
        ~~(Math.random() * (xpData.xpRange[1] - xpData.xpRange[0]))) *
      xpData.diminishingReturns ** memberXP.dailyMessages; // 10-20 * 1^dailyMessages
    memberXP.dailyMessages++;

    const newXP = await this.giveGuildMemberXP(
      guildID,
      userID,
      randomXP,
      memberXP,
      true
    );
    await this.updateGuildMemberXP(guildID, userID, newXP);
    return newXP;
  }
  async giveGuildMemberXP(
    guildID: string,
    userID: string,
    xp: number,
    userXPData?: GuildMemeberXP,
    dontUpdate?: boolean
  ): Promise<GuildMemeberXP> {
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
      console.log('level up', newXP, XPForNextLevel, newLevel);
      newXP -= XPForNextLevel;
      newLevel++;

      XPForNextLevel = this.getRequiredXPForLevel(newLevel + 1);
    }
    const levelDiff = newLevel - xpData.level;
    if (levelDiff > 0) {
      await LevellingRewards.getInstance().processGuildRewardsForMember(
        guildID,
        userID,
        [xpData.level, newLevel]
      );
    }
    console.log('level done', newXP, XPForNextLevel);
    !dontUpdate &&
      (await this.updateGuildMemberXP(guildID, userID, {
        level: newLevel,
        xp: newXP,
      }));
    return {
      guildID,
      userID,
      level: newLevel,
      xp: newXP,
      dailyMessages: xpData.dailyMessages,
      resetAt: xpData.resetAt,
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
