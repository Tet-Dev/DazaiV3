import { APIRole } from 'discord-api-types/v10';
import { DiscordGuildData } from '../../../types/dashboardtypes';
import { RESTHandler } from '../../../types/misc';

export const getAllGuilds = {
  method: 'post',
  path: '/api/guilds/multi',
  run: async (req, res, next, user) => {
    const { guildIDs } = req.body as { guildIDs: string[] };
    if (!user) return res.status(401).send({ error: 'Unauthorized' });
    const data = (await Promise.all(
      guildIDs.map(async (guildID) => {
        const guild = bot.guilds.get(guildID);
        if (!guild) return { id: guildID, error: 'Guild not found' };
        const member =
          guild.members.get(user.id) ||
          (await bot.getRESTGuildMember(guildID, user.id));
        if (!member) return { id: guildID, error: 'You are not in this guild' };
        const data = {
          name: guild.name,
          id: guild.id,
          icon:
            `https://cdn.discordapp.com/icons/${guild?.id}/${guild?.icon}.${
              guild?.icon?.startsWith('a_') ? 'gif' : 'png'
            }?size=256` || null,
          roles: guild.roles.map(
            (r) =>
              ({
                ...r,
                permissions: r.permissions.toString(),
              } as APIRole)
          ),
          member: {
            nickname: member.nick || null,
            roles: member.roles,
          },
        } as DiscordGuildData;
        return { id: guildID, guild: data };
      })
    )) as { id: string; guild?: DiscordGuildData; error?: string }[];
    res.status(200).send(data);
  },
  sendUser: true,
} as RESTHandler;

export default getAllGuilds;
