import { Constants, InteractionDataOptionsString } from 'eris';
import { Command } from '../../types/misc';
import { InteractionCollector } from '../../Handlers/InteractionCollector';
import { InventoryManager } from '../../Handlers/Crates/InventoryManager';
import util from 'util';
import { SlashCommandHandler } from '../../Handlers/SlashCommandHandler';
export const purge = {
  name: 'cmdpurge',
  description: 'Bot Owner Only. Reloads all slash commands',
  args: [],
  type: Constants.ApplicationCommandTypes.CHAT_INPUT,
  execute: async (bot, { interaction }) => {
    if ((interaction.user || interaction.member)?.id !== env.adminID) {
      return;
    }
    await interaction.acknowledge();
    let start = Date.now();
    await Promise.all([
      SlashCommandHandler.getInstance()
        .purgeCommands()
        .catch((e) => console.log(e)),
      SlashCommandHandler.getInstance()
        .purgeDevCommands()
        .catch((e) => console.log(e)),
    ]);
    interaction.createFollowup(
      `Purged all slash commands!, took ${
        Date.now() - start
      }ms. Readding commands...`
    );
    start = Date.now();
    await Promise.all(
      Array.from(SlashCommandHandler.getInstance().commands.values()).map((x) =>
        SlashCommandHandler.getInstance().loadCommand(x)
      )
    );
    interaction.createFollowup(
      `Readded all slash commands!, took ${Date.now() - start}ms.`
    );
    return;
  },
} as Command;

export default purge;
