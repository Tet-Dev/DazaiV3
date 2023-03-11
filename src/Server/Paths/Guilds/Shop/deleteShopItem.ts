import { getGuildCards } from '../../../../Handlers/Crates/CardManager';
import { CrateManager } from '../../../../Handlers/Crates/CrateManager';
import {
  GuildShopData,
  ShopManager,
} from '../../../../Handlers/Crates/ShopManager';
import { RESTHandler, RESTMethods } from '../../../../types/misc';

export const deleteGuildShopItem = {
  method: RESTMethods.DELETE,
  path: '/guilds/:guildID/shop/items/:itemID',
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
    const itemID = req.params.itemID;
    if (!itemID) return res.status(400).json({ error: 'Invalid item ID' });
    const item = await ShopManager.getInstance().getShopItem(itemID);
    if (!item) return res.status(400).json({ error: 'Invalid item ID' });
    const guildShopItem = await ShopManager.getInstance().deleteShopItem(
      itemID
    );
    return res.json(guildShopItem);
  },
} as RESTHandler;
export default deleteGuildShopItem;
