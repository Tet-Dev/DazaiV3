import { getGuildCards } from '../../../../Handlers/Crates/CardManager';
import { CrateManager } from '../../../../Handlers/Crates/CrateManager';
import {
  GuildShopData,
  ShopManager,
} from '../../../../Handlers/Crates/ShopManager';
import { RESTHandler, RESTMethods } from '../../../../types/misc';

export const createShopItem = {
  method: RESTMethods.POST,
  path: '/guilds/:guildID/shop/items/',
  sendUser: true,
  run: async (req, res, next, user) => {
    if (!user) return res.status(401).json({ error: 'Unauthorized' });
    const guildID = req.params.guildID;
    if (!guildID) return res.status(400).json({ error: 'Invalid guild ID' });
    const guild = bot.guilds.get(guildID) || (await bot.getRESTGuild(guildID));

    if (!guild) return res.status(404).json({ error: 'Guild not found' });
    const member =
      guild.members.get(user.id) ?? (await guild.getRESTMember(user.id));
    if (!member)
      return res.status(400).json({ error: 'Not a member of this guild' });
    const perms =
      member.permissions.has('administrator') ||
      member.permissions.has('manageGuild');
    if (!perms) {
      return res
        .status(400)
        .json({ error: 'Missing permissions, need manage guild or admin' });
    }
    const { name, description, price, items } = req.body as {
      name: string;
      description: string;
      price: number;
      items: {
        type: 'card' | 'crate' | 'role';
        itemID: string;
        count?: number;
      }[];
    };
    const guildCrates = await CrateManager.getInstance().getGuildCrateTemplates(
      guildID
    );
    const guildCards = await getGuildCards(guildID);

    if (!name || !description || !price || !items)
      return res.status(400).json({ error: 'Missing fields' });
    if (price < 0) return res.status(400).json({ error: 'Invalid price' });
    if (items.length > 10)
      return res.status(400).json({ error: 'Too many items' });
    if (items.some((i) => i.count && i.count < 1))
      return res.status(400).json({ error: 'Invalid item count' });
    if (items.some((i) => i.type === 'role' && !guild.roles.has(i.itemID)))
      return res.status(400).json({ error: 'Invalid role ID' });
    if (
      items.some(
        (i) =>
          i.type === 'crate' &&
          !guildCrates.find((x) => x._id.toString() === i.itemID)
      )
    )
      return res.status(400).json({ error: 'Invalid crate ID' });
    if (
      items.some(
        (i) =>
          i.type === 'card' &&
          !guildCards.find((x) => x._id.toString() === i.itemID)
      )
    )
      return res.status(400).json({ error: 'Invalid card ID' });

    const guildShopItem = await ShopManager.getInstance().createShopItem(
      guildID,
      {
        name,
        description,
        price,
        items,
      }
    );
    if (!guildShopItem)
      return res.status(400).json({ error: 'Could not update shop item' });
    return res.json(guildShopItem);
  },
} as RESTHandler;
export default createShopItem;
