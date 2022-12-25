import { APIRole } from 'discord-api-types/v10';
import { DiscordGuildData } from '../../../types/dashboardtypes';
import { RESTHandler } from '../../../types/misc';

export const getAllGuilds = {
  method: 'get',
  path: '/api/guilds/:guildID',
  run: async (req, res, next, user) => {
    const { guildID } = req.params;
    if (!user) return res.status(401).send({ error: 'Unauthorized' });
    const guild = bot.guilds.get(guildID);
    if (!guild) return res.status(404).send({ error: 'Guild not found' });
    const member = guild.members.get(user.id) || await bot.getRESTGuildMember(guildID, user.id);
    if (!member)
      return res.status(403).send({ error: 'You are not in this guild' });
    const data = {
      name: guild.name,
      id: guild.id,
      icon:
        guild.dynamicIconURL('gif', 256) ||
        guild.dynamicIconURL('png', 256) ||
        null,
      roles: guild.roles.map(
        (r) =>
          ({
            ...r,
            permissions: r.permissions.toString(),
          } as APIRole)
      ),
    } as DiscordGuildData;
    res.status(200).send(data);
  },
  sendUser: true,
} as RESTHandler;

export default getAllGuilds;