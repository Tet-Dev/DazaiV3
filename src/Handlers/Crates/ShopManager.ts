import { TextChannel } from 'eris';
import { ObjectId } from 'mongodb';
import { Crate } from '../../constants/cardNames';
import { CrateManager } from './CrateManager';
import { InventoryManager } from './InventoryManager';
import { AuditLogManager } from '../Auditor/AuditLogManager';

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
    const txt = (await bot.getChannel(env.purchaseLogChannel)) as TextChannel;
    await txt.createMessage({
      embed: {
        title: 'Shop Purchase',
        description: `Server: \`${
          bot.guilds.get(guildID)?.name ?? `Unknown Guild (${guildID})`
        }\`\nShop Offer: \`${item.name}\`\nOffer Price: \`${
          item.price
        }$\`\nBalance pre-transaction: \`${
          inventory.money
        }\`\nBalance post transaction: \`${inventory.money - item.price}\``,
        color: 5814783,
        author: {
          name: `${bot.users.get(userID)?.username}#${
            bot.users.get(userID)?.discriminator
          } (${userID})`,
          icon_url: bot.users.get(userID)?.avatarURL,
        },
      },
    });
    if (
      await AuditLogManager.getInstance().shouldLogAction(
        guildID,
        'logShopPurchase'
      )
    ) {
      const auditLogEmbed =
        await AuditLogManager.getInstance().generateAuditLogEmbed(
          guildID,
          userID
        );
      auditLogEmbed.title = 'Shop Purchase';
      auditLogEmbed.fields = [];
      auditLogEmbed.fields?.push({
        name: 'Shop Offer',
        value: item.name,
        inline: true,
      });
      auditLogEmbed.fields?.push({
        name: 'Offer Price',
        value: `${item.price}$`,
        inline: true,
      });
      auditLogEmbed.fields?.push({
        name: 'Balance pre-transaction',
        value: `${inventory.money}$`,
        inline: true,
      });
      auditLogEmbed.fields?.push({
        name: 'Balance post transaction',
        value: `${inventory.money - item.price}$`,
        inline: true,
      });
      await AuditLogManager.getInstance().logAuditMessage(
        guildID,
        auditLogEmbed
      );
    }
    let newMoney = await InventoryManager.getInstance().getUserInventory(
      userID,
      guildID
    );
    while (newMoney.money && newMoney.money > inventory.money) {
      await InventoryManager.getInstance().updateInventory(userID, guildID, {
        money: newMoney.money - item.price,
      });
      newMoney = await InventoryManager.getInstance().getUserInventory(
        userID,
        guildID
      );
    }

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
        const items = await CrateManager.getInstance().getCrateItems(
          crateData!
        );

        if (!crateData) return 'Could not find crate';
        const cratesToAdd = [] as Crate[];
        for (let i = 0; i < (item.count || 1); i++)
          cratesToAdd.push(
            await CrateManager.getInstance().generateCrate(
              crateData,
              guildID,
              userID,
              items,
              true
            )
          );
        await CrateManager.getInstance().addCrates(cratesToAdd);
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
