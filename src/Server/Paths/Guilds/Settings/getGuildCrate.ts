import { getGuildCards } from '../../../../Handlers/Crates/CardManager';
import { CrateManager } from '../../../../Handlers/Crates/CrateManager';
import { RESTHandler, RESTMethods } from '../../../../types/misc';

export const getGuildCrate = {
  method: RESTMethods.GET,
  path: '/guilds/:guildID/settings/crate/:crateID',
  sendUser: false,
  run: async (req, res, next, user) => {
    const { guildID, crateID } = req.params;
    const crateData = await CrateManager.getInstance().getCrateTemplate(crateID);
    return res.json(crateData);
  },
} as RESTHandler;
export default getGuildCrate;
