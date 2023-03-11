import {
  GuildShopData,
  ShopManager,
} from '../../../../Handlers/Crates/ShopManager';
import { RESTHandler, RESTMethods } from '../../../../types/misc';

export const getGuildShop = {
  method: RESTMethods.GET,
  path: '/guilds/:guildID/shop',
  sendUser: false,
  run: async (req, res, next, user) => {
    const guildID = req.params.guildID;
    if (!guildID) return res.status(400).json({ error: 'Invalid guild ID' });
    const guild = bot.guilds.get(guildID) || (await bot.getRESTGuild(guildID));
    if (!guild) return res.status(404).json({ error: 'Guild not found' });
    const guildShop = (await ShopManager.getInstance().getGuildShopData(
      guildID
    )) as GuildShopData;
    return res.json(guildShop);
  },
} as RESTHandler;
export default getGuildShop;
