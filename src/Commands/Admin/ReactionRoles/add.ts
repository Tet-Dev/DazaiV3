import {
  CommandInteraction,
  ComponentInteractionSelectMenuData,
  Constants,
  TextableChannel,
} from 'eris';
import {
  AuditLogManager,
  AuditLogPreferenceKey,
} from '../../../Handlers/Auditor/AuditLogManager';
import { InteractionCollector } from '../../../Handlers/InteractionCollector';
import { findNextReaction } from '../../../Handlers/ReactionCollector';
import TetLib from '../../../Handlers/TetLib';
import {
  ReactionRoleManager,
  ReactionRoleActionTypeExplanation,
} from '../../../Handlers/Utilities/ReactionRoleManager';

export const addReactionRole = async (
  interaction: CommandInteraction<TextableChannel>
) => {
  if (!interaction.guildID || !interaction.member) return console.log('no guild id',interaction.guildID, interaction.member);
  interaction.createMessage({
    embeds: [
      {
        title: `Add Reaction Role`,
        description: `Please react to the message you want to add a reaction role to. (This operation will time out in <t:${Math.floor(
          Date.now() / 1000 + 60
        )}:R> seconds)`,
        color: 16728385,
      },
    ],
  });
  let nextReaction = await findNextReaction(
    null,
    (msg, reaction, user, type) =>
      msg.guildID === interaction.guildID &&
      user.id === interaction.member?.user.id
  );
  console.log('nextReaction', nextReaction);
  const guild =
    bot.guilds.get(interaction.guildID) ||
    (await bot.getRESTGuild(interaction.guildID));
  const roles = guild.roles;
  const botHighestRole = TetLib.getHighestRole(
    guild.members.get(bot.user.id) ||
      (await bot.getRESTGuildMember(guild.id, bot.user.id)),
    roles
  );
  if (!roles
    .filter(
      (role) =>
        !role.managed &&
        role.id !== interaction.guildID &&
        role.position < botHighestRole.position
    ).length ) {
    await interaction.createMessage({
      embeds: [
        {
          title: `# Error`,
          description: `My highest role is below all possible roles. If you would like me to give/remove these roles, please either give me a higher role or move my highest role above these roles.\n
                ${
                  roles
                    .filter(
                      (role) =>
                        role.position >= botHighestRole.position &&
                        !role.managed
                    )
                    .map((role) => `<@&${role.id}>`)
                    .join('\n') || 'None'
                }
                If you are unsure how to do this, please view the attached gif below.
              `,
          color: 16774289,
          thumbnail: {
            url: 'https://i.pinimg.com/736x/f8/37/17/f837175981662cb08c92bfee0be2a6be.jpg',
          },
          image: {
            url: `https://cdn.discordapp.com/attachments/757863990129852509/1158186066625445958/output2.gif?ex=651b5454&is=651a02d4&hm=8efd86abb503267f19458a52775a9f0628754656ba61b2987dd7d0439a1f3153&`,
          },
        } as any,
      ],
    });
    return;
  }
  const cancelMsg = await interaction.createFollowup({
    embeds: [
      {
        title: `Add Reaction Role`,
        description: `Adding a reaction role for reaction ${
          nextReaction.reaction.id
            ? `<:${nextReaction.reaction.name}:${nextReaction.reaction.id}>`
            : `**${nextReaction.reaction.name}**`
        } to the following [message](https://discord.com/channels/${
          nextReaction.message.guildID
        }/${nextReaction.message.channel.id}/${nextReaction.message.id}).
            
            **Please select the role that will be given when this reaction is added/removed.**
            `,
        thumbnail: {
          url: nextReaction.reaction.id
            ? `https://cdn.discordapp.com/emojis/${nextReaction.reaction.id}.${
                nextReaction.reaction.animated ? 'gif' : 'png'
              }`
            : undefined,
        },
        color: 16728385,
      },
    ].concat(
      roles.find((role) => role.position >= botHighestRole.position)
        ? [
            {
              title: `# Warning`,
              description: `My highest role is below the following roles. If you would like me to give/remove these roles, please either give me a higher role or move my highest role above these roles.\n
                    ${
                      roles
                        .filter(
                          (role) =>
                            role.position >= botHighestRole.position &&
                            !role.managed
                        )
                        .map((role) => `<@&${role.id}>`)
                        .join('\n') || 'None'
                    }
                    If you are unsure how to do this, please view the attached gif below.
                  `,
              color: 16774289,
              thumbnail: {
                url: 'https://i.pinimg.com/736x/f8/37/17/f837175981662cb08c92bfee0be2a6be.jpg',
              },
              image: {
                url: `https://cdn.discordapp.com/attachments/757863990129852509/1158186066625445958/output2.gif?ex=651b5454&is=651a02d4&hm=8efd86abb503267f19458a52775a9f0628754656ba61b2987dd7d0439a1f3153&`,
              },
            } as any,
          ]
        : []
    ),
    components: [
      {
        type: Constants.ComponentTypes.ACTION_ROW,
        components: [
          {
            type: Constants.ComponentTypes.SELECT_MENU,
            options: roles
              .filter(
                (role) =>
                  !role.managed &&
                  role.id !== interaction.guildID &&
                  role.position < botHighestRole.position
              )
              .map((role) => ({
                label: role.name,
                value: role.id,
                description: `ID: ${role.id}`,
              })),

            custom_id: 'role',
          },
        ],
      },
      {
        type: Constants.ComponentTypes.ACTION_ROW,
        components: [
          {
            type: Constants.ComponentTypes.BUTTON,
            label: 'Cancel Reaction Role Setup',
            // emoji: {
            //   name: '
            // },
            style: Constants.ButtonStyles.DANGER as any,
            custom_id: 'cancel',
          },
        ],
      },
    ],
  });
  let cancel = false;
  InteractionCollector.getInstance()
    .waitForInteraction(
      {
        whitelistUsers: [interaction.member.user.id],
        interactionid: `cancel`,
        limit: 1,
      },
      cancelMsg,
      60000
    )
    .then((cancelInter) => {
      cancelInter.createMessage({
        embeds: [
          {
            title: `Add Reaction Role`,
            description: `Cancelled reaction role setup.`,
            color: 16728385,
          },
        ],
      });
      cancel = true;
    });
  const roleInter = await InteractionCollector.getInstance().waitForInteraction(
    {
      whitelistUsers: [interaction.member.user.id],
      interactionid: `role`,
      limit: 1,
    },
    cancelMsg,
    60000
  );
  if (cancel) return;
  const roleID = (roleInter.data as ComponentInteractionSelectMenuData)
    .values[0];
  const role =
    (await bot.guilds.get(interaction.guildID)?.roles.get(roleID)) ||
    (await bot
      .getRESTGuildRoles(interaction.guildID)
      .then((roles) => roles.find((role) => role.id === roleID)));
  const message = nextReaction.message;
  const emoji = nextReaction.reaction;
  console.log('roleInter', roleInter.data);
  const action = await interaction.createFollowup({
    embeds: [
      {
        title: `Add Reaction Role`,
        description: `Please select the action that will be taken when this reaction is added/removed.`,
        color: 16728385,
        fields: [
          {
            name: 'Role',
            value: `<@&${roleID}>`,
          },
          {
            name: 'Message',
            value: `[Jump to Message](https://discord.com/channels/${message.guildID}/${message.channel.id}/${message.id})`,
          },
          {
            name: 'Reaction',
            value: emoji.id ? `<:${emoji.name}:${emoji.id}>` : emoji.name,
          },
        ],
      },
      {
        title: `Options`,
        description: `Please select the options for this reaction role.`,
        fields: [
          {
            name: 'Only Add Role',
            value: `Only add role when the reaction is added. No role will be removed when the reaction is removed.`,
          },
          {
            name: 'Remove Role',
            value: `Only remove role when the reaction is added. No role will be removed when the reaction is removed.`,
          },
          {
            name: 'Add and Remove Role',
            value: `Add role when the reaction is added. Remove role when the reaction is removed.`,
          },
          {
            name: 'Remove and Add Role',
            value: `Remove role when the reaction is added. Add role when the reaction is removed.`,
          },
        ],
      },
    ],
    components: [
      {
        type: Constants.ComponentTypes.ACTION_ROW,
        components: [
          {
            type: Constants.ComponentTypes.SELECT_MENU,
            options: [
              {
                label: 'Only Add Role',
                value: 'add',
                description: `Add role when the reaction is added.`,
              },
              {
                label: 'Remove Role',
                value: 'remove',
                description: `Remove role when the reaction is added.`,
              },
              {
                label: 'Add and Remove Role',
                value: 'both',
                description: `Add/remove role when the reaction is added/removed.`,
              },
              {
                label: 'Remove and Add Role',
                value: 'oppositeBoth',
                description: `Remove/add role when the reaction is added/removed.`,
              },
            ],
            custom_id: 'action',
          },
        ],
      },
      {
        type: Constants.ComponentTypes.ACTION_ROW,
        components: [
          {
            type: Constants.ComponentTypes.BUTTON,
            label: 'Cancel Reaction Role Setup',
            // emoji: {
            //   name: '
            // },
            style: Constants.ButtonStyles.DANGER as any,
            custom_id: 'cancel',
          },
        ],
      },
    ],
  });
  cancel = false;
  const cancelInter = InteractionCollector.getInstance().waitForInteraction(
    {
      whitelistUsers: [interaction.member.user.id],
      interactionid: `cancel`,
      limit: 1,
    },
    action,
    60000
  );
  const actionInter =
    await InteractionCollector.getInstance().waitForInteraction(
      {
        whitelistUsers: [interaction.member.user.id],
        interactionid: `action`,
        limit: 1,
      },
      action,
      60000
    );
  if (cancel) return;
  console.log('actionInter', actionInter.data);
  const actionValue = (actionInter.data as ComponentInteractionSelectMenuData)
    .values[0];
  const actionType = actionValue as 'add' | 'remove' | 'both' | 'oppositeBoth';
  //   create reaction role
  const resp = await ReactionRoleManager.getInstance().createReactionRole({
    actionType,
    channel: message.channel.id,
    guild: message.guildID!,
    reaction: {
      id: emoji.id || undefined,
      name: emoji.name,
    },
    roleID,
    message: message.id,
  });
  console.log('resp', resp);
  await bot.addMessageReaction(
    message.channel.id,
    message.id,
    emoji.id ? `${emoji.name}:${emoji.id}` : emoji.name
  );
  if (
    await AuditLogManager.getInstance().shouldLogAction(
      interaction.guildID,
      AuditLogPreferenceKey.logReactionRoleEdits
    )
  ) {
    const auditLogEmbed =
      await AuditLogManager.getInstance().generateAuditLogEmbed(
        interaction.guildID,
        interaction.user?.id!
      );
    auditLogEmbed.title = 'Reaction Role Added';
    auditLogEmbed.description = `A reaction role was added. \`${resp.toString()}\``;
    auditLogEmbed.fields = [
      {
        name: 'Role',
        value: `<@&${roleID}>`,
      },
      {
        name: 'Message',
        value: `[Jump to Message](https://discord.com/channels/${message.guildID}/${message.channel.id}/${message.id})`,
      },
      {
        name: 'Reaction',
        value: emoji.id ? `<:${emoji.name}:${emoji.id}>` : emoji.name,
      },
      {
        name: 'Action',
        value: ReactionRoleActionTypeExplanation[actionType],
      },
    ];

    await AuditLogManager.getInstance().logAuditMessage(
      interaction.guildID,
      auditLogEmbed
    );
  }
  await interaction.createFollowup({
    embeds: [
      {
        title: `Add Reaction Role`,
        description: `Successfully added reaction role. New reaction role ID: \`${resp.toString()}\``,
        color: 16728385,
      },
    ],
  });
};
