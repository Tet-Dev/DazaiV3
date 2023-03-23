import { getGuildCards } from '../../../../Handlers/Crates/CardManager';
import { CrateManager } from '../../../../Handlers/Crates/CrateManager';
import {
  GuildShopData,
  ShopManager,
} from '../../../../Handlers/Crates/ShopManager';
import { RESTHandler, RESTMethods } from '../../../../types/misc';
const shopLock = new Map<string, boolean>();
export const buyShopItem = {
  method: RESTMethods.POST,
  path: '/guilds/:guildID/shop/items/:itemID/buy',
  sendUser: true,
  run: async (req, res, next, user) => {
    if (!user) return res.status(401).json({ error: 'Unauthorized' });
    if (shopLock.has(user.id))
      return res.status(400).json({ error: 'You are already buying an item!' });
    const guildID = req.params.guildID;
    const itemID = req.params.itemID;
    if (!itemID) return res.status(400).json({ error: 'Invalid item ID' });
    const item = await ShopManager.getInstance().getShopItem(itemID);
    if (!item) return res.status(400).json({ error: 'Invalid item ID' });
    if (item.guildID !== guildID)
      return res.status(400).json({ error: 'Invalid item ID' });
    if (!guildID) return res.status(400).json({ error: 'Invalid guild ID' });
    const guild = bot.guilds.get(guildID) || (await bot.getRESTGuild(guildID));

    if (!guild) return res.status(404).json({ error: 'Guild not found' });
    const member =
      guild.members.get(user.id) ?? (await guild.getRESTMember(user.id));
    if (!member)
      return res.status(400).json({ error: 'Not a member of this guild' });

    shopLock.set(user.id, true);
    setTimeout(() => {
      shopLock.delete(user.id);
    }, 10000);
    const buy = await ShopManager.getInstance().purchaseItem(
      user.id,
      guildID,
      itemID
    );
    shopLock.delete(user.id);

    if (typeof buy === 'string') return res.status(400).json({ error: buy });
    return res.json(buy);
  },
} as RESTHandler;
export default buyShopItem;
