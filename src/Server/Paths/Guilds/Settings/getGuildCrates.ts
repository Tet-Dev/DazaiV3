
import { getGuildCards } from '../../../../Handlers/Crates/CardManager';
import { CrateManager } from '../../../../Handlers/Crates/CrateManager';
import { RESTHandler, RESTMethods } from '../../../../types/misc';

export const getGuildCrates = {
  method: RESTMethods.GET,
  path: '/guilds/:guildID/settings/crates',
  sendUser: false,
  run: async (req, res, next, user) => {
    const guildID = req.params.guildID;
    const cardData = await CrateManager.getInstance().getGuildCrateTemplates(guildID);
    return res.json(cardData); 
  },
} as RESTHandler;
export default getGuildCrates;
