import {
  GuildShopData,
  ShopManager,
} from '../../../../Handlers/Crates/ShopManager';
import { RESTHandler, RESTMethods } from '../../../../types/misc';

export const getGuildShop = {
  method: RESTMethods.PATCH,
  path: '/guilds/:guildID/shop',
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
    const { name, description } = req.body as {
      name: string;
      description: string;
    };

    const guildShop = await ShopManager.getInstance().updateGuildShopData(
      guildID,
      {
        name,
        description,
      }
    );
    if (!guildShop) return res.status(400).json({ error: 'Invalid guild ID' });
    return res.json(guildShop);
  },
} as RESTHandler;
export default getGuildShop;
