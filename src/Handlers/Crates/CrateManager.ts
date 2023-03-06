import { ObjectID } from 'bson';
import {
  Crate,
  UserCrate,
  CrateTemplate,
  CardRarity,
  CardType,
} from '../../constants/cardNames';
import { getCard } from './CardManager';
import { InventoryManager } from './InventoryManager';

export class CrateManager {
  static instance: CrateManager;
  static getInstance(): CrateManager {
    if (!CrateManager.instance) CrateManager.instance = new CrateManager();
    return CrateManager.instance;
  }
  private constructor() {
    // this.init();
  }
  async getUserCrate(crateID: string, raw?: boolean) {
    const crate = (await MongoDB.db('Crates')
      .collection('userCrates')
      .findOne({
        _id: new ObjectID(crateID),
      })) as Crate | null;
    if (raw) return crate;
    const userCrate =
      crate &&
      ({
        ...crate,
        item: await getCard(crate.itemID),
      } as UserCrate | null);
    return userCrate;
  }
  async getUserCrates(userID: string, guildID?: string, raw?: boolean) {
    const crates = await MongoDB.db('Crates')
      .collection('userCrates')
      .find({
        userID,
        ...(guildID && { guildID }),
      })
      .toArray();
    if (raw) return crates;
    console.log(
      { crates },
      {
        userID,
        guildID,
      }
    );
    const userCrates = await Promise.all(
      crates.map(async (crate) => ({
        ...crate,
        item: await getCard(crate.itemID),
      }))
    );
    return userCrates as UserCrate[];
  }
  async getCrateTemplate(templateID: string) {
    const crate = await MongoDB.db('Crates')
      .collection('crateTemplates')
      .findOne({
        _id: new ObjectID(templateID),
      });
    return crate as CrateTemplate | null;
  }
  async getGuildCrateTemplates(guildID: string) {
    const crates = await MongoDB.db('Crates')
      .collection('crateTemplates')
      .find({
        guild: guildID,
      })
      .toArray();
    return crates as CrateTemplate[];
  }
  async updateCrateTemplate(
    crateTemplateID: string,
    crateTemplate: Partial<CrateTemplate>
  ) {
    const template = {
      name: crateTemplate.name,
      description: crateTemplate.description,
      items: crateTemplate.items,
      dropRates: crateTemplate.dropRates,
    } as CrateTemplate;
    await MongoDB.db('Crates')
      .collection('crateTemplates')
      .updateOne(
        {
          _id: new ObjectID(crateTemplateID),
        },
        {
          $set: template,
        }
      );
    return template;
  }

  async createCrateTemplate(
    crateTemplate: Partial<CrateTemplate>,
    guildID: string
  ) {
    const template = {
      _id: new ObjectID(),
      name: crateTemplate.name,
      description: crateTemplate.description,
      items: crateTemplate.items,
      dropRates: crateTemplate.dropRates,
      guild: guildID,
    } as CrateTemplate;
    await MongoDB.db('Crates')
      .collection('crateTemplates')
      .insertOne(template as CrateTemplate & { _id: ObjectID });
    return template;
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
    ) as number;
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
      itemID: item._id.toString() as string,
    } as Crate;
    await MongoDB.db('Crates')
      .collection('userCrates')
      .insertOne(crate as Crate & { _id: ObjectID });
    return crate;
  }
  async openCrate(crateID: string) {
    const crate = (await this.getUserCrate(crateID, true)) as Crate | null;
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
    await InventoryManager.getInstance().addCardToInventory(
      crate.userID,
      crate.guildID || `@global`,
      crate.itemID
    );
    return crate;
  }
}
