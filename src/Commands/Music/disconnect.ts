import {
  ComponentInteractionSelectMenuData,
  Constants,
  InteractionDataOptionsString,
} from 'eris';
import { Command } from '../../types/misc';
import { InteractionCollector } from '../../Handlers/InteractionCollector';
import { MusicManager } from '../../Handlers/Music/MusicPlayer';

// Export a command object that represents the `disconnect` command.
export const disconnect = {
  // Name of the command.
  name: 'disconnect',
  // Description of the command.
  description: 'Disconnects from a voice channel',
  // Arguments required for the command.
  args: [],
  // Type of the command.
  type: Constants.ApplicationCommandTypes.CHAT_INPUT,

  // Executes the command when called by a user.
  execute: async (bot, { interaction }) => {
    // Check if the command is being executed in a guild.
    if (!interaction.guildID || !interaction.member)
      return interaction.createMessage('This is a guild only command!');

    // Get the current time for performance tracking.
    const start = Date.now();

    // Get the guild data from the music manager.
    const res = await MusicManager.getInstance().getGuildData(
      interaction.guildID
    );

    // Check if the bot is currently in a voice channel.
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

    // Check if the user is in a voice channel.
    if (!interaction.member.voiceState.channelID)
      return interaction.createMessage('You are not in a voice channel!');

    // Disconnect the bot from the voice channel.
    await MusicManager.getInstance().disconnect(interaction.guildID);

    // Send a message to confirm the disconnection.
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
    });
  },
} as Command;

export default disconnect;
