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
    const cardSet = new Set() as Set<string>;
    crates.forEach((crate) => cardSet.add(crate.itemID));
    const cardMap = new Map() as Map<string, CardType>;
    await Promise.all(
      Array.from(cardSet).map(async (cardID) => await getCard(cardID))
    ).then((cards) =>
      cards.forEach((card) => card && cardMap.set(card?._id.toString(), card))
    );
    const userCrates = await Promise.all(
      crates.map(async (crate) => ({
        ...crate,
        item: cardMap.get(crate.itemID),
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
  async getCrateItems(crateTemplate: CrateTemplate) {
    const items = [] as CardType[];
    for (let i = 0; i < crateTemplate.items.length; i++) {
      const item = await getCard(crateTemplate.items[i]);
      if (item) items.push(item);
    }
    const itemMap = new Map() as Map<string, CardType>;
    items.forEach((item) => itemMap.set(item._id.toString(), item));

    return itemMap;
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
    userID: string,
    crateItemCache?: Map<string, CardType>,
    addLater?: boolean
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
      await Promise.all(
        crateTemplate.items.map((c) => {
          if (crateItemCache && crateItemCache.has(c))
            return crateItemCache.get(c);
          return getCard(c);
        })
      )
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
    if (!addLater)
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
  async addCrates(crates: Crate[]) {
    await MongoDB.db('Crates')
      .collection('userCrates')
      .insertMany(
        crates.map((crate) => ({
          ...crate,
          _id:
            typeof crate._id === 'string' ? new ObjectID(crate._id) : crate._id,
        }))
      );
  }
}
