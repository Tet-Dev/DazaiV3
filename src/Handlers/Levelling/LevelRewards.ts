import { ObjectId } from 'mongodb';
import { PartialBy } from '../../types/misc';

export interface GuildReward {
  _id: string | ObjectId;
  guildID: string;
  level: number;
  type: 'roleAdd' | 'roleRemove' | 'rankCardAdd' | 'rankCardRemove';
}
export interface GuildRoleReward extends GuildReward {
  roleID: string;
  type: 'roleAdd' | 'roleRemove';
}
export interface GuildRoleRemoveReward extends GuildReward {
  roleID: string;
  type: 'roleRemove';
}
export interface GuildRankCardReward extends GuildReward {
  rankCardID: string;
  type: 'rankCardAdd';
}

export class LevellingRewards {
  static instance: LevellingRewards;
  static getInstance(): LevellingRewards {
    if (!LevellingRewards.instance)
      LevellingRewards.instance = new LevellingRewards();
    return LevellingRewards.instance;
  }
  private constructor() {}
  async getGuildRewards(guildID: string) {
    const data =
      ((await MongoDB.db('EXP')
        .collection('guildRewards')
        .find({
          guildID,
        })
        .toArray()) as any as GuildReward[]) || [];
    return data;
  }
  async getGuildReward(rewardID: string) {
    return (await MongoDB.db('EXP')
      .collection('guildRewards')
      .findOne({
        _id: new ObjectId(rewardID),
      })) as any as GuildReward;
  }
  async getGuildRewardsForLevel(guildID: string, level: number) {
    const data =
      ((await MongoDB.db('EXP')
        .collection('guildRewards')
        .find({
          guildID,
          level,
        })
        .toArray()) as any as GuildReward[]) || [];
    return data;
  }
  async addGuildReward(guildID: string, data: PartialBy<GuildReward, '_id'>) {
    const objID = new ObjectId();
    await MongoDB.db('EXP')
      .collection('guildRewards')
      .insertOne({
        ...data,
        _id: objID,
      });
    return data;
  }
  async removeGuildReward(guildID: string, rewardID: string) {
    await MongoDB.db('EXP')
      .collection('guildRewards')
      .deleteOne({
        _id: new ObjectId(rewardID),
      });
  }
  async updateGuildReward(
    guildID: string,
    rewardID: string,
    data: PartialBy<GuildReward, '_id'>
  ) {
    await MongoDB.db('EXP')
      .collection('guildRewards')
      .updateOne(
        {
          _id: new ObjectId(rewardID),
        },
        {
          $set: data,
        }
      );
  }
  async processGuildRewardsForMember(
    guildID: string,
    userID: string,
    levels: [number, number]
  ) {
    const rewards = await this.getGuildRewards(guildID);
    const member = await bot.getRESTGuildMember(guildID, userID);
    if (!member) return;
    for (const reward of rewards) {
      if (reward.level < levels[0] || reward.level > levels[1]) continue;
      console.log(reward, member);
      if (reward.type === 'roleAdd') {
        const role = member.guild.roles.get((reward as GuildRoleReward).roleID);
        if (role) {
          await member.addRole(role.id, 'Levelup Reward');
        }
      }
      if (reward.type === 'roleRemove') {
        const role = member.guild.roles.get(
          (reward as GuildRoleRemoveReward).roleID
        );
        if (role) {
          await member.removeRole(role.id, 'Levelup Reward');
        }
      }
    }
  }
}
