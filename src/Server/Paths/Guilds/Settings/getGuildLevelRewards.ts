import { LevellingRewards } from '../../../../Handlers/Levelling/LevelRewards';
import { XPManager } from '../../../../Handlers/Levelling/XPManager';
import { RESTMethods, RESTHandler } from '../../../../types/misc';

export const getGuildLevelRewards = {
  method: RESTMethods.GET,
  path: '/guilds/:guildID/settings/levelrewards',
  sendUser: false,
  run: async (req, res, next, user) => {
    const guildID = req.params.guildID;
    const rewardData = await LevellingRewards.getInstance().getGuildRewards(
      guildID
    );
    return res.json(rewardData);
  },
} as RESTHandler;
export default getGuildLevelRewards;