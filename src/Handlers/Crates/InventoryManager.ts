import { ObjectID } from 'bson';
import { getCard } from './CardManager';

type DefaultInventoryType = {
  _id?: ObjectID;
  userID: string;
  guildID: string | '@global';
  selectedCard?: string;
  cards: {
    cardID: string;
    id: string;
  }[];
  money?: number;
};
const defaultInventory = (userID: string, guildID: string) =>
  ({
    userID,
    guildID,
    cards: [],
    money: 0,
  } as DefaultInventoryType);
export class InventoryManager {
  static instance: InventoryManager;
  static getInstance(): InventoryManager {
    if (!InventoryManager.instance)
      InventoryManager.instance = new InventoryManager();
    return InventoryManager.instance;
  }
  private constructor() {
    // this.init();
  }
  async getUserInventory(userID: string, guildID: string) {
    const inventory = await MongoDB.db('Guilds')
      .collection('userData')
      .findOne({
        userID,
        guildID,
      });
    if (!inventory) {
      await MongoDB.db('Guilds')
        .collection('userData')
        .insertOne(defaultInventory(userID, guildID));
      return defaultInventory(userID, guildID) as DefaultInventoryType;
    }
    return inventory as DefaultInventoryType;
  }
  async getUserInventories(userID: string) {
    const inventories = await MongoDB.db('Guilds')
      .collection('userData')
      .find({
        userID,
      })
      .toArray();
    return inventories as unknown as DefaultInventoryType[];
  }
  async updateInventory(
    userID: string,
    guildID: string,
    data: Partial<DefaultInventoryType>
  ) {
    await MongoDB.db('Guilds').collection('userData').updateOne(
      {
        userID,
        guildID,
      },
      {
        $set: data,
      },
      {
        upsert: true,
      }
    );
  }
  async addMoneyToInventory(userID: string, guildID: string, amount: number) {
    const inventory = await this.getUserInventory(userID, guildID);
    if (!inventory) return;
    const newInventory = {
      ...inventory,
      money: (inventory.money ?? 0) + amount,
    };
    await this.updateInventory(userID, guildID, newInventory);
    return newInventory;
  }
  async removeMoneyFromInventory(
    userID: string,
    guildID: string,
    amount: number
  ) {
    const inventory = await this.getUserInventory(userID, guildID);
    if (!inventory) return;
    const newInventory = {
      ...inventory,
      money: (inventory.money ?? 0) - amount,
    };
  }
  async addCardToInventory(userID: string, guildID: string, cardID: string) {
    const inventory = await this.getUserInventory(userID, guildID);
    if (!inventory) return;
    const newInventory = {
      ...inventory,
      cards: [
        ...inventory.cards,
        {
          cardID,
          id: new ObjectID().toHexString(),
        },
      ],
    };
    await this.updateInventory(userID, guildID, newInventory);
    let newInv = await this.getUserInventory(userID, guildID);
    // wait until the inventory is updated
    while (newInv.cards.length !== newInventory.cards.length) {
      newInv = await this.getUserInventory(userID, guildID);
    }
    return newInventory;
  }
  async removeItemFromInventory(
    userID: string,
    guildID: string,
    itemID: string
  ) {
    const inventory = await this.getUserInventory(userID, guildID);
    if (!inventory) return;
    const findCard = inventory.cards.findIndex((item) => item.id === itemID);
    if (findCard === -1) return;
    inventory.cards.splice(findCard, 1);
    const newInventory = {
      ...inventory,
      cards: inventory.cards,
    };
    await this.updateInventory(userID, guildID, newInventory);
    return newInventory;
  }
  async selectCard(userID: string, guildID: string, cardID: string | null) {
    // check if card exists in inventory
    const inventory = await this.getUserInventory(userID, guildID);
    const globalInventory = await this.getUserInventory(userID, '@global');
    if (!inventory) return;
    if (
      cardID &&
      !inventory.cards.find((card) => card.id === cardID) &&
      !globalInventory.cards.find((card) => card.id === cardID)
    )
      return;
    await this.updateInventory(userID, guildID, {
      selectedCard: cardID ? cardID : undefined,
    });
    return cardID;
  }
  async getSelectedCard(userID: string, guildID: string) {
    const inventory = await this.getUserInventory(userID, guildID);
    const globalInventory = await this.getUserInventory(userID, '@global');
    if (!inventory) return;
    // find cardID in inventory
    const cardID =
      inventory.cards.find((card) => card.id === inventory.selectedCard)
        ?.cardID ||
      globalInventory.cards.find((card) => card.id === inventory.selectedCard)
        ?.cardID;
    const cardData = cardID && (await getCard(cardID));
    return cardData;
  }
  async findItemFromID(itemID: string) {
    const inventory = (await MongoDB.db('Guilds')
      .collection('userData')
      .findOne({
        'cards.id': itemID,
      })) as DefaultInventoryType;
    if (!inventory) return null;
    const cardID = inventory?.cards.find((card) => card.id === itemID)?.cardID;
    const cardData = cardID && (await getCard(cardID));
    return {
      card: cardData,
      inventory,
    };
  }
}
