import { CardRarity } from '../../../../constants/cardNames';
import {
  getCard,
  getGuildCards,
  scrubSecretRare,
} from '../../../../Handlers/Crates/CardManager';
import { InventoryManager } from '../../../../Handlers/Crates/InventoryManager';
import { RESTHandler, RESTMethods } from '../../../../types/misc';

export const getRankCard = {
  method: RESTMethods.GET,
  path: '/guilds/:guildID/settings/cards/:cardID',
  sendUser: false,
  run: async (req, res, next, user) => {
    const { guildID, cardID } = req.params;
    const cardData = await getCard(cardID);
    const revealSecretRareCards = !!req.query.revealsecretrarecards;
    let inventory = new Set(
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
    if (!cardData) {
      return res.status(400).json({ error: 'Card not found' });
    }
    if (
      cardData.rarity === CardRarity.SECRET_RARE &&
      !inventory.has(cardData._id.toString()) &&
      !revealSecretRareCards
    ) {
      return res.json(scrubSecretRare(cardData));
    }
    return res.json(cardData);
  },
} as RESTHandler;
export default getRankCard;
