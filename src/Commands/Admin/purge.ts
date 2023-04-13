import Eris, { Constants, InteractionDataOptionsNumber } from 'eris';
import { Command } from '../../types/misc';
import TetLib from '../../Handlers/TetLib';

/**
 * Retroactive rewards command information
 */
export const purge = {
  name: 'purge',
  description: 'Admin Only. Purge messages from a channel.',
  args: [
    {
      name: 'message_count',
      description: 'The number of messages to delete.',
      type: Constants.ApplicationCommandOptionTypes.NUMBER,
      required: true,
    },
  ],
  type: Constants.ApplicationCommandTypes.CHAT_INPUT,
  execute: async (bot, { interaction }) => {
    // Check if command was executed in a server
    if (!interaction.guildID) {
      return interaction.createMessage({
        embeds: [
          {
            title: `Cannot purge messages`,
            description: `This command can only be used in a server!`,
            color: 16728385,
          },
        ],
      });
    }
    const amount = (
      TetLib.findCommandParam(
        interaction.data.options,
        'message_count'
      ) as InteractionDataOptionsNumber
    ).value;
    // Check if user has permissions to manage messages in the channel
    const channel = interaction.channel as Eris.TextChannel;
    if (
      !channel
        .permissionsOf((interaction.member || interaction.user)!.id)
        .has('manageMessages')
    ) {
      return interaction.createMessage({
        embeds: [
          {
            title: `Cannot purge messages`,
            description: `You do not have permission to do this! you need the \`Manage Messages\` permission!`,
            color: 16728385,
          },
        ],
      });
    }

    console.log('acking...');
    await interaction.acknowledge();

    // Get the number of messages to delete
    let messages = await channel.purge({
      limit: amount,
      reason: `Purged by ${interaction.member?.user.username}#${interaction.member?.user.discriminator}`,
      filter: (msg) => {
        // only delete messages if they are less than 14 days old
        if (Date.now() - msg.timestamp < 1209600000) {
          return true;
        }
        return false;
      },
    });

    // Create a message for acknowledging reward giving process
    await interaction.channel.createMessage({
      embeds: [
        {
          title: `Purged Complete!`,
          description: `Purged ${messages} messages! ${
            // if the number of messages deleted is less than the number of messages requested, add a note
            messages < amount
              ? `Only messages less than 14 days old were deleted`
              : ''
          }`,
          color: 16728385,
          footer: {
            text: `Purged by ${interaction.member?.user.username}#${interaction.member?.user.discriminator}`,
            icon_url: interaction.member?.user.avatarURL,
          },
          timestamp: new Date().toISOString(),
        },
      ],
    });
  },
} as Command;

export default purge;
