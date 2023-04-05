import { CardRarity } from '../../../../constants/cardNames';
import {
  getGuildCards,
  scrubSecretRare,
} from '../../../../Handlers/Crates/CardManager';
import { InventoryManager } from '../../../../Handlers/Crates/InventoryManager';
import { RESTHandler, RESTMethods } from '../../../../types/misc';

export const getRankCards = {
  method: RESTMethods.GET,
  path: '/guilds/:guildID/settings/cards',
  sendUser: true,
  run: async (req, res, next, user) => {
    const guildID = req.params.guildID;
    // get if there is ?revealsecretrarecards=true
    const revealSecretRareCards = !!req.query.revealsecretrarecards;
    const cardData = await getGuildCards(guildID);
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

    const scrubbedCardData = cardData.map((x) => {
      if (
        x.rarity === CardRarity.SECRET_RARE &&
        !inventory.has(x._id.toString()) &&
        !revealSecretRareCards
      ) {
        return scrubSecretRare(x);
      }
      return x;
    });
    return res.json(scrubbedCardData);
  },
} as RESTHandler;
export default getRankCards;
