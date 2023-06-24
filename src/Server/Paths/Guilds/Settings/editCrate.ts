import { ObjectId } from 'mongodb';
import { CardRarity, CardType } from '../../../../constants/cardNames';
import {
  createCard,
  getCard,
  getGuildCards,
} from '../../../../Handlers/Crates/CardManager';
import { CrateManager } from '../../../../Handlers/Crates/CrateManager';
import { RESTHandler, RESTMethods } from '../../../../types/misc';

export const editGuildCrate = {
  method: RESTMethods.PATCH,
  path: '/guilds/:guildID/settings/crates/:crateID',
  sendUser: true,
  run: async (req, res, next, user) => {
    const guildID = req.params.guildID;
    const crateID = req.params.crateID;
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const {
      name,
      description,
      items,
      dropRates,
      showCrateDetails,
      showRates,
      showDrops,
    } = req.body as {
      name: string;
      description: string;
      items: string[];
      dropRates: {
        [key in CardRarity]: number;
      };
      showCrateDetails: boolean;
      showRates: boolean;
      showDrops: boolean;
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
          .map((card) => card.name)
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
    const crate = await CrateManager.getInstance().getCrateTemplate(crateID);
    if (!crate) {
      return res.status(400).json({ error: 'Invalid crate' });
    }
    if (crate.guild !== guildID) {
      return res.status(400).json({ error: 'Crate not in this guild' });
    }
    const newCrate = await CrateManager.getInstance().updateCrateTemplate(
      crateID,
      {
        name,
        description,
        items,
        dropRates,
        showCrateDetails,
        showRates,
        showDrops,
      }
    );
    return res.json(newCrate);
  },
} as RESTHandler;
export default editGuildCrate;
