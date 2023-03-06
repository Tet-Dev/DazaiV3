import { ObjectId } from 'mongodb';
import { CardRarity, CardType } from '../../../../constants/cardNames';
import {
  createCard,
  getCard,
  getGuildCards,
} from '../../../../Handlers/Crates/CardManager';
import { CrateManager } from '../../../../Handlers/Crates/CrateManager';
import { RESTHandler, RESTMethods } from '../../../../types/misc';

export const createGuildCrate = {
  method: RESTMethods.POST,
  path: '/guilds/:guildID/settings/crates',
  sendUser: true,
  run: async (req, res, next, user) => {
    const guildID = req.params.guildID;
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const { name, description, items, dropRates } = req.body as {
      name: string;
      description: string;
      items: string[];
      dropRates: {
        [key in CardRarity]: number;
      };
    };
    if (!name || !description || !items || !dropRates) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    // check if all drop rates are in enum
    if (
      !Object.values(CardRarity).every((rarity) =>
        Object.keys(dropRates).includes(rarity)
      )
    ) {
      return res.status(400).json({ error: 'Invalid drop rates' });
    }
    // check if all items are valid
    const cards = (await Promise.all(
      items.map(async (item) => (await getCard(item)) || item)
    )) as CardType[];
    if (
      cards.some((card) => typeof card === 'string' || card.guild !== guildID)
    ) {
      return res.status(400).json({
        error: `Invalid items: ${cards
          .filter((card) => typeof card === 'string' || card.guild !== guildID)
          .join(', ')}`,
      });
    }
    // ensure all drop rates > 0 have at least an item of that rarity
    if (
      Object.values(CardRarity).some(
        (rarity) =>
          dropRates[rarity] > 0 && !cards.some((card) => card.rarity === rarity)
      )
    ) {
      return res.status(400).json({
        error: `Cannot have drop rates for rarities with no items. Missing: ${Object.values(
          CardRarity
        )
          .filter(
            (rarity) =>
              dropRates[rarity] > 0 &&
              !cards.some((card) => card.rarity === rarity)
          )
          .join(', ')}`,
      });
    }
    // ensure all drop rates are > 0.00001
    if (
      Object.values(dropRates).some((rate) => rate < 0.00001 && !(rate === 0))
    ) {
      return res.status(400).json({ error: 'Drop rates must be > 0.00001%' });
    }
    // ensure all drop rates are < 100
    if (Object.values(dropRates).some((rate) => rate > 100)) {
      return res.status(400).json({ error: 'Drop rates must be < 100' });
    }
    // ensure all drop rates add up to 100
    if (Object.values(dropRates).reduce((a, b) => a + b, 0) !== 100) {
      return res.status(400).json({ error: 'Drop rates must add up to 100' });
    }

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
    const currentCrateCount =
      await CrateManager.getInstance().getGuildCrateTemplates(guildID);
    if (currentCrateCount.length >= 10) {
      return res.status(400).json({
        error: 'Cannot create more than 10 crates per guild',
      });
    }
    const crate = await CrateManager.getInstance().createCrateTemplate(
      {
        _id: new ObjectId(),
        name: name,
        description: description,
        dropRates: dropRates,

        items: items,
      },
      guildID
    );
    return res.json(crate);
  },
} as RESTHandler;
export default createGuildCrate;
