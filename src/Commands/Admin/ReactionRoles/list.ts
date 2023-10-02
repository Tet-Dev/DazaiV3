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

export const listReactionRoles = async (
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

  const reactionRoleFields = reactionRoles.map((reactionRole) => ({
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
  }));
  const embeds = [] as EmbedOptions[];
  const pages = Math.ceil(reactionRoleFields.length / 10);
  let page = 1;
  for (let i = 0; i < pages; i++) {
    const fields = reactionRoleFields.slice(i * 10, i * 10 + 10);
    const embed: EmbedOptions = {
      title: `Reaction Roles`,
      description: `Page ${i + 1} of ${pages}`,
      color: 4456364,
      thumbnail: {
        url: 'https://cdn.discordapp.com/attachments/757863990129852509/1044221426418331648/tumblr_o7fk7quWVh1shr9wko3_400.jpg',
      },
      fields: fields,
    };

    embeds.push(embed);
  }
  await interaction.acknowledge();
  const msg = await interaction.createFollowup({
    embeds: [embeds[page - 1]],
    components: [
      {
        type: Constants.ComponentTypes.ACTION_ROW,
        components: [
          {
            type: Constants.ComponentTypes.SELECT_MENU,
            custom_id: 'pageSelect',
            placeholder: 'Jump to page',
            options: embeds
              .map((_, index) => ({
                label: `Page ${index + 1}`,
                value: `${index + 1}`,
              }))
              .slice(0, 25),
          },
        ],
      },
      {
        type: Constants.ComponentTypes.ACTION_ROW,
        components: [
          {
            type: Constants.ComponentTypes.BUTTON,
            custom_id: 'pageLeft',
            label: 'Previous page',
            emoji: {
              name: '⬅️',
            },
            style: 1,
            disabled: page === 1,
          },
          {
            type: Constants.ComponentTypes.BUTTON,
            custom_id: 'pageRight',
            label: 'Next page',
            emoji: {
              name: '➡️',
            },
            style: 1,
            disabled: page === pages,
          },
        ],
      },
    ],
  });
  const editPage = async (pg: number, interaction: ComponentInteraction) => {
    page = pg;
    await msg.edit({
      embeds: [embeds[page - 1]],
      components: [
        {
          type: Constants.ComponentTypes.ACTION_ROW,
          components: [
            {
              type: Constants.ComponentTypes.SELECT_MENU,
              custom_id: 'pageSelect',
              placeholder: 'Jump to page',
              options: embeds
                .map((_, index) => ({
                  label: `Page ${index + 1}`,
                  value: `${index + 1}`,
                }))
                .slice(0, 25),
            },
          ],
        },
        {
          type: Constants.ComponentTypes.ACTION_ROW,
          components: [
            {
              type: Constants.ComponentTypes.BUTTON,
              custom_id: 'pageLeft',
              label: 'Previous page',
              emoji: {
                name: '⬅️',
              },
              style: 1,
              disabled: Number(page) === 1,
            },
            {
              type: Constants.ComponentTypes.BUTTON,
              custom_id: 'pageRight',
              label: 'Next page',
              emoji: {
                name: '➡️',
              },
              style: 1,
              disabled: Number(page) === pages,
            },
          ],
        },
      ],
    });
    await interaction.acknowledge();
  };

  InteractionCollector.getInstance().collectInteraction(
    {
      interactionid: 'pageSelect',
      run: async (bot, interaction) => {
        let pg = ~~(interaction.data as ComponentInteractionSelectMenuData)
          .values[0];
        await editPage(pg, interaction);
        // interaction.acknowledge()
      },
      limit: 100000,
      whitelistUsers: [(interaction.user || interaction.member?.user!).id],
      doNotAcknowledge: true,
    },
    msg,
    1000 * 120
  );
  InteractionCollector.getInstance().collectInteraction(
    {
      interactionid: 'pageLeft',
      run: async (bot, interaction) => {
        await editPage(page - 1, interaction);
        // interaction.acknowledge()
      },
      doNotAcknowledge: true,
      whitelistUsers: [(interaction.user || interaction.member?.user!).id],
    },
    msg,
    1000 * 120
  );
  InteractionCollector.getInstance().collectInteraction(
    {
      interactionid: 'pageRight',
      run: async (bot, interaction) => {
        await editPage(page + 1, interaction);
        // interaction.acknowledge()
      },
      doNotAcknowledge: true,
      whitelistUsers: [(interaction.user || interaction.member?.user!).id],
    },
    msg,
    1000 * 120
  );
};
