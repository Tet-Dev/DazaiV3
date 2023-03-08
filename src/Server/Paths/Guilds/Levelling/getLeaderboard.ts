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
    let timer = Date.now();
    console.log('leaderboard timing start');
    const leaderboard = await XPManager.getInstance().getLeaderboard(
      guildID,

      Math.min(limit, 100),
      offset
    );
    console.log('leaderboard timing end', Date.now() - timer);
    let getUserTime = 0;
    let getCardTime = 0;
    let resultMap = await Promise.all(
      leaderboard.map(async (xp) => {
        let start = Date.now();
        let user =
          bot.users.get(xp.userID) ||
          (await bot
            .getRESTGuildMember(guildID, xp.userID)
            .catch((e) => null)) ||
          (await bot.getRESTUser(xp.userID).catch((e) => null));
        getUserTime += Date.now() - start;
        start = Date.now();
        let card = await InventoryManager.getInstance()
          .getSelectedCard(xp.userID, guildID)
          .then((x) => (x ? x.url : null))
          .catch((e) => null);
        getCardTime += Date.now() - start;
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
          card: card,
        };
      })
    );
    console.log('leaderboard timing end2', Date.now() - timer);
    console.log('leaderboard timing getUserTime', getUserTime);
    console.log('leaderboard timing getCardTime', getCardTime);
    return res.json(resultMap);
  },
} as RESTHandler;
export default getLeaderboard;
