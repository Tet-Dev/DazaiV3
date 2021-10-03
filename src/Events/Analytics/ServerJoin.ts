import { DiscordEvent } from 'eris-boiler';
import env from '../../env';
export const GuildJoin = new DiscordEvent({
  name: 'guildCreate',
  run: async (bot, guild) => {
    if (env.postGuildJoinAndLeaveMessages) {
      const owner = await bot.getRESTUser(guild.ownerID);
      const restGuild = await bot.getRESTGuild(guild.id, true);
      bot.createMessage(env.postGuildJoinAndLeaveMessages, {
        embed: {
          title: 'New Guild Joined',
          description: `${guild.name} (${guild.id})`,
          color: 0x00ff00,
          fields: [
            {
              name: 'Owner',
              value: `${owner.username}#${owner.discriminator} (${owner.mention})`,
              inline: false,
            },
            {
              name: 'Members',
              value: `${restGuild.approximateMemberCount!} Members`,
              inline: true,
            },
            {
              name: 'Shard ID',
              value: `${restGuild.shard.id}`,
              inline: true,
            },
          ],
          thumbnail:{
            url: restGuild.iconURL || bot.user.staticAvatarURL,
          }
        },

      });
    }
  },
})
export default GuildJoin;