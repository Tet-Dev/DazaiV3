
import { getGuildCards } from '../../../../Handlers/Crates/CardManager';
import { RESTHandler, RESTMethods } from '../../../../types/misc';

export const getRankCards = {
  method: RESTMethods.GET,
  path: '/guilds/:guildID/settings/cards',
  sendUser: false,
  run: async (req, res, next, user) => {
    const guildID = req.params.guildID;
    const cardData = await getGuildCards(guildID);
    return res.json(cardData); 
  },
} as RESTHandler;
export default getRankCards;
