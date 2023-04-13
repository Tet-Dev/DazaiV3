// Import necessary dependencies
import { Constants, EmbedOptions } from 'eris';
import { Command } from '../../types/misc';

// Define the 'dashboard' command object
export const dashboard = {
  // Specify the name and description of the command
  name: 'dashboard',
  description: 'View the dashboard for the bot',
  // Define any required arguments for the command
  args: [],
  // Set the type of command as a chat input
  type: Constants.ApplicationCommandTypes.CHAT_INPUT,
  // Define the function that will be executed when the command is called
  execute: async (bot, { interaction }) => {
    // Create an embed with a title, description, thumbnail, and color
    const embed = {
      title: `Dashboard`,
      description: `Click the button below to access the dashboard`,
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
              label: 'Dashboard',
              emoji: {
                name: '🔗',
              },
              style: Constants.ButtonStyles.LINK as any,
              url: `${env.website}/app`,
            },
          ],
        },
      ],
    });
  },
} as Command;

// Export the 'dashboard' command as the default export
export default dashboard;
