import {
  CommandInteraction,
  ComponentInteraction,
  ComponentInteractionSelectMenuData,
  Constants,
  EmbedOptions,
  TextableChannel,
} from 'eris';
import { InteractionCollector } from '../../../Handlers/InteractionCollector';
import {
  ReactionRoleManager,
  ReactionRoleActionTypeExplanation,
} from '../../../Handlers/Utilities/ReactionRoleManager';
import { collectNextMessage } from '../../../Handlers/MessageCollector';

export const removeReactionRole = async (
  interaction: CommandInteraction<TextableChannel>
) => {
  if (!interaction.guildID || !interaction.member) return;
  const reactionRoles =
    await ReactionRoleManager.getInstance().getReationRolesForGuild(
      interaction.guildID
    );
  if (!reactionRoles.length) {
    return interaction.createMessage({
      embeds: [
        {
          title: `Reaction Roles`,
          description: `There are no reaction roles for this server. create some with \`/reactionrole add\``,
          color: 16728385,
          thumbnail: {
            url: 'https://i.pinimg.com/736x/f8/37/17/f837175981662cb08c92bfee0be2a6be.jpg',
          },
        },
      ],
    });
  }
  const guildRoles =
    bot.guilds.get(interaction.guildID)?.roles ||
    (await bot.getRESTGuildRoles(interaction.guildID));
  await interaction.createMessage({
    embeds: [
      {
        title: `Remove Reaction Role`,
        description: `Please enter the ID of the reaction role you want to remove. You can find the ID by using \`/reactionrole list\`. you can also type \`cancel\` to cancel this command.`,
        color: 16728385,
        thumbnail: {
          url: 'https://i.pinimg.com/736x/f8/37/17/f837175981662cb08c92bfee0be2a6be.jpg',
        },
      },
    ],
  });
  let response = await collectNextMessage(
    interaction.channel.id,
    interaction.member?.id!
  );
  while (
    response.content.toLowerCase() !== 'cancel' &&
    reactionRoles.find((r) => r._id?.toString() === response.content) ===
      undefined
  ) {
    console.log(
      'response',
      response.content,
      response.content === 'cancel',
      response.content.toLowerCase() !== 'cancel',
      reactionRoles.find((r) => r._id?.toString() === response.content)
    );
    await interaction.createFollowup({
      embeds: [
        {
          title: `Invalid ID`,
          description: `Please enter the ID of the reaction role you want to remove. You can find the ID by using \`/reactionrole list\`. you can also type \`cancel\` to cancel this command.\n\n**Your Input:** \`${
            response.content
          }\`\n\n **Valid IDs:** \`\`\`
          ${reactionRoles.map((r) => r._id).join('\n')} \`\`\``,
          color: 16728385,
          thumbnail: {
            url: 'https://i.pinimg.com/736x/f8/37/17/f837175981662cb08c92bfee0be2a6be.jpg',
          },
        },
      ],
    });
    response = await collectNextMessage(
      interaction.channel.id,
      interaction.member?.id!
    );
  }
  if (response.content.toLowerCase() === 'cancel') {
    return interaction.createFollowup({
      embeds: [
        {
          title: `Canceled`,
          description: `The command has been canceled.`,
          color: 16728385,
          thumbnail: {
            url: 'https://i.pinimg.com/736x/f8/37/17/f837175981662cb08c92bfee0be2a6be.jpg',
          },
        },
      ],
    });
  }
  const reactionRole = reactionRoles.find(
    (r) => r._id?.toString() === response.content
  );
  if (!reactionRole) {
    return interaction.createFollowup({
      embeds: [
        {
          title: `Reaction Role Not Found`,
          description: `The reaction role you tried to remove was not found. Please try again.`,
          color: 16728385,
          thumbnail: {
            url: 'https://i.pinimg.com/736x/f8/37/17/f837175981662cb08c92bfee0be2a6be.jpg',
          },
        },
      ],
    });
  }
  const confirm = await interaction.createFollowup({
    embeds: [
      {
        title: `Confirm`,
        description: `Are you sure you want to remove this reaction role?`,
        color: 16728385,
        thumbnail: {
          url: 'https://i.pinimg.com/736x/f8/37/17/f837175981662cb08c92bfee0be2a6be.jpg',
        },
        fields: [
          {
            name: `Reaction Role ID: \`${reactionRole._id}\``,
            value: `**Message:** [Jump to Message](https://discord.com/channels/${
              reactionRole.guild
            }/${reactionRole.channel}/${reactionRole.message})\n**Reaction:** ${
              reactionRole.reaction.id
                ? `<:${reactionRole.reaction.name}:${reactionRole.reaction.id}>`
                : reactionRole.reaction.name
            }\n**Role:** <@&${reactionRole.roleID}>\n**Action:** ${
              ReactionRoleActionTypeExplanation[reactionRole.actionType]
            }`,
          },
        ],
      },
    ],
    components: [
      {
        type: Constants.ComponentTypes.ACTION_ROW,
        components: [
          {
            type: Constants.ComponentTypes.BUTTON,
            label: 'Confirm',
            style: 4,
            custom_id: 'confirm',
          },
        ],
      },
    ],
  });
  const collector = await Promise.race([
    InteractionCollector.getInstance().waitForInteraction(
      {
        limit: 1,
        interactionid: 'confirm',
        whitelistUsers: [interaction.member?.id || ''],
      },
      confirm,
      60000
    ),
    new Promise((resolve) =>
      setTimeout((r) => resolve(null), 60000)
    ) as Promise<null>,
  ]);
  if (!collector) {
    return interaction.createFollowup({
      embeds: [
        {
          title: `Canceled`,
          description: `The command has been canceled.`,
          color: 16728385,
          thumbnail: {
            url: 'https://i.pinimg.com/736x/f8/37/17/f837175981662cb08c92bfee0be2a6be.jpg',
          },
        },
      ],
    });
  }
  //   deleteReactionRole(reactionRole._id);
  const result = await ReactionRoleManager.getInstance().removeReactionRole(
    reactionRole._id!
  );
  if (!result) {
    return interaction.createFollowup({
      embeds: [
        {
          title: `Failed`,
          description: `Failed to remove the reaction role. Please try again.`,
          color: 16728385,
          thumbnail: {
            url: 'https://i.pinimg.com/736x/f8/37/17/f837175981662cb08c92bfee0be2a6be.jpg',
          },
        },
      ],
    });
  }
  return interaction.createFollowup({
    embeds: [
      {
        title: `Success`,
        description: `The reaction role has been removed.`,
        color: 11629370,
        thumbnail: {
          url: 'https://i.imgur.com/8QZ7Z9A.png',
        },
      },
    ],
  });
};
