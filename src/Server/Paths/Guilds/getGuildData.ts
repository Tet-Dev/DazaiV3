import { APIRole } from 'discord-api-types/v10';
import { DiscordGuildData } from '../../../types/dashboardtypes';
import { RESTHandler } from '../../../types/misc';

export const getAllGuilds = {
  method: 'get',
  path: '/guilds/:guildID',
  sendUser: true,
  run: async (req, res, next, user) => {
    const { guildID } = req.params;
    // if (!user) return res.status(401).send({ error: 'Unauthorized' });
    const guild = bot.guilds.get(guildID);
    if (!guild) return res.status(404).send({ error: 'Guild not found' });
    const member = user
      ? guild.members.get(user.id) ||
        (await bot.getRESTGuildMember(guildID, user.id))
      : null;
    // if (!member)
    //   return res.status(403).send({ error: 'You are not in this guild' });
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
            id: r.id,
            name: r.name,
            color: r.color,
            hoist: r.hoist,
            position: r.position,
            managed: r.managed,
            mentionable: r.mentionable,
            tags: r.tags,
            unicode_emoji: r.unicodeEmoji,
            icon: r.icon,
            permissions: r.permissions.toJSON().allow,
          } as APIRole)
      ),
      banner: guild.bannerURL || null,
      background: guild.splashURL || null,
      member: member
        ? {
            nickname: member.nick || null,
            roles: member.roles,
          }
        : null,
      hasAdmin: member
        ? member.permissions.has('administrator') ||
          member.permissions.has('manageGuild')
        : false,
    } as DiscordGuildData;
    res.status(200).send(data);
  },
} as RESTHandler;

export default getAllGuilds;
