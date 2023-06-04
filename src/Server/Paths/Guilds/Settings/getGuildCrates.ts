import { getGuildCards } from '../../../../Handlers/Crates/CardManager';
import { CrateManager } from '../../../../Handlers/Crates/CrateManager';
import { RESTHandler, RESTMethods } from '../../../../types/misc';

export const getGuildCrates = {
  method: RESTMethods.GET,
  path: '/guilds/:guildID/settings/crates',
  sendUser: true,
  run: async (req, res, next, user) => {
    const guildID = req.params.guildID;
    const reveal = !!req.query.reveal;
    const crateArrData =
      await CrateManager.getInstance().getGuildCrateTemplates(guildID);
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
          console.log('perms', perms);
        hasAdmin = perms;
      }
    }
    console.log('hasAdmin', hasAdmin,reveal);
    if (!hasAdmin || !reveal) {
      crateArrData.map((crate) => {
        if (!crate?.showDrops) {
          crate.items = [];
        }
        if (!crate.showCrateDetails) {
          crate.name = '???';
          crate.description = '???';
        }
        if (!crate.showRates) {
          crate.dropRates = {
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
      });
    }
    res.set('Cache-Control', 'public, max-age=5');
    return res.json(crateArrData);
  },
} as RESTHandler;
export default getGuildCrates;
