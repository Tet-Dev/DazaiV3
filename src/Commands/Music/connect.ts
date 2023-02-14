import {
  ComponentInteractionSelectMenuData,
  Constants,
  InteractionDataOptionsString,
} from 'eris';
import { Command } from '../../types/misc';
import { InteractionCollector } from '../../Handlers/InteractionCollector';
import { MusicManager } from '../../Handlers/Music/MusicPlayer';
export const connect = {
  name: 'connect',
  description: 'Connects to a voice channel',
  args: [],
  type: Constants.ApplicationCommandTypes.CHAT_INPUT,
  execute: async (bot, { interaction }) => {
    if (!interaction.guildID || !interaction.member)
      return interaction.createMessage('This is a guild only command!');
    const start = Date.now();
    const res = await MusicManager.getInstance().getGuildData(
      interaction.guildID
    );
    if (res) {
      return interaction.createMessage({
        embeds: [
          {
            title: 'Unable to connect',
            description:
              'I am already connected to a voice channel! use `/disconnect` to disconnect me!',
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

    const connecter = await MusicManager.getInstance().connect(
      interaction.guildID,
      interaction.member.voiceState.channelID,
      interaction.channel.id
    );
    if (!connecter) {
      return interaction.createMessage({
        embeds: [
          {
            title: 'Unable to connect',
            description: 'Unable to connect to the voice channel!',
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
          title: 'Connected',
          description: `Connected to the voice channel, add some songs to the queue through the [dashboard](${env.website}/app/guild/${interaction.guildID}/music?) or \`/play\`!`,
          color: 4456364,
          thumbnail: {
            url: 'https://cdn.discordapp.com/attachments/757863990129852509/1044221426418331648/tumblr_o7fk7quWVh1shr9wko3_400.jpg',
          },
        },
      ],
      components: [
        {
          type: Constants.ComponentTypes.ACTION_ROW,
          components: [
            {
              type: Constants.ComponentTypes.BUTTON,
              label: 'Dashboard',
              emoji: {
                name: '🌐',
              },
              style: 5,
              url: `${env.website}/app/guild/${interaction.guildID}/music?`,
            },
          ],
        },
      ],
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