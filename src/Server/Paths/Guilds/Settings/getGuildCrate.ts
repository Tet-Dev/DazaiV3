import { getGuildCards } from '../../../../Handlers/Crates/CardManager';
import { CrateManager } from '../../../../Handlers/Crates/CrateManager';
import { RESTHandler, RESTMethods } from '../../../../types/misc';

export const getGuildCrate = {
  method: RESTMethods.GET,
  path: '/guilds/:guildID/settings/crate/:crateID',
  sendUser: true,
  run: async (req, res, next, user) => {
    const { guildID, crateID } = req.params;
    const reveal = !!req.query.reveal;
    const crateData = await CrateManager.getInstance().getCrateTemplate(
      crateID
    );
    if (!crateData) {
      return next();
    }
    // check for permissions to view crate details
    let hasAdmin = true;
    if (guildID === '@global') {
      if (!user || user.id !== env.adminID) {
        hasAdmin = false;
      }
    } else {
      hasAdmin = false;
      if (user) {
        // check user persm
        const member =
          bot.guilds.get(guildID)?.members.get(user.id) ??
          (await bot.getRESTGuildMember(guildID, user.id));
        const perms =
          member.permissions.has('administrator') ||
          member.permissions.has('manageGuild');
        hasAdmin = perms;
      }
    }
    if (!hasAdmin || !reveal) {
      if (!crateData?.showDrops) {
        crateData.items = [];
      }
      if (!crateData.showCrateDetails) {
        crateData.name = '???';
        crateData.description = '???';
      }
      if (!crateData.showRates) {
        crateData.dropRates = {
          common: -1,
          rare: -1,
          super_rare: -1,
          epic: -1,
          mythic: -1,
          legendary: -1,
          event_rare: -1,
          secret_rare: -1,
        };
      }
    }

    res.set('Cache-Control', 'public, max-age=15');
    return res.json(crateData);
  },
} as RESTHandler;
export default getGuildCrate;
