// Import necessary modules and types
import { Constants, EmbedOptions } from 'eris';
import { UserDataManager } from '../../Handlers/Globals/UserDataManager';
import { Command } from '../../types/misc';

// Define a command object for the "vote" command
export const vote = {
  name: 'vote', // Name of the command
  description: 'Get voting info', // Brief description of the command
  args: [], // Arguments required for the command (empty array in this case)
  type: Constants.ApplicationCommandTypes.CHAT_INPUT, // Type of the command (CHAT_INPUT in this case)
  execute: async (bot, { interaction }) => {
    // The main function that will be executed when the command is triggered
    // Get the user who triggered the command
    const user = interaction.user || interaction.member?.user;
    // If the user is not found, return an error message
    if (!user) return interaction.createMessage('User not found!');

    // Get the voting data for the user
    const votingData = await UserDataManager.getInstance().getUserData(user.id);

    // Create an embed object with the voting data
    const embed = {
      title: `Voting Info for ${interaction.member?.nick || user.username}`,
      description: `You currently have voted **${votingData?.currentStreak}** times in a row (highest streak: **${votingData?.highestStreak} Votes**), and have voted a total of **${votingData?.votes}** times!`,
      fields: [
        {
          name: 'Last Vote',
          value: votingData?.lastVote
            ? `<t:${Math.floor(votingData?.lastVote / 1000)}:R>`
            : 'Never',
          inline: true,
        },
        {
          name: 'Vote Cooldown',
          value:
            (votingData?.lastVote || 0) + 12 * 60 * 60 * 1000 > Date.now()
              ? `<t:${Math.floor(
                  ((votingData?.lastVote || 0) + 12 * 60 * 60 * 1000) / 1000
                )}:R>`
              : 'Now',
          inline: true,
        },
        {
          name: 'Voting Rewards',
          value: `[View Rewards](${env.website}/app/@global)`,
          inline: true,
        },
      ],
      thumbnail: {
        url: `https://emoji.discadia.com/emojis/aa8cc650-aa39-4da8-b0ad-57f077e06a4a.PNG`,
      },
      color: 12611583, // The color of the embed
    } as EmbedOptions;

    // Send the embed message and add two buttons
    return await interaction.createMessage({
      embeds: [embed], // Embed message to be sent
      components: [
        {
          type: Constants.ComponentTypes.ACTION_ROW, // Create a row for the two buttons
          components: [
            {
              type: Constants.ComponentTypes.BUTTON,
              label: 'View Details', // Label for the first button
              emoji: {
                name: '🌐', // Emoji for the first button
              },
              style: Constants.ButtonStyles.LINK as any, // Style of the first button
              url: `${env.website}/app/@global`, // URL the first button leads to
            },
            {
              type: Constants.ComponentTypes.BUTTON,
              label: 'Vote Now', // Label for the second button
              emoji: {
                name: '🗳️', // Emoji for the second button
              },
              style: Constants.ButtonStyles.LINK as any, // Style of the second button
              url: 'https://top.gg/bot/747901310749245561/vote', // URL the second button leads to
            },
          ],
        },
      ],
    });
  },
} as Command;

export default vote;
