import { CardRarity } from '../../../../constants/cardNames';
import {
  createCard,
  getCard,
  getGuildCards,
  updateCard,
} from '../../../../Handlers/Crates/CardManager';
import { RESTHandler, RESTMethods } from '../../../../types/misc';

export const createRankCard = {
  method: RESTMethods.PATCH,
  path: '/guilds/:guildID/settings/cards/:cardID',
  sendUser: true,
  run: async (req, res, next, user) => {
    const guildID = req.params.guildID;
    const cardID = req.params.cardID;
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const { name, description, rarity } = req.body as {
      name: string;
      description: string;
      rarity: string;
    };
    // name < 20 , description < 200 , rarity in enum
    if (name.length > 20 || name.length < 1) {
      return res.status(400).json({ error: 'Invalid card name' });
    }
    if (description.length > 200 || description.length < 1) {
      return res.status(400).json({ error: 'Invalid card description' });
    }
    if (!Object.values(CardRarity).includes(rarity as CardRarity)) {
      return res.status(400).json({ error: 'Invalid card rarity' });
    }
    const card = await getCard(cardID);
    if (!card) {
      return res.status(400).json({ error: 'Invalid card ID' });
    }
    if (card.guild !== guildID) {
      return res.status(400).json({ error: 'Card does not belong to guild' });
    }
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
    await updateCard(cardID, {
      name,
      description,
      rarity: rarity as CardRarity,
    });
    return res.json({ success: true });
  },
} as RESTHandler;
export default createRankCard;
