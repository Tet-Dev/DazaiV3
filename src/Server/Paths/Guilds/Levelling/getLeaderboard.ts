import { Constants, TextableChannel, VoiceChannel } from 'eris';
import { InventoryManager } from '../../../../Handlers/Crates/InventoryManager';
import { XPManager } from '../../../../Handlers/Levelling/XPManager';
import { MusicManager } from '../../../../Handlers/Music/MusicPlayer';
import { RESTHandler, RESTMethods } from '../../../../types/misc';

export const getLeaderboard = {
  method: RESTMethods.GET,
  path: '/guilds/:guildID/levels/top',
  sendUser: false,
  run: async (req, res, next, user) => {
    const guildID = req.params.guildID;
    const offset = parseInt((req.query.offset as string) ?? 0);
    const limit = parseInt((req.query.limit as string) ?? 50);
    if (Number.isNaN(offset) || Number.isNaN(limit)) {
      return res.status(400).json({ error: 'Invalid offset or limit' });
    }
    const leaderboard = await XPManager.getInstance().getLeaderboard(
      guildID,

      Math.min(limit, 100),
      offset
    );
    let resultMap = await Promise.all(
      leaderboard.map(async (xp) => {
        let user =
          bot.users.get(xp.userID) ||
          (await bot
            .getRESTGuildMember(guildID, xp.userID)
            .catch((e) => null)) ||
          (await bot.getRESTUser(xp.userID).catch((e) => null));
        return {
          ...xp,
          user: {
            username: user?.username,
            discriminator: user?.discriminator,
            avatarURL: user?.avatarURL,
            id: user?.id,
            banner: user?.banner,
            color: user?.accentColor,
          },
          card: await InventoryManager.getInstance()
            .getSelectedCard(xp.userID, guildID)
            .then((x) => (x ? x.url : null)),
        };
      })
    );
    return res.json(resultMap);
  },
} as RESTHandler;
export default getLeaderboard;
