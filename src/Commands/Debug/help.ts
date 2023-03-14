import {
  ApplicationCommandOptionsWithValue,
  Constants,
  InteractionDataOptionsString,
} from 'eris';
import { Command } from '../../types/misc';
import { InteractionCollector } from '../../Handlers/InteractionCollector';
import { InventoryManager } from '../../Handlers/Crates/InventoryManager';
import TetLib from '../../Handlers/TetLib';
import { SlashCommandHandler } from '../../Handlers/SlashCommandHandler';
export const ping = {
  name: 'help',
  description: 'gets help with a command or brings up general help',
  args: [
    {
      name: 'command',
      description: 'the command to get help with',
      type: Constants.ApplicationCommandOptionTypes.STRING,
      required: false,
    },
  ],
  type: Constants.ApplicationCommandTypes.CHAT_INPUT,
  execute: async (bot, { interaction }) => {
    const commandName = (
      TetLib.findCommandParam(
        interaction.data.options,
        'command'
      ) as InteractionDataOptionsString
    ).value;
    if (!commandName) {
      await interaction.createMessage({
        embeds: [
          {
            title: 'Help',
            description: `Coming soon:tm:`,
          },
        ],
      });
      return;
    }
    const command = SlashCommandHandler.getInstance().getCommand(commandName);
    if (!command) {
      await interaction.createMessage({
        embeds: [
          {
            title: 'Command not found!',
            description: `The command \`${commandName}\` was not found!`,
          },
        ],
      });
      return;
    }

    await interaction.createMessage({
      embeds: [
        {
          title: `\`${commandName}\` Usage`,
          description: `\`\`\`/${commandName} ${command.args
            .map((arg) =>
              (arg as ApplicationCommandOptionsWithValue).required
                ? `<${arg.name}>`
                : `[${arg.name}]`
            )
            .join(' ')}\`\`\`\n${
            command.description
          }\nRequired parameters are surrounded by \`<>\`
            Optional parameters are surrounded by \`[]\`\n**__Parameters__**`,
          color: 4325307,
          fields: command.args.map((arg) => ({
            name: `\`${arg.name}\``,
            value: `${arg.description} (${
              (arg as ApplicationCommandOptionsWithValue).required
                ? 'required'
                : 'optional'
            })`,
            inline: true,
          })),

          // [
          //   {
          //     name: '`song`',
          //     value:
          //       'The name of the song/the URL of the song/playlist URL (Spotify + Youtube)',
          //   },
          // ]
        },
      ],
    });
    return;
  },
} as Command;

export default ping;
