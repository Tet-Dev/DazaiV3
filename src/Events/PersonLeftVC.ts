import { MusicManager } from '../Handlers/Music/MusicPlayer';
import { EventHandler } from '../types/misc';

const leaveTimers = new Map<string, NodeJS.Timeout>();

export const PersonLeftVCEvent = {
  event: 'voiceChannelLeave',
  run: async (bot, member, channel) => {
    //@ts-ignore
    // check if channel is empty
    console.log(
      'someone left',
      channel.voiceMembers.size,
      channel.voiceMembers.get(bot.user.id),
      channel.voiceMembers.map((x) => x)
    );
    if (
      channel.voiceMembers.size === 1 &&
      channel.voiceMembers.get(bot.user.id)
    ) {
      console.log('setting timer');
      // set a 1 minute timer to check if the channel is still empty
      //   clear existing timer
      if (leaveTimers.get(channel.id)) {
        clearTimeout(leaveTimers.get(channel.id)!);
      }
      leaveTimers.set(
        channel.id,
        setTimeout(() => {
          // if the channel is still empty after 1 minute, delete it
          if (channel.voiceMembers.size === 1 && channel.voiceMembers.get(bot.user.id)) {
            if (
              MusicManager.getInstance().getGuildData(channel.guild.id)
                ?.textChannelId
            )
              bot.createMessage(
                MusicManager.getInstance().getGuildData(channel.guild.id)
                  ?.textChannelId!,
                {
                  embeds: [
                    {
                      title: 'Disconnected',
                      description: `I have left \`${channel.name}\` due to inactivity`,
                      color: 4456364,
                      thumbnail: {
                        url: 'https://cdn.discordapp.com/attachments/757863990129852509/1044221426418331648/tumblr_o7fk7quWVh1shr9wko3_400.jpg',
                      },
                    },
                  ],
                }
              );
            MusicManager.getInstance().disconnect(channel.guild.id);
          }
        }, 60000)
      );
    }
  },
} as EventHandler<'voiceChannelLeave'>;
export default PersonLeftVCEvent;
