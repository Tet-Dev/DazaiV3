import Eris, { Constants, TextableChannel, VoiceChannel } from 'eris';
import {
  DefaultInventoryType,
  InventoryManager,
} from '../../../../Handlers/Crates/InventoryManager';
import { XPManager } from '../../../../Handlers/Levelling/XPManager';
import { MusicManager } from '../../../../Handlers/Music/MusicPlayer';
import { RESTHandler, RESTMethods } from '../../../../types/misc';
import {
  getGlobalCards,
  getGuildCards,
} from '../../../../Handlers/Crates/CardManager';
import { CardType } from '../../../../constants/cardNames';

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
    const leaderboard = await XPManager.getInstance().getLeaderboard(
      guildID,

      Math.min(limit, 100),
      offset
    );
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
    if (usersToFetch.length > 0) {
      (
        await (
          bot.guilds.get(guildID) || (await bot.getRESTGuild(guildID))
        )?.fetchMembers({
          userIDs: usersToFetch,
        })
      ).map((x) => userMap.set(x.id, x));
    }
    console.log(
      'leaderboard timing fetch',
      Date.now() - fetchTime,
      `for ${usersToFetch.length} users`
    );

    let fallbacks = 0;
    const [allGuildCards, allGlobalCards, getAllUsersWithSelectionPrefs] =
      await Promise.all([
        getGuildCards(guildID),
        getGlobalCards(),
        MongoDB.db('Guilds')
          .collection('userData')
          .find({
            guildID: guildID,
            selectedCard: { $exists: true },
            userID: { $in: leaderboard.map((x) => x.userID) },
          })
          .toArray() as Promise<DefaultInventoryType[]>,
      ]);
    console.log('leaderboard timing fetch cards', Date.now() - fetchTime);
    fetchTime = Date.now();
    const cardMap = new Map<string, CardType>();
    allGuildCards.forEach((x) => cardMap.set(x._id.toString(), x));
    allGlobalCards.forEach((x) => cardMap.set(x._id.toString(), x));
    console.log(
      'leaderboard timing fetch cardMap',
      Date.now() - fetchTime,
      allGuildCards
    );
    // console.log('leaderboard timing fetch prefs', Date.now() - fetchTime);
    // fetchTime = Date.now();
    const selectionPrefs = new Map<string, string>();
    getAllUsersWithSelectionPrefs.forEach((x) => {
      if (x.selectedCard) {
        let card = x.cards.find((y) => y.id === x.selectedCard);
        selectionPrefs.set(x.userID, card?.cardID ?? '');
      }
    });

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
        let card = selectionPrefs.get(xp.userID)
          ? cardMap.get(selectionPrefs.get(xp.userID)!)
          : null;
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
          sel: selectionPrefs.get(xp.userID)!,
          card: card?.url,
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
