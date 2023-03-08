import {
  getCard,
  getGuildCards,
} from '../../../../Handlers/Crates/CardManager';
import { RESTHandler, RESTMethods } from '../../../../types/misc';

export const getRankCard = {
  method: RESTMethods.GET,
  path: '/guilds/:guildID/settings/cards/:cardID',
  sendUser: false,
  run: async (req, res, next, user) => {
    const { guildID, cardID } = req.params;
    const cardData = await getCard(cardID);
    return res.json(cardData);
  },
} as RESTHandler;
export default getRankCard;
