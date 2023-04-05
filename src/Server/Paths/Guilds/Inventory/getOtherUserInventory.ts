import { Member, User } from 'eris';
import { CardRarity, CardType } from '../../../../constants/cardNames';
import {
  getCard,
  getCards,
  scrubSecretRare,
} from '../../../../Handlers/Crates/CardManager';
import { InventoryManager } from '../../../../Handlers/Crates/InventoryManager';
import { RESTMethods, RESTHandler } from '../../../../types/misc';

export const getInventory = {
  method: RESTMethods.GET,
  path: '/guilds/:guildID/inventory/:userID',
  sendUser: true,
  run: async (req, res, next, user) => {
    const { userID, guildID } = req.params;
    const revealSecretRareCards = !!req.query.revealSecretRareCards;
    if (!userID || !guildID)
      return res.status(400).json({ error: 'Bad request' });

    const inventory = await InventoryManager.getInstance().getUserInventory(
      userID,
      guildID
    );
    const globalInventory =
      await InventoryManager.getInstance().getUserInventory(userID, '@global');
    inventory.cards = inventory.cards.concat(globalInventory.cards);
    let cardIds = new Set(inventory.cards.map((x) => x.cardID));
    const cardMap = new Map<string, CardType>();
    let selfInv = new Set(
      user
        ? await InventoryManager.getInstance()
            .getUserInventory(user.id, guildID)
            .then((x) => x.cards.map((y) => y.cardID))
        : []
    );
    if (revealSecretRareCards) {
      if (!user) {
        return res.status(400).json({ error: 'Unauthorized' });
      }
      if (guildID === '@global') {
        if (user.id !== env.adminID) {
          return res.status(400).json({ error: 'Unauthorized' });
        }
      } else {
        // check user persm
        const member =
          bot.guilds.get(guildID)?.members.get(user.id) ??
          (await bot.getRESTGuildMember(guildID, user.id));
        if (!member) {
          return res.status(400).json({ error: 'Not a member of this guild' });
        }
        const perms =
          member.permissions.has('administrator') ||
          member.permissions.has('manageGuild');
        if (!perms) {
          return res
            .status(400)
            .json({ error: 'Missing permissions, need manage guild or admin' });
        }
      }
    }

    await getCards(Array.from(cardIds.keys())).then((x) => {
      x.forEach((y) => {
        if (y) {
          if (
            y.rarity === CardRarity.SECRET_RARE &&
            !selfInv.has(y._id.toString()) &&
            !revealSecretRareCards
          ) {
            cardMap.set(y._id.toString(), scrubSecretRare(y));
          } else cardMap.set(y._id.toString(), y);
        }
      });
    });
    let cards = await Promise.all(
      inventory.cards.map(async (x) => {
        let card = cardMap.get(x.cardID);
        return {
          ...x,
          card,
        };
      })
    );
    delete inventory._id;
    const member =
      (await bot.guilds.get(guildID)?.members.get(userID)) ||
      (await bot.users.get(userID)) ||
      (await bot.getRESTGuildMember(guildID, userID).catch((e) => {})) ||
      ((await bot.getRESTUser(userID).catch((e) => {})) as Member | User);
    let avatarURL = member.avatar?.startsWith('a_')
      ? member.dynamicAvatarURL('gif', 1024)
      : member.dynamicAvatarURL('png', 1024);
    let name = `${member.username}#${member.discriminator}`;
    if ('nick' in member) {
      name = member.nick || name;
    }

    return res.json({
      ...inventory,
      cards,
      viewingPerson: {
        name: `${member.username}#${member.discriminator}`,
        username: name,
        avatarURL,
        id: member.id,
      },
    });
  },
} as RESTHandler;
export default getInventory;
