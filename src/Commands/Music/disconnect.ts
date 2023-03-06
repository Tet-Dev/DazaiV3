import {
  ComponentInteractionSelectMenuData,
  Constants,
  InteractionDataOptionsString,
} from 'eris';
import { Command } from '../../types/misc';
import { InteractionCollector } from '../../Handlers/InteractionCollector';
import { MusicManager } from '../../Handlers/Music/MusicPlayer';
export const connect = {
  name: 'disconnect',
  description: 'Disconnects from a voice channel',
  args: [],
  type: Constants.ApplicationCommandTypes.CHAT_INPUT,
  execute: async (bot, { interaction }) => {
    if (!interaction.guildID || !interaction.member)
      return interaction.createMessage('This is a guild only command!');
    const start = Date.now();
    const res = await MusicManager.getInstance().getGuildData(
      interaction.guildID
    );
    if (!res) {
      return interaction.createMessage({
        embeds: [
          {
            title: 'Unable to disconnect',
            description:
              'I am not in a voice channel! use `/connect` to connect me!',
            color: 16728385,
            thumbnail: {
              url: 'https://cdn.discordapp.com/attachments/757863990129852509/1044221426418331648/tumblr_o7fk7quWVh1shr9wko3_400.jpg',
            },
          },
        ],
      });
    }
    if (!interaction.member.voiceState.channelID)
      return interaction.createMessage('You are not in a voice channel!');

    await MusicManager.getInstance().disconnect(interaction.guildID);
    return interaction.createMessage({
      embeds: [
        {
          title: 'Disconnected',
          description: `Bye!`,
          color: 4456364,
          thumbnail: {
            url: 'https://cdn.discordapp.com/attachments/757863990129852509/1044221426418331648/tumblr_o7fk7quWVh1shr9wko3_400.jpg',
          },
        },
      ],
      // components: [
      //   {
      //     type: Constants.ComponentTypes.ACTION_ROW,
      //     components: [
      //       {
      //         type: Constants.ComponentTypes.BUTTON,
      //         label: 'Dashboard',
      //         emoji: {
      //           name: '🌐',
      //         },
      //         style: 5,
      //         url: `${env.website}/app/guild/${interaction.guildID}/music?`,
      //       },
      //     ],
      //   },
      // ],
    });

    if (res) {
      return interaction.createMessage({
        embeds: [
          {
            title: 'Music Paused',
            description: 'Music has been paused! use `/resume` to resume it!',
            color: 16728385,
            thumbnail: {
              url: 'https://cdn.discordapp.com/attachments/757863990129852509/1044221426418331648/tumblr_o7fk7quWVh1shr9wko3_400.jpg',
            },
          },
        ],
      });
    }
    return interaction.createMessage({
      embeds: [
        {
          title: 'Music Resumed',
          description: 'Music has been resumed! use `/pause` to resume it!',
          color: 4456364,
          thumbnail: {
            url: 'https://cdn.discordapp.com/attachments/757863990129852509/1044221426418331648/tumblr_o7fk7quWVh1shr9wko3_400.jpg',
          },
        },
      ],
    });
  },
} as Command;

export default connect;
