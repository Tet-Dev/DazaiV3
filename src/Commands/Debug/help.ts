import {
  ApplicationCommandOptionsWithValue,
  Constants,
  InteractionDataOptionsString,
} from 'eris';
import { Command } from '../../types/misc';
import TetLib from '../../Handlers/TetLib';
import { SlashCommandHandler } from '../../Handlers/SlashCommandHandler';

// Exporting an object that contains the command's properties.
export const help = {
  name: 'help', // Name of the command.
  description: 'gets help with a command or brings up general help', // Description of the command.
  args: [
    {
      name: 'command', // Name of the command argument.
      description: 'the command to get help with', // Description of the command argument.
      type: Constants.ApplicationCommandOptionTypes.STRING, // Type of the command argument.
      required: false, // Whether the command argument is required or not.
    },
  ],
  type: Constants.ApplicationCommandTypes.CHAT_INPUT, // Type of the application command.
  execute: async (bot, { interaction }) => {
    const commandName = (
      TetLib.findCommandParam(
        // Find the command parameter in the interaction data.
        interaction.data.options,
        'command'
      ) as InteractionDataOptionsString
    )?.value; // Casting the result of findCommandParam to InteractionDataOptionsString type.
    if (!commandName) {
      // If no command is specified, show general help message.
      await interaction.createMessage({
        embeds: [
          {
            title: 'Help',
            description: `Need help with a command? Use \`/help <command>\` to get help with a specific command. If you need help with something else, join the support server!`,
            // description:
            //   '[[Commands/Docs]](https://docs.dazai.app) [[Support Server]](https://discord.gg/jvqdyW8) [[Invite]](https://invite.dazai.app) [[Site]](https://dazai.app) ',
            // image: {
            //   url: 'https://github.com/icedTet/siteAssets/blob/main/help.png?raw=true ',
            // },
          },
        ],
        components: [
          {
            type: Constants.ComponentTypes.ACTION_ROW,
            components: [
              {
                // This is a button component
                type: Constants.ComponentTypes.BUTTON,

                // The label for the button
                label: 'Go to site',

                // The style of the button - this is a primary style button
                style: Constants.ButtonStyles.LINK,

                // The emoji for the button
                emoji: {
                  name: '🌐',
                  // animated: true,
                },
                url: env.website,
                // The custom ID for the button
              },
              {
                // This is a button component
                type: Constants.ComponentTypes.BUTTON,

                // The label for the button
                label: 'Support Server',

                // The style of the button - this is a primary style button
                style: Constants.ButtonStyles.LINK,

                // The emoji for the button
                emoji: {
                  name: '🌐',
                  // animated: true,
                },
                url: `https://invite.dazai.app`,
                // The custom ID for the button
              },
            ],
          },
        ],
      });
      return;
    }

    // Get the command from the SlashCommandHandler instance.
    const command = SlashCommandHandler.getInstance().getCommand(commandName);

    if (!command) {
      // If command is not found, show error message.
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

    // Show detailed help message for the specified command.
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
        },
      ],
    });
    return;
  },
} as Command;

export default help; // Export the help command as the default export of this module.
