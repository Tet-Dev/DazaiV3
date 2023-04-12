import {
  ComponentInteractionSelectMenuData,
  Constants,
  InteractionDataOptionsString,
} from 'eris';
import { Command } from '../../types/misc';
import { InteractionCollector } from '../../Handlers/InteractionCollector';
import { MusicManager } from '../../Handlers/Music/MusicPlayer';

// Define the "connect" command
export const connect = {
  // Command metadata
  name: 'connect',
  description: 'Connects to a voice channel',
  args: [],

  // Define the command's type
  type: Constants.ApplicationCommandTypes.CHAT_INPUT,

  // Define the function that gets called when the command is executed
  execute: async (bot, { interaction }) => {
    // Ensure the command was executed in a guild and by a member
    if (!interaction.guildID || !interaction.member)
      return interaction.createMessage('This is a guild only command!');

    // Get the guild data
    const res = await MusicManager.getInstance().getGuildData(
      interaction.guildID
    );

    // If the bot is already connected to a voice channel, return an error message
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

    // If the member is not in a voice channel, return an error message
    if (!interaction.member.voiceState.channelID)
      return interaction.createMessage('You are not in a voice channel!');

    // Connect to the voice channel and return a success message
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
          // Add an action row containing a button that links to the music dashboard
          type: Constants.ComponentTypes.ACTION_ROW,
          components: [
            {
              type: Constants.ComponentTypes.BUTTON,
              label: 'Dashboard',
              emoji: {
                name: '🌐',
              },
              style: 5,
              url: `${env.website}/app/guild/${interaction.guildID}/music?`, // The URL to the music dashboard
            },
          ],
        },
      ],
    });
    // If the bot was paused, return a success message indicating that music has been resumed
  },
} as Command;

export default connect;
