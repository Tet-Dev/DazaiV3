// Importing necessary modules
import { Constants, InteractionDataOptionsString } from 'eris';
import { Command } from '../../types/misc';
import util from 'util';
import nfetch from '../../Handlers/FixedNodeFetch';

// Creating a command object for evaluating code
export const evalCmd = {
  // Command name and description
  name: 'eval',
  description: "Don't use this command",

  // Command arguments, with name, description, type, and whether it's required
  args: [
    {
      name: 'code',
      description: 'The code to evaluate',
      type: Constants.ApplicationCommandOptionTypes.STRING,
      required: true,
    },
  ],

  // Command type, which specifies how it's used
  type: Constants.ApplicationCommandTypes.CHAT_INPUT,

  // The execute function for the command
  execute: async (bot, { interaction }) => {
    // Check if the user invoking the command is authorized
    if ((interaction.user || interaction.member)?.id !== env.adminID) {
      return;
    }

    // Send acknowledgement to Discord API
    await interaction.acknowledge();

    // Get the current timestamp
    const start = Date.now();

    let result;
    try {
      // Evaluate the code and capture the result
      result = await eval(
        `(async ()=> {
          return ${
            (interaction.data?.options?.[0] as InteractionDataOptionsString)
              .value
          }
        })()`
      ).catch((e: any) => e);
    } catch (error) {
      // If there's an error, capture it as the result
      result = error;
    }

    // Check the type of the result and format it accordingly
    if (!result) {
      return 'Evaluation done!';
    } else if (typeof result === 'object' || typeof result === 'function') {
      result = util.inspect(result, { depth: 3 });
    }

    // If the result is too long to send in a message, create a file with the result
    if (result?.length > 1900) {
      await interaction.createFollowup('', {
        name: 'result.js',
        file: Buffer.from(result),
      });
    } else {
      // Otherwise, send the result in a message
      return interaction.createFollowup(`\`\`\`js\n${result}\`\`\``);
    }

    return;
  },
} as Command;

// Export the eval command
export default evalCmd;
