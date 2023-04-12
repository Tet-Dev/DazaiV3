import {
  ComponentInteraction,
  ComponentInteractionSelectMenuData,
  Constants,
  EmbedField,
  EmbedOptions,
  InteractionDataOptionsBoolean,
  InteractionDataOptionsUser,
} from 'eris';
import { UserCrate } from '../../constants/cardNames';
import { CrateManager } from '../../Handlers/Crates/CrateManager';
import { InteractionCollector } from '../../Handlers/InteractionCollector';
import { TetLib } from '../../Handlers/TetLib';
import { Command } from '../../types/misc';

// Returns an embed field containing crate information
const parseCrateItem = (crate: UserCrate) => {
  return {
    name: `__📦 ${crate.name}__`,
    value: `
Crate ID: \`${crate._id}\`
Crate Type: ${crate.guildID ? 'Guild-specific' : 'Global'}
Crate Received: <t:${Math.floor(crate.createdAt / 1000)}:R>
Crate Opened: ${
      crate.opened
        ? `**<t:${Math.floor(crate.openedAt! / 1000)}:R>**`
        : '**No**'
    }
Crate Item: **${crate.opened ? crate.item?.name : '[???]'}** ${
      crate.opened ? `(\`${crate.itemID}\`)` : ''
    }
    ​
`,
  } as EmbedField;
};

// Chat command to view a user's crate inventory
export const crateInv = {
  name: 'crates',
  description: 'Views what crates you, or someone else, own',
  args: [
    {
      name: 'show_opened',
      description: 'Whether to show opened crates (Default: false)',
      type: Constants.ApplicationCommandOptionTypes.BOOLEAN,
      required: false,
    },
    {
      name: 'user',
      description: 'The user you want to view the crate inventory of',
      type: Constants.ApplicationCommandOptionTypes.USER,
      required: false,
    },
  ],
  type: Constants.ApplicationCommandTypes.CHAT_INPUT,
  execute: async (bot, { interaction }) => {
    // Check if the command was invoked in a guild channel
    if (!interaction.guildID || !interaction.member)
      return interaction.createMessage('This is a guild only command!');

    // Get the ID of the user whose crate inventory is being viewed
    const selectedUserID = (
      TetLib.findCommandParam(
        interaction.data?.options,
        'user'
      ) as InteractionDataOptionsUser
    )?.value;

    // Determine whether to show opened crates
    const showOpened = (
      TetLib.findCommandParam(
        interaction.data?.options,
        'show_opened'
      ) as InteractionDataOptionsBoolean
    )?.value;

    // Get the user object
    const user = selectedUserID
      ? bot.users.get(selectedUserID) || (await bot.getRESTUser(selectedUserID))
      : interaction.user || interaction.member?.user;
    if (!user) return interaction.createMessage('User not found!');

    // Get the user's crates (both guild-specific and global)
    const userCrates = (await CrateManager.getInstance().getUserCrates(
      user.id,
      interaction.guildID,
      false
    )) as UserCrate[];
    const globalUserCrates = (await CrateManager.getInstance().getUserCrates(
      user.id,
      `@global`,
      false
    )) as UserCrate[];

    // Filter the user's crates based on whether to show opened crates or not, and sort by date received
    const userCratesData = [...userCrates, ...globalUserCrates]
      .filter((x) => showOpened || !x.opened)
      .sort((a, b) => {
        if (a.opened && !b.opened) return 1; // Sort all opened crates to the bottom
        if (!a.opened && b.opened) return -1; // Sort all unopened crates to the top
        return b.createdAt - a.createdAt; // Sort by date received
      });

    // If the user doesn't have any unopened crates and opened crates are not being shown, return an error message
    if (!userCratesData?.filter((x) => !x.opened)?.length && !showOpened)
      return await interaction.createMessage({
        embeds: [
          {
            title: `Cannot view ${user.username}'s crates`,
            description: `This user's does not have any unopened crates! ${
              [...userCrates, ...globalUserCrates].length
                ? `You can view their opened crates by re-running the command with \`\`\`/crates show_opened:True ${
                    selectedUserID ? `user:<@!${user.id}>` : ``
                  }\`\`\``
                : ``
            }`,
            color: 16728385,
            thumbnail: {
              url: 'https://i.pinimg.com/736x/f8/37/17/f837175981662cb08c92bfee0be2a6be.jpg',
            },
          },
        ],
      });

    // Create embeds to display the user's crates (in groups of 5 per page)
    const embeds = [] as EmbedOptions[];
    const pages = Math.ceil(userCratesData.length / 5);
    let page = 1;
    await interaction.acknowledge();
    for (let i = 0; i < pages; i++) {
      const cardPage = userCratesData.slice(i * 5, i * 5 + 5);
      const embed: EmbedOptions = {
        title: `Crates for ${user.username}`,
        description: `Page ${i + 1} of ${pages}`,
        color: 4456364,
        thumbnail: {
          url: user.dynamicAvatarURL('png', 64),
        },
        fields: cardPage.map((item) => parseCrateItem(item)),
        footer: {
          text: `Tip: Go to your online inventory to open them or open crates with /crate <crateID> !`,
        },
      };
      embeds.push(embed);
    }

    // Send the first page of the crate inventory embed, along with navigation buttons
    const msg = await interaction.createFollowup({
      embeds: [embeds[page - 1]],
      components: [
        {
          type: Constants.ComponentTypes.ACTION_ROW,
          components: [
            {
              type: Constants.ComponentTypes.BUTTON,
              label: 'View Online',
              emoji: {
                name: '🌐',
              },
              style: 5,
              url: `${env.website}/app/guild/${interaction.guildID}/inventory?`,
            },
          ],
        },
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

    // Function to edit the current page of the crate inventory embed and update the navigation buttons
    const editPage = async (pg: number, interaction: ComponentInteraction) => {
      page = pg;
      await msg.edit({
        embeds: [embeds[page - 1]],
        components: [
          {
            type: Constants.ComponentTypes.ACTION_ROW,
            components: [
              {
                type: Constants.ComponentTypes.BUTTON,
                label: 'View Online',
                emoji: {
                  name: '🌐',
                },
                style: 5,
                url: `${env.website}/app/guild/${interaction.guildID}/inventory?`,
              },
            ],
          },

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

    // Collect interactions for the navigation buttons
    InteractionCollector.getInstance().collectInteraction(
      {
        interactionid: 'pageSelect',
        run: async (bot, interaction) => {
          let pg = ~~(interaction.data as ComponentInteractionSelectMenuData)
            .values[0];
          await editPage(pg, interaction);
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
        },
        doNotAcknowledge: true,
        whitelistUsers: [(interaction.user || interaction.member?.user!).id],
      },
      msg,
      1000 * 120
    );
  },
} as Command;

export default crateInv;
