import { CardRarity } from '../../../../constants/cardNames';
import {
  createCard,
  getCard,
  getGuildCards,
} from '../../../../Handlers/Crates/CardManager';
import { CrateManager } from '../../../../Handlers/Crates/CrateManager';
import { RESTHandler, RESTMethods } from '../../../../types/misc';
export const createCrate = {
  method: RESTMethods.POST,
  path: '/guilds/:guildID/inventory/crates',
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
    // check if card drop rates add up to 100
    const totalDropRate = Object.values(dropRates).reduce((a, b) => a + b, 0);
    if (totalDropRate !== 100) {
      return res.status(400).json({
        error: `Drop rates must add up to 100, currently ${totalDropRate}`,
      });
    }
    // check if each drop rate is within 0-100
    for (const [key, value] of Object.entries(dropRates)) {
      if (value < 0 || value > 100) {
        return res.status(400).json({
          error: `Drop rate for ${key} must be between 0 and 100, currently ${value}`,
        });
      }
    }
    // check if all drop rates >0 have valid items in them
    const cards = await Promise.all(items.map(getCard));
    for (const [key, value] of Object.entries(dropRates)) {
      if (value > 0 && !cards.find((c) => c?.rarity === key)) {
        return res.status(400).json({
          error: `Drop rate for ${key} is greater than 0 but no cards of that rarity exist`,
        });
      }
    }
    // check if all items are valid
    if (cards.some((c) => !c)) {
      return res.status(400).json({
        error: 'One or more items are invalid',
      });
    }
    // check if all items are unique
    if (cards.length !== new Set(cards).size) {
      return res.status(400).json({
        error: 'One or more items are duplicated',
      });
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

    // if (rarity === CardRarity.EVENT_RARE || rarity === CardRarity.SECRET_RARE) {
    //   return res.status(400).json({
    //     error: 'Invalid card rarity, cannot create event or secret rare cards',
    //   });
    // }
    // check if permissions are valid
    // res.status(400).json({
    //   error: 'Cannot create a card at this time',
    // });
    // return;
    const temp = await CrateManager.getInstance().createCrateTemplate(
      {
        name,
        description,
        items,
        dropRates,
      },
      guildID
    );
    return res.json(temp);
  },
} as RESTHandler;
export default createCrate;
