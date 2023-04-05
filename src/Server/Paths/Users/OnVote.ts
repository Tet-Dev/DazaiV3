import { APIRole } from 'discord-api-types/v10';
import { DiscordGuildData } from '../../../types/dashboardtypes';
import { RESTHandler, RESTMethods } from '../../../types/misc';

export const onVote = {
  method: RESTMethods.POST,
  path: '/voteIncoming',
  sendUser: false,
  run: async (req, res, next, user) => {
    /*

{
  "user": "295391243318591490",
  "type": "test",
  "query": "",
  "bot": "747901310749245561"
}*/
    const voteData = req.body as {
      user: string;
      type: string;
      query: string;
      bot: string;
    };
    if (!voteData) return res.status(400).send({ error: 'Bad Request' });
    const vKey = req.headers.authorization as string;
    if (vKey !== env.voteKey)
      return res.status(401).send({ error: 'Unauthorized' });
    //
  },
} as RESTHandler;

export default onVote;
