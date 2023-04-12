// Importing required modules and types
import { Constants } from 'eris';
import { Command } from '../../types/misc';
import { SlashCommandHandler } from '../../Handlers/SlashCommandHandler';

// Define a command object named "purge"
export const purge: Command = {
  // Name of the command
  name: 'cmdpurge',
  // Description of the command
  description: 'Bot Owner Only. Reloads all slash commands',
  // Arguments required for the command, which is an empty array in this case
  args: [],
  // Type of command, which is a CHAT_INPUT command in this case
  type: Constants.ApplicationCommandTypes.CHAT_INPUT,
  // The execute function that will be run when this command is called
  execute: async (bot, { interaction }) => {
    // Checking if the user or member who triggered the command is the bot owner/admin
    if ((interaction.user || interaction.member)?.id !== env.adminID) {
      // If not, return from the function
      return;
    }
    // Acknowledging the interaction
    await interaction.acknowledge();
    // Recording the current time
    let start = Date.now();
    // Purging both the production and development commands
    await Promise.all([
      // Purging the production commands
      SlashCommandHandler.getInstance()
        .purgeCommands()
        .catch((e) => console.log(e)),
      // Purging the development commands
      SlashCommandHandler.getInstance()
        .purgeDevCommands()
        .catch((e) => console.log(e)),
    ]);
    // Sending a follow-up message to indicate that all slash commands have been purged and the time taken for it
    interaction.createFollowup(
      `Purged all slash commands!, took ${
        Date.now() - start
      }ms. Readding commands...`
    );
    // Recording the current time
    start = Date.now();
    // Re-adding all the commands from the SlashCommandHandler
    await Promise.all(
      Array.from(SlashCommandHandler.getInstance().commands.values()).map((x) =>
        SlashCommandHandler.getInstance().loadCommand(x)
      )
    );
    // Sending a follow-up message to indicate that all slash commands have been re-added and the time taken for it
    interaction.createFollowup(
      `Readded all slash commands!, took ${Date.now() - start}ms.`
    );
    // Returning from the function
    return;
  },
};

// Exporting the purge command as the default export
export default purge;
