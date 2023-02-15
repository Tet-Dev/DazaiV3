import { ObjectId } from 'mongodb';

export enum CardRarity {
  COMMON = 'common',
  RARE = 'rare',
  SUPER_RARE = 'super_rare',
  EPIC = 'epic',
  MYTHIC = 'mythic',
  LEGENDARY = 'legendary',
  EVENT_RARE = 'event_rare',
  SECRET_RARE = 'secret_rare',
}
export const rarityNameMap = {
  [CardRarity.COMMON]: 'Common',
  [CardRarity.RARE]: 'Rare',
  [CardRarity.SUPER_RARE]: 'Super Rare',
  [CardRarity.EPIC]: 'Epic',
  [CardRarity.LEGENDARY]: 'Legendary',
  [CardRarity.MYTHIC]: 'Mythic',
  [CardRarity.EVENT_RARE]: 'Event Rare',
  [CardRarity.SECRET_RARE]: 'Secret Rare',
};  
export const rarityEmojiMap = {
  [CardRarity.COMMON]: '⬜️',
  [CardRarity.RARE]: '🟩',
  [CardRarity.SUPER_RARE]: '🟦',
  [CardRarity.EPIC]: '🟪',
  [CardRarity.LEGENDARY]: '✨',
  [CardRarity.MYTHIC]: '🟥',
  [CardRarity.EVENT_RARE]: '🟨',
  [CardRarity.SECRET_RARE]: '◼️',
};
export const rarityColorMap = {
  [CardRarity.COMMON]: 0xffffff,
  [CardRarity.RARE]: 0x78ffac,
  [CardRarity.SUPER_RARE]: 0x5cdeff,
  [CardRarity.EPIC]: 0xdc73ff,
  [CardRarity.LEGENDARY]: 0xff19e8,
  [CardRarity.MYTHIC]: 0xff7569,
  [CardRarity.EVENT_RARE]: 0xffffad,
  [CardRarity.SECRET_RARE]: 0x000000,
};

export type CardType = {
  _id: string | ObjectId;
  name: string;
  description: string;
  url: string;
  rarity: CardRarity;
  guild?: string;
};

export type Crate = {
  _id: string | ObjectId;
  itemID: string;
  userID: string;
  guildID: string;
  createdAt: number;
  opened?: boolean;
  openedAt?: number;
  name: string;
  description: string;
};
export type UserCrate = {
  _id: string | ObjectId;
  item: CardType;
  userID: string;
  guildID: string;
  createdAt: number;
  opened?: boolean;
  openedAt?: number;
  name: string;
  description: string;
};

export type CrateTemplate = {
  _id: string | ObjectId;
  name: string;
  description: string;
  items: string[];
  dropRates: {
    [key in CardRarity]: number;
  };
  guild?: string;
};

// Default crate ['63e698050296c1c2c951ba49', '63e698050296c1c2c951ba4a', '63e698050296c1c2c951ba4b', '63e698050296c1c2c951ba4c', '63e698050296c1c2c951ba4d', '63e698050296c1c2c951ba4e', '63e698050296c1c2c951ba4f', '63e698050296c1c2c951ba50', '63e698050296c1c2c951ba51', '63e698050296c1c2c951ba52', '63e698050296c1c2c951ba53', '63e698050296c1c2c951ba54']
// JSON file
