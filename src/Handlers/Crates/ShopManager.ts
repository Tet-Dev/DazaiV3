import { ObjectId } from 'mongodb';
import { CrateManager } from './CrateManager';
import { InventoryManager } from './InventoryManager';

const defaultShopData = (guildID: string) => ({
  guildID,
  shopItems: [],
});

export type ShopItem = {
  _id: string | ObjectId;
  guildID: string;
  name: string;
  description: string;
  price: number;
  items: {
    type: 'card' | 'crate' | 'role';
    itemID: string;
    count?: number;
  }[];
};
export type GuildShopData = {
  guildID: string;
  shopItems: ShopItem[];
  name: string;
  description: string;
  _id?: string | ObjectId;
};

export class ShopManager {
  static instance: ShopManager;
  static getInstance(): ShopManager {
    if (!ShopManager.instance) ShopManager.instance = new ShopManager();
    return ShopManager.instance;
  }
  private constructor() {
    // this.init();
  }
  async getGuildShopData(guildID: string, raw: boolean = false) {
    const shopData = await MongoDB.db('Guilds').collection('shopData').findOne({
      guildID,
    });
    if (!shopData) {
      await MongoDB.db('Guilds')
        .collection('shopData')
        .insertOne(defaultShopData(guildID));
      return defaultShopData(guildID);
    }
    if (raw) return shopData;
    return {
      ...shopData,
      shopItems: await this.getShopItems(guildID),
    } as GuildShopData;
  }
  async updateGuildShopData(guildID: string, data: Partial<GuildShopData>) {
    const shopData = await this.getGuildShopData(guildID, true);
    if (!shopData) return;
    await MongoDB.db('Guilds').collection('shopData').updateOne(
      {
        guildID,
      },
      {
        $set: data,
      }
    );
    return {
      ...shopData,
      ...data,
    } as GuildShopData;
  }

  async getShopItem(itemID: string) {
    return (await MongoDB.db('Guilds')
      .collection('shopItems')
      .findOne({
        _id: new ObjectId(itemID),
      })) as ShopItem;
  }
  async getShopItems(guildID: string) {
    return (await MongoDB.db('Guilds')
      .collection('shopItems')
      .find({
        guildID,
      })
      .toArray()) as ShopItem[];
  }
  async updateShopItem(itemID: string, data: Partial<ShopItem>) {
    const item = await this.getShopItem(itemID);
    if (!item) return;
    await MongoDB.db('Guilds')
      .collection('shopItems')
      .updateOne(
        {
          _id: new ObjectId(itemID),
        },
        {
          $set: data,
        }
      );
    return {
      ...item,
      ...data,
    } as ShopItem;
  }
  async createShopItem(guildID: string, data: Partial<ShopItem>) {
    delete data._id;
    const item = await MongoDB.db('Guilds')
      .collection('shopItems')
      .insertOne({
        guildID,
        ...data,
        _id: new ObjectId(),
      });
    return {
      ...data,
      _id: item.insertedId,
    } as ShopItem;
  }
  async deleteShopItem(itemID: string) {
    return await MongoDB.db('Guilds')
      .collection('shopItems')
      .deleteOne({
        _id: new ObjectId(itemID),
      });
  }
  async purchaseItem(userID: string, guildID: string, itemID: string) {
    const item = await this.getShopItem(itemID);
    if (!item) return 'Could not find shop offer';
    const inventory = await InventoryManager.getInstance().getUserInventory(
      userID,
      guildID
    );
    if (!inventory.money || inventory.money < item.price)
      return 'Not enough money to buy this!';
    // take money away
    await InventoryManager.getInstance().updateInventory(userID, guildID, {
      money: inventory.money - item.price,
    });
    // give items
    await Promise.all(
      item.items.map((i) => this.processItemPurchase(userID, guildID, i))
    );
    return {
      success: true,
      message: 'Successfully purchased item',
    };
  }
  async processItemPurchase(
    userID: string,
    guildID: string,
    item: ShopItem['items'][0]
  ) {
    switch (item.type) {
      case 'card': {
        for (let i = 0; i < (item.count || 1); i++)
          await InventoryManager.getInstance().addCardToInventory(
            userID,
            guildID,
            item.itemID
          );
        break;
      }
      case 'crate': {
        const crateData = await CrateManager.getInstance().getCrateTemplate(
          item.itemID
        );
        if (!crateData) return 'Could not find crate';
        for (let i = 0; i < (item.count || 1); i++)
          await CrateManager.getInstance().generateCrate(
            crateData,
            guildID,
            userID
          );

        break;
      }
      case 'role': {
        const member = await bot.getRESTGuildMember(guildID, userID);
        if (!member) return 'Could not find member';
        await member.addRole(item.itemID);
        break;
      }
    }
  }
}
