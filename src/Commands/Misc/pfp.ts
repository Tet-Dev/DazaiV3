// Import necessary dependencies
import { Constants, EmbedOptions, InteractionDataOptionsUser } from 'eris';
import { Command } from '../../types/misc';
import TetLib from '../../Handlers/TetLib';

// Define the 'pfp' command object
export const pfp = {
  // Specify the name and description of the command
  name: 'pfp',
  description: 'Get the profile picture of a user!',
  // Define any required arguments for the command
  args: [
    {
      name: 'user',
      description: 'The user to get the profile picture of',
      type: Constants.ApplicationCommandOptionTypes.USER,
      required: false,
    },
  ],
  // Set the type of command as a chat input
  type: Constants.ApplicationCommandTypes.CHAT_INPUT,
  // Define the function that will be executed when the command is called
  execute: async (bot, { interaction }) => {
    // Get the user argument from the interaction
    const selectedUserID = (
      TetLib.findCommandParam(
        interaction.data.options,
        'user'
      ) as InteractionDataOptionsUser
    )?.value;

    // Get the user object for the selected user ID or use the author of the interaction if no user is selected
    const user = selectedUserID
      ? bot.users.get(selectedUserID) || (await bot.getRESTUser(selectedUserID))
      : interaction.user || interaction.member?.user;

    // If the user is not found, send an error message
    if (!user) return interaction.createMessage('User not found!');
    // Create an embed with a title, description, thumbnail, and color
    const embed: EmbedOptions = {
      title: `${user.username}'s Profile Picture`,
      description: `Here is ${user.username}'s profile picture! Click [here](${user.dynamicAvatarURL(
        'png',
        1024
      )}) if you can't see it!`,
      image: {
        url: user.dynamicAvatarURL('png', 1024),
      },
      color: 16728385,
    };
    interaction.createMessage({ embeds: [embed] });
  },
} as Command;

// Export the 'pfp' command as the default export
export default pfp;
