import { DiscordEvent } from 'eris-boiler';
import env from '../../env';

export const GuildJoin = new DiscordEvent({
  name: 'guildDelete',
  run: async (bot, guild) => {
    if (env.postGuildJoinAndLeaveMessages) {
      const owner = await bot.getRESTUser(guild.ownerID);
      bot.createMessage(env.postGuildJoinAndLeaveMessages, {
        embed: {
          title: 'Guild Left',
          description: `${guild.name} (${guild.id})`,
          color: 0xff0000,
          fields: [
            {
              name: 'Owner',
              value: `${owner.username}#${owner.discriminator} (${owner.mention})`,
              inline: false,
            },
            {
              name: 'Members',
              value: `${guild.approximateMemberCount!} Members`,
              inline: true,
            },
            {
              name: 'Shard ID',
              value: `${guild.shard.id}`,
              inline: true,
            },
          ],
          thumbnail: {
            url: guild.iconURL || bot.user.staticAvatarURL,
          },
          footer: {
            text: `${bot.guilds.size} Guilds`,
          },
        },

      });
    }
  },
})
export default GuildJoin;