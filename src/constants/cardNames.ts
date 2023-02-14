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
  item: CardType
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
