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
  name: string;
  description: string;
  url: string;
  rarity: CardRarity;
};

export type Crate = {
  _id: string;
  item: CardType;
  userID: string;
  createdAt: number;
  opened?: boolean;
  openedAt?: number;
  name: string;
  description: string;
};
export const cardNames = {
  ani_dazai: {
    name: 'Sunset Dazai',
    description: 'Dazai with a sunset background',
    url: 'https://assets.dazai.app/cards/_default/ani_dazai.gif',
    rarity: CardRarity.LEGENDARY,
  },
  ani_demonslayer: {
    name: 'Demon Slayer',
    description: 'Zenitsu unsheathing his sword',
    url: 'https://assets.dazai.app/cards/_default/ani_demonslayer.gif',
    rarity: CardRarity.MYTHIC,
  },
  ani_galaxy: {
    name: 'Red Galaxy',
    description: 'A swirling galaxy',
    url: 'https://assets.dazai.app/cards/_default/ani_galaxy.gif',
    rarity: CardRarity.EPIC,
  },
  animenight1: {
    name: 'Yokohama Night',
    description: 'A chill, relaxing night in Yokohama',
    url: 'https://assets.dazai.app/cards/_default/animenight1.gif',
    rarity: CardRarity.RARE,
  },

  berry_pink: {
    name: 'Berry Pink',
    description: 'Pinkberry Swirl!',
    url: 'https://assets.dazai.app/cards/_default/berry_pink.png',
    rarity: CardRarity.COMMON,
  },
  dazai: {
    name: 'Dazai',
    description: 'Dazai. Just Dazai.',
    url: 'https://assets.dazai.app/cards/_default/dazai.png',
    rarity: CardRarity.SUPER_RARE,
  },
  demonslayer1: {
    name: 'Zenitsu',
    description: 'Cool card; not animated though 😭',
    url: 'https://assets.dazai.app/cards/_default/demonslayer1.png',
    rarity: CardRarity.RARE,
  },
  dazai1000: {
    name: 'Dazai Thousand',
    description: 'The 1000 server milestone celebration card',
    url: 'https://assets.dazai.app/cards/_default/dazai1000.png',
    rarity: CardRarity.EVENT_RARE,
  },
  dazai1000special: {
    name: 'Dazai Thousand Special',
    description:
      'A Special edition of the 1000 server milestone celebration card',
    url: 'https://assets.dazai.app/cards/_default/dazai1000special.png',
    rarity: CardRarity.EVENT_RARE,
  },
  detectiveAgency: {
    name: 'The Armed Detective Agency',
    description: 'The Armed Detective Agency',
    url: 'https://assets.dazai.app/cards/_default/detectiveAgency.png',
    rarity: CardRarity.SUPER_RARE,
  },
  evening: {
    name: 'Eve-ning',
    description: 'A beautiful misty blue sky, totally not taken from E ve',
    url: 'https://assets.dazai.app/cards/_default/eve-ning.jpg',
    rarity: CardRarity.RARE,
  },
  evenight: {
    name: 'Eve Night',
    description: 'A beautiful misty blue sky, totally not taken from E ve',
    url: 'https://assets.dazai.app/cards/_default/evenight.png',
    rarity: CardRarity.RARE,
  },
} as {
  [key: string]: CardType;
};
