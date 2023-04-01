import { Member, User } from 'eris';
import { CardType } from '../../../../constants/cardNames';
import { getCard, getCards } from '../../../../Handlers/Crates/CardManager';
import { InventoryManager } from '../../../../Handlers/Crates/InventoryManager';
import { RESTMethods, RESTHandler } from '../../../../types/misc';

export const getInventory = {
  method: RESTMethods.GET,
  path: '/guilds/:guildID/inventory/:userID',
  sendUser: false,
  run: async (req, res, next, _) => {
    const { userID, guildID } = req.params;
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
    getCards(Array.from(cardIds.keys()));
    await getCards(Array.from(cardIds.keys())).then((x) => {
      x.forEach((y) => {
        if (y) cardMap.set(y._id.toString(), y);
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
