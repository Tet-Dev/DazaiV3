import { ObjectId } from 'mongodb';
import { CardType, CrateTemplate } from '../../constants/cardNames';
import { PartialBy } from '../../types/misc';
import { getCard } from '../Crates/CardManager';
import { CrateManager } from '../Crates/CrateManager';
import { InventoryManager } from '../Crates/InventoryManager';

export type LevelUpRewardType =
  | LevelUpAtLevelRewardType
  | LevelUpEveryNLevelsRewardType;
export interface BaseLevelUpRewardType {
  _id: string | ObjectId;
  guildID: string;
  type: 'everyNLevels' | 'atLevel';
  name: string;
  rewards: LevelUpRewardActionType[];
}

export interface LevelUpAtLevelRewardType extends BaseLevelUpRewardType {
  type: 'atLevel';
  level: number;
}

export interface LevelUpEveryNLevelsRewardType extends BaseLevelUpRewardType {
  type: 'everyNLevels';
  everyNLevel: number;
  offset: number;
}
export type LevelUpRewardActionType =
  | LevelUpRewardRoleActionType
  | LevelUpRewardCardActionType
  | LevelUpRewardCrateActionType;

export interface BaseLevelUpRewardActionType {
  type: 'role' | 'card' | 'crate';
  action: 'add' | 'remove';
}

export interface LevelUpRewardRoleActionType
  extends BaseLevelUpRewardActionType {
  type: 'role';
  roleID: string;
}

export interface LevelUpRewardCardActionType
  extends BaseLevelUpRewardActionType {
  type: 'card';
  cardID: string;
  count: number;
}

export interface LevelUpRewardCrateActionType
  extends BaseLevelUpRewardActionType {
  type: 'crate';
  crateID: string;
  count: number;
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
        .toArray()) as any as LevelUpRewardType[]) || [];
    return data;
  }
  async getGuildReward(rewardID: string) {
    return (await MongoDB.db('EXP')
      .collection('guildRewards')
      .findOne({
        _id: new ObjectId(rewardID),
      })) as any as LevelUpRewardType;
  }
  async getGuildRewardsForLevel(guildID: string, level: number) {
    const rewards = await this.getGuildRewards(guildID);
    const data = await this.parseGuildRewardsForLevel(guildID, level, rewards);

    return data;
  }
  parseGuildRewardsForLevel(
    guildID: string,
    level: number,
    rewards: LevelUpRewardType[]
  ): LevelUpRewardType[] {
    return rewards.filter(
      (reward) =>
        (reward.type === 'atLevel' && reward.level === level) ||
        (reward.type === 'everyNLevels' &&
          (level - reward.offset) % reward.everyNLevel === 0)
    ) as LevelUpAtLevelRewardType[];
  }
  async addGuildReward(
    guildID: string,
    data: Omit<Omit<LevelUpRewardType, '_id'>, 'guildID'>
  ) {
    const objID = new ObjectId();
    await MongoDB.db('EXP')
      .collection('guildRewards')
      .insertOne({
        ...data,
        _id: objID,
        guildID,
      });
    return {
      ...data,
      _id: objID.toString(),
      guildID,
    };
  }
  async updateGuildReward(rewardID: string, data: Partial<LevelUpRewardType>) {
    delete data._id;
    delete data.guildID;
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
  async removeGuildReward(guildID: string, rewardID: string) {
    await MongoDB.db('EXP')
      .collection('guildRewards')
      .deleteOne({
        _id: new ObjectId(rewardID),
      });
  }
  // async updateGuildReward(
  //   guildID: string,
  //   rewardID: string,
  //   data: PartialBy<LevelUpRewardType, '_id'>
  // ) {
  //   await MongoDB.db('EXP')
  //     .collection('guildRewards')
  //     .updateOne(
  //       {
  //         _id: new ObjectId(rewardID),
  //       },
  //       {
  //         $set: data,
  //       }
  //     );
  // }
  async processGuildRewardsForMember(
    guildID: string,
    userID: string,
    levels: number | [number, number]
  ) {
    let rewards: LevelUpRewardType[] = [];
    const guildRewards = await this.getGuildRewards(guildID);
    if (Array.isArray(levels)) {
      for (let i = levels[0]; i <= levels[1]; i++) {
        rewards.push(
          ...this.parseGuildRewardsForLevel(guildID, i, guildRewards)
        );
      }
    }
    if (typeof levels === 'number') {
      rewards = this.parseGuildRewardsForLevel(guildID, levels, guildRewards);
    }
    // figure out roles first; then cards; then crates
    const rolesMap = new Map<string, number>();
    // for every role that needs adding, add one to the entry in the map
    // for every role that needs removing, remove one from the entry in the map
    const cratesMap = new Map<string, number>();
    const cardsMap = new Map<string, number>();
    for (const reward of rewards) {
      for (const action of reward.rewards) {
        if (action.type === 'role') {
          if (action.action === 'add') {
            if (rolesMap.has(action.roleID)) {
              rolesMap.set(action.roleID, rolesMap.get(action.roleID)! + 1);
            } else {
              rolesMap.set(action.roleID, 1);
            }
          } else {
            if (rolesMap.has(action.roleID)) {
              rolesMap.set(action.roleID, rolesMap.get(action.roleID)! - 1);
            } else {
              rolesMap.set(action.roleID, -1);
            }
          }
        }
        if (action.type === 'crate') {
          if (action.action === 'add') {
            if (cratesMap.has(action.crateID)) {
              cratesMap.set(
                action.crateID,
                cratesMap.get(action.crateID)! + action.count
              );
            } else {
              cratesMap.set(action.crateID, action.count);
            }
          } else {
            if (cratesMap.has(action.crateID)) {
              cratesMap.set(
                action.crateID,
                cratesMap.get(action.crateID)! - action.count
              );
            } else {
              cratesMap.set(action.crateID, -action.count);
            }
          }
        }
        if (action.type === 'card') {
          if (action.action === 'add') {
            if (cardsMap.has(action.cardID)) {
              cardsMap.set(
                action.cardID,
                cardsMap.get(action.cardID)! + action.count
              );
            } else {
              cardsMap.set(action.cardID, action.count);
            }
          } else {
            if (cardsMap.has(action.cardID)) {
              cardsMap.set(
                action.cardID,
                cardsMap.get(action.cardID)! - action.count
              );
            } else {
              cardsMap.set(action.cardID, -action.count);
            }
          }
        }
      }
    }

    const roleOperations = Array.from(rolesMap.entries())
      .filter(([roleID, count]) => {
        return count !== 0;
      })
      .map(([roleID, count]) => {
        return [roleID, count] as [string, number];
      });
    const crateOperations = (await Promise.all(
      Array.from(cratesMap.entries())
        .filter(([crateID, count]) => {
          return count !== 0;
        })
        .map(async ([crateID, count]) => {
          const crateTemplate =
            await CrateManager.getInstance().getCrateTemplate(crateID);
          if (!crateTemplate) {
            return null;
          }
          return [crateTemplate, count] as [CrateTemplate, number];
        })
        .filter((crate) => crate !== null)
    )) as [CrateTemplate, number][];
    const cardOperations = (await Promise.all(
      Array.from(cardsMap.entries())
        .filter(([cardID, count]) => {
          return count !== 0;
        })
        .map(async ([cardID, count]) => {
          const card = await getCard(cardID);
          if (!card) {
            return null;
          }
          return [card, count] as [CardType, number];
        })
        .filter((card) => card !== null)
    )) as [CardType, number][];

    const member =
      bot.guilds.get(guildID)?.members.get(userID) ??
      (await bot.getRESTGuildMember(guildID, userID));
    if (!member) {
      return null;
    }

    for (const [roleID, count] of roleOperations) {
      if (count > 0) {
        await member.addRole(roleID, 'Level up reward');
      } else {
        await member.removeRole(roleID, 'Level up reward');
      }
    }
    for (const [crateTemplate, count] of crateOperations) {
      for (let i = 0; i < count; i++) {
        const crate = await CrateManager.getInstance().generateCrate(
          crateTemplate,
          guildID,
          userID
        );
        if (!crate) {
          continue;
        }
      }
    }
    for (const [card, count] of cardOperations) {
      for (let i = 0; i < count; i++) {
        const cardAdd = await InventoryManager.getInstance().addCardToInventory(
          userID,
          guildID,
          card._id.toString()
        );
        if (!cardAdd) {
          continue;
        }
      }
    }
    return {
      roles: roleOperations,
      crates: crateOperations,
      cards: cardOperations,
    };
  }
}
