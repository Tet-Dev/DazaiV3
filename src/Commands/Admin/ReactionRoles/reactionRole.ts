import Eris, {
  Constants,
  InteractionDataOptionsNumber,
  Embed,
  InteractionDataOptionsString,
  ComponentInteractionSelectMenuData,
  EmbedField,
  ComponentInteraction,
  EmbedOptions,
  Member,
} from 'eris';
import {
  AuditLogManager,
  AuditLogPreferenceKey,
} from '../../../Handlers/Auditor/AuditLogManager';
import TetLib from '../../../Handlers/TetLib';
import { Command } from '../../../types/misc';
import { InteractionCollector } from '../../../Handlers/InteractionCollector';
import { findNextReaction } from '../../../Handlers/ReactionCollector';
import {
  ReactionRoleActionTypeExplanation,
  ReactionRoleManager,
} from '../../../Handlers/Utilities/ReactionRoleManager';
import { addReactionRole } from './add';
import { listReactionRoles } from './list';
import { removeReactionRole } from './remove';

export const reactionrole = {
  name: 'reactionrole',
  description: 'Admin Only. Configures reaction roles.',
  args: [
    {
      name: 'option',
      description: 'What to do with reaction roles. (add, remove, list)',
      type: Constants.ApplicationCommandOptionTypes.STRING,
      required: true,
      choices: [
        {
          name: 'Add Reaction Role',
          value: 'add',
        },
        {
          name: 'Remove Reaction Role',
          value: 'remove',
        },
        {
          name: 'List Reaction Roles',
          value: 'list',
        },
      ],
    },
  ],
  type: Constants.ApplicationCommandTypes.CHAT_INPUT,
  execute: async (bot, { interaction }) => {
    // Check if command was executed in a server
    console.log('interaction', interaction);
    const option = (
      TetLib.findCommandParam(
        interaction.data.options,
        'option'
      ) as InteractionDataOptionsString
    ).value.toLowerCase();
    if (!interaction.guildID) {
      return interaction.createMessage({
        embeds: [
          {
            title: `This command can only be used in a server.`,
            color: 16728385,
          },
        ],
      });
    }
    // Check if user has permission to run command
    if (!interaction.member?.permissions.has('administrator')) {
      return interaction.createMessage({
        embeds: [
          {
            title: `You do not have permission to run this command.`,
            color: 16728385,
          },
        ],
      });
    }
    // Check if option was valid
    if (!['add', 'remove', 'list'].includes(option)) {
      return interaction.createMessage({
        embeds: [
          {
            title: `Invalid option.`,
            description: `Please choose a valid option. (\`add\`, \`remove\`, \`list\`)`,
            color: 16728385,
          },
        ],
      });
    }
    // Check if option was add
    if (option === 'add') {
      await addReactionRole(interaction);
    } else if (option === 'list') {
      await listReactionRoles(interaction);
    } else if (option === 'remove') {
      await removeReactionRole(interaction);
    }

    // return interaction.createMessage({
    //   // print out the following arguments
    //   embeds: [
    //     {
    //       title: `Arguments Check`,
    //       description: `\`\`\`ts\n${JSON.stringify(
    //         TetLib.findCommandParam(interaction.data.options, 'option')
    //       )}\n\`\`\``,
    //       color: 16728385,
    //     },
    //   ],
    // });
  },
} as Command;

export default reactionrole;
