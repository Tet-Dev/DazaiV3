import { Constants, InteractionDataOptionsString } from 'eris';
import { Command } from '../../types/misc';
import { InteractionCollector } from '../../Handlers/InteractionCollector';
import { InventoryManager } from '../../Handlers/Crates/InventoryManager';
import util from 'util';
export const ping = {
  name: 'eval',
  description: "Don't use this command",
  args: [
    {
      name: 'code',
      description: 'The code to evaluate',
      type: Constants.ApplicationCommandOptionTypes.STRING,
      required: true,
    },
  ],
  type: Constants.ApplicationCommandTypes.CHAT_INPUT,
  execute: async (bot, { interaction }) => {
    if ((interaction.user || interaction.member)?.id !== env.adminID) {
      return;
    }
    await interaction.acknowledge();
    const start = Date.now();
    let result;
    try {
      result = await eval(
        `(async ()=> {
          return ${
            (interaction.data?.options?.[0] as InteractionDataOptionsString)
              .value
          }
        })()`
      ).catch((e: any) => e);
    } catch (error) {
      result = error;
    }

    if (!result) return 'Evaluation done!';
    if (typeof result === 'object' || typeof result === 'function') {
      result = util.inspect(result, { depth: 3 });
    }
    if (result?.length > 1900) {
      await interaction.createFollowup('', {
        name: 'result.js',
        file: Buffer.from(result),
      });
    } else return interaction.createFollowup(`\`\`\`js\n${result}\`\`\``);
    return;
  },
} as Command;

export default ping;
