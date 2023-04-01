import { ObjectID } from 'bson';
import storagePromise from '../../Server/Utils/storagePromise';
const fileTypeFromBuffer = (
  eval('import("file-type")') as Promise<typeof import('file-type')>
).then((fileType) => fileType.fileTypeFromBuffer);

import { decode, GIF } from 'imagescript';
import { CardType } from '../../constants/cardNames';
function toBuffer(arrayBuffer: ArrayBuffer) {
  const buffer = Buffer.alloc(arrayBuffer.byteLength);
  const view = new Uint8Array(arrayBuffer);
  for (let i = 0; i < buffer.length; ++i) {
    buffer[i] = view[i];
  }
  return buffer;
}
export const getCard = (cardID: string) =>
  MongoDB.db('Guilds')
    .collection('customCards')
    .findOne({ _id: new ObjectID(cardID) }) as Promise<CardType | null>;
export const getCards = (guildID: string[]) =>
  MongoDB.db('Guilds')
    .collection('customCards')
    .find({ _id: { $in: guildID.map((id) => new ObjectID(id)) } })
    .toArray() as Promise<CardType[]>;

export const getGuildCards = async (guildID: string) =>
  MongoDB.db('Guilds')
    .collection('customCards')
    .find({ guild: guildID })
    .toArray() as Promise<CardType[]>;
export const getGlobalCards = async () =>
  MongoDB.db('Guilds')
    .collection('customCards')
    .find({ guild: { $exists: false } })
    .toArray() as Promise<CardType[]>;
export const createCard = async (
  card: Partial<CardType>,
  guildID: string,
  cardImageBuffer: Buffer
) => {
  const imageBucket = storagePromise.bucket('assets.dazai.app');
  const type = await (await fileTypeFromBuffer)(cardImageBuffer);
  if (!type) throw new Error('Could not determine file type');
  //   allow PNG, JPEG, GIF
  if (!['png', 'jpeg', 'gif'].includes(type.ext))
    throw new Error('Invalid file type');
  const img = await decode(cardImageBuffer, false);
  // img must be 1024x340
  if (img.width !== 1024 || img.height !== 340) {
    // check if off with 2 pixel
    if (Math.abs(img.width - 1024) > 2 || Math.abs(img.height - 340) > 2)
      throw new Error(
        `Invalid image size, must be 1024x340, got ${img.width}x${img.height}`
      );
    // if off by 1 pixel, resize
    img.resize(1024, 340);
    cardImageBuffer = toBuffer(await img.encode(type.ext === 'gif' ? 90 : 1));
  }

  const fileLoc = `cards/${guildID}/${new ObjectID().toString()}.${type?.ext}`;
  const ibFile = imageBucket.file(fileLoc);
  await ibFile.save(cardImageBuffer, {
    gzip: true,
    resumable: false,
    metadata: {
      contentType: type?.mime,
      cacheControl: 'public, max-age=31536000',
    },
  });

  const cardID = new ObjectID();
  await MongoDB.db('Guilds')
    .collection('customCards')
    .insertOne({
      _id: cardID,
      guild: guildID,
      name: card.name,
      description: card.description,
      url: `https://assets.dazai.app/${fileLoc}`,
      rarity: card.rarity,
      sellPrice: card.sellPrice,
    });
  return {
    cardID,
    error: false,
  };
};
export const updateCard = async (cardID: string, card: Partial<CardType>) => {
  await MongoDB.db('Guilds')
    .collection('customCards')
    .updateOne({ _id: new ObjectID(cardID) }, { $set: card });
  return {
    error: false,
  };
};
