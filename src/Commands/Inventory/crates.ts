import {
  ComponentInteraction,
  ComponentInteractionSelectMenuData,
  Constants,
  EmbedField,
  EmbedOptions,
  InteractionDataOptionsBoolean,
  InteractionDataOptionsNumber,
  InteractionDataOptionsUser,
  Member,
} from 'eris';
import {
  CardRarity,
  CardType,
  Crate,
  rarityEmojiMap,
  UserCrate,
} from '../../constants/cardNames';
import { getCard } from '../../Handlers/Crates/CardManager';
import { CrateManager } from '../../Handlers/Crates/CrateManager';
import { InventoryManager } from '../../Handlers/Crates/InventoryManager';
import { InteractionCollector } from '../../Handlers/InteractionCollector';
import { MusicManager } from '../../Handlers/Music/MusicPlayer';
import { TetLib } from '../../Handlers/TetLib';
import { Command } from '../../types/misc';
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
    if (!interaction.guildID || !interaction.member)
      return interaction.createMessage('This is a guild only command!');
    console.log(interaction.data?.options);
    const selectedUserID = (
      TetLib.findCommandParam(
        interaction.data?.options,
        'user'
      ) as InteractionDataOptionsUser
    )?.value;

    const showOpened = (
      TetLib.findCommandParam(
        interaction.data?.options,
        'show_opened'
      ) as InteractionDataOptionsBoolean
    )?.value;

    const user = selectedUserID
      ? bot.users.get(selectedUserID) || (await bot.getRESTUser(selectedUserID))
      : interaction.user || interaction.member?.user;
    if (!user) return interaction.createMessage('User not found!');
    const start = Date.now();
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
    const userCratesData = [...userCrates, ...globalUserCrates]
      .filter((x) => showOpened || !x.opened)
      .sort((a, b) => {
        // sort all unopened crates to the top, then sort by date received
        if (a.opened && !b.opened) return 1;
        if (!a.opened && b.opened) return -1;
        return b.createdAt - a.createdAt;
      });
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
              options: embeds.map((_, index) => ({
                label: `Page ${index + 1}`,
                value: `${index + 1}`,
              })),
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
                options: embeds.map((_, index) => ({
                  label: `Page ${index + 1}`,
                  value: `${index + 1}`,
                })),
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
  },
} as Command;

export default crateInv;
