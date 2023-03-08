import Eris, { Constants, TextableChannel, VoiceChannel } from 'eris';
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
    let usersToFetch = leaderboard.map((x) => x.userID);
    let fetchTime = Date.now();
    let userMap = new Map<string, Eris.Member | Eris.User>();
    usersToFetch = usersToFetch.filter((x) => {
      let user = bot.users.get(x);
      if (user) {
        userMap.set(x, user);
        return false;
      }
      return true;
    });
    (
      await (
        bot.guilds.get(guildID) || (await bot.getRESTGuild(guildID))
      )?.fetchMembers({
        userIDs: usersToFetch,
      })
    ).map((x) => userMap.set(x.id, x));
    console.log(
      'leaderboard timing fetch',
      Date.now() - fetchTime,
      `for ${usersToFetch.length} users`
    );
    let fallbacks = 0;
    let resultMap = await Promise.all(
      leaderboard.map(async (xp) => {
        let start = Date.now();
        let user = userMap.get(xp.userID) as Eris.Member | Eris.User | null;
        if (!user) {
          user = await bot.getRESTUser(xp.userID).catch((e) => null);
          console.log(
            'falling back for ',
            user?.username,
            `#${user?.discriminator}`,
            fallbacks
          );
          bot.users.set(xp.userID, user as Eris.User);
          fallbacks++;
        }
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
