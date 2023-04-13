import { AuditLogManager } from '../../../../../Handlers/Auditor/AuditLogManager';
import { RESTHandler, RESTMethods } from '../../../../../types/misc';

export const getGuildAuditLogData = {
  method: RESTMethods.GET,
  path: '/guilds/:guildID/settings/audit',
  sendUser: false,
  run: async (req, res, next, user) => {
    const { guildID } = req.params;
    const auditLogData =
      await AuditLogManager.getInstance().getAuditLogPreference(guildID);
    return res.json(auditLogData);
  },
} as RESTHandler;
export default getGuildAuditLogData;
