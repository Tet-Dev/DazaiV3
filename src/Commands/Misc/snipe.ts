// Import necessary dependencies
import { Constants, EmbedOptions, InteractionDataOptionsBoolean } from 'eris';
import { Command } from '../../types/misc';
import { SniperManager } from '../../Handlers/Fun/MessageReader/SniperManager';
import TetLib from '../../Handlers/TetLib';

// Define the 'snipe' command object
export const snipe = {
  // Specify the name and description of the command
  name: 'snipe',
  description: 'Reveal the last deleted/edited message in the channel!',
  // Define any required arguments for the command
  args: [
    {
      name: 'view_edit_snipe', // The name of the argument
      description:
        'View the last edited message instead of the last deleted message', // The description of the argument
      type: Constants.ApplicationCommandOptionTypes.BOOLEAN, // The type of the argument
      required: false, // Whether the argument is required or optional
    },
  ],
  // Set the type of command as a chat input
  type: Constants.ApplicationCommandTypes.CHAT_INPUT,
  aliases: ['snipe'],
  // Define the function that will be executed when the command is called
  execute: async (bot, { interaction }) => {
    const edited = (
      TetLib.findCommandParam(
        interaction.data?.options,
        'view_edit_snipe'
      ) as InteractionDataOptionsBoolean
    )?.value;
    const lastMessage = await (edited
      ? SniperManager.getInstance().snipeLastEditedMessage(
          interaction.channel.id
        )
      : SniperManager.getInstance().snipeLastMessage(interaction.channel.id));

    if (!lastMessage) {
      return await interaction.createMessage({
        embeds: [
          {
            title: `No messages to snipe!`,
            description: `There are no messages to snipe in this channel!`,
            color: 16711680,
            thumbnail: {
              url: `https://cdn.discordapp.com/attachments/757863990129852509/1093997460558446592/Osamu_Dazai_28Wan21_Anime29.png`,
            },
          },
        ],
      });
    }
    // get guild img

    const embed = {
      title: `Sniped ${edited ? 'Edited' : 'Deleted'} Message`,
      description: `${lastMessage.content}\n\n[[Jump]](https://discord.com/channels/${interaction.guildID}/${interaction.channel.id}/${lastMessage.id})`,
      color: 16758375,
      author: {
        name: `${
          lastMessage.author.member?.nick || lastMessage.author.username
        }#${lastMessage.author.discriminator}`,
        icon_url: lastMessage.author.avatar,
      },
      fields: [
        {
          name: 'Author',
          value: `<@!${lastMessage.author.id}>`,
          inline: true,
        },
      ],
      footer: {
        text: 'Message originally sent at',
      },
      timestamp: `${new Date(lastMessage.timestamp).toISOString()}`,
      thumbnail: {
        url: interaction.member?.guild.dynamicIconURL('png', 64) ?? '',
      },
    };
    return await interaction.createMessage({
      embeds: [embed],
    });
  },
} as Command;

// Export the 'snipe' command as the default export
export default snipe;
