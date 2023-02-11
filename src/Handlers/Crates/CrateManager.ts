import { ObjectID } from 'bson';
import {
  CardRarity,
  CardType,
  Crate,
  CrateTemplate,
} from 'constants/cardNames';
import { getCard } from './CardManager';

export class CrateManager {
  static instance: CrateManager;
  static getInstance(): CrateManager {
    if (!CrateManager.instance) CrateManager.instance = new CrateManager();
    return CrateManager.instance;
  }
  private constructor() {
    // this.init();
  }
  async getUserCrate(crateID: string) {
    const crate = await MongoDB.db('Crates')
      .collection('userCrates')
      .findOne({
        _id: new ObjectID(crateID),
      });
    return crate as Crate | null;
  }
  async getUserCrates(userID: string) {
    const crates = await MongoDB.db('Crates')
      .collection('userCrates')
      .find({
        userID,
      })
      .toArray();
    return crates as Crate[];
  }
  async getCrateTemplate(crateID: string) {
    const crate = await MongoDB.db('Crates')
      .collection('crateTemplates')
      .findOne({
        _id: new ObjectID(crateID),
      });
    return crate as CrateTemplate | null;
  }
  async getGuildCrateTemplates(guildID: string) {
    const crates = await MongoDB.db('Crates')
      .collection('crateTemplates')
      .find({
        guildID,
      })
      .toArray();
    return crates as CrateTemplate[];
  }
  async generateCrate(
    crateTemplate: CrateTemplate,
    guildID: string,
    userID: string
  ) {
    let rarity = Math.random();
    let drawnRarity = null as null | CardRarity;
    const totalDropChance = Object.values(crateTemplate.dropRates).reduce(
      (a, b) => a + b
    );
    for (const rarityName of Object.keys(
      crateTemplate.dropRates
    ) as CardRarity[]) {
      rarity -= crateTemplate.dropRates[rarityName] / totalDropChance;
      if (rarity < 0) {
        drawnRarity = rarityName;
        break;
      }
    }
    const itemMap = (
      await Promise.all(crateTemplate.items.map(getCard))
    ).filter((x) => x) as CardType[];

    const itemsWithRarity = itemMap.filter(
      (item) => item.rarity === drawnRarity
    );
    const item =
      itemsWithRarity[Math.floor(Math.random() * itemsWithRarity.length)];

    // for every rarity, subtract the chance of that rarity from the random number
    // if the random number is less than the chance of that rarity, then that rarity is the one that is drawn

    const crate = {
      _id: new ObjectID(),
      name: crateTemplate.name,
      description: crateTemplate.description,
      guildID,
      userID,
      createdAt: Date.now(),
      item,
    } as Crate;
    await MongoDB.db('Crates')
      .collection('userCrates')
      .insertOne(crate as Crate & { _id: ObjectID });
    return crate;
  }
  async openCrate(crateID: string) {
    const crate = await this.getUserCrate(crateID);
    if (!crate) return null;
    await MongoDB.db('Crates')
      .collection('userCrates')
      .updateOne(
        {
          _id: crate._id,
        },
        {
          $set: {
            openedAt: Date.now(),
            opened: true,
          },
        }
      );
    // apply the item to the user
    return crate;
  }
  
}
