// Import necessary dependencies
import { Constants, EmbedOptions } from 'eris';
import { Command } from '../../types/misc';

// Define the 'invite' command object
export const invite = {
  // Specify the name and description of the command
  name: 'invite',
  description: 'Invite the bot to another server!',
  // Define any required arguments for the command
  args: [],
  // Set the type of command as a chat input
  type: Constants.ApplicationCommandTypes.CHAT_INPUT,
  // Define the function that will be executed when the command is called
  execute: async (bot, { interaction }) => {
    // Create an embed with a title, description, thumbnail, and color
    const embed = {
      title: `Invite me to another server!`,
      description: `Click the button below to invite me to another server!`,
      thumbnail: {
        url: `https://cdn.discordapp.com/attachments/757863990129852509/1093997460558446592/Osamu_Dazai_28Wan21_Anime29.png`,
      },
      color: 12611583,
    } as EmbedOptions;

    // Create and return a message with the embed and a button component
    return await interaction.createMessage({
      embeds: [embed],
      components: [
        {
          type: Constants.ComponentTypes.ACTION_ROW,
          components: [
            {
              type: Constants.ComponentTypes.BUTTON,
              label: 'Invite Me!',
              emoji: {
                name: '📩',
              },
              style: Constants.ButtonStyles.LINK as any,
              url: `https://discord.com/api/oauth2/authorize?client_id=${bot.user.id}&permissions=8&scope=bot%20applications.commands`,
            },
          ],
        },
      ],
    });
  },
} as Command;

// Export the 'invite' command as the default export
export default invite;
