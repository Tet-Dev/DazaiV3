import { APIRole } from 'discord-api-types/v10';
import { VoteManager } from '../../../Handlers/Globals/VoteManager';
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
    console.log('Vote incoming', voteData);
    if (!voteData) return res.status(400).send({ error: 'Bad Request' });
    const vKey = req.headers.authorization as string;
    if (vKey !== env.voteKey)
      return res.status(401).send({ error: 'Unauthorized' });
    // process vote
    console.log('Processing vote for user', voteData.user);
    const rewards = await VoteManager.getInstance().processVote(voteData.user);
    console.log('Rewards', rewards);
    res.status(200).send({ success: true });
  },
} as RESTHandler;

export default onVote;
