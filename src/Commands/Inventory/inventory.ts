import {
  ComponentInteraction,
  ComponentInteractionSelectMenuData,
  Constants,
  EmbedField,
  EmbedOptions,
  InteractionDataOptionsNumber,
  InteractionDataOptionsUser,
  Member,
} from 'eris';
import {
  CardRarity,
  CardType,
  Crate,
  rarityEmojiMap,
} from '../../constants/cardNames';
import { getCard } from '../../Handlers/Crates/CardManager';
import { CrateManager } from '../../Handlers/Crates/CrateManager';
import { InventoryManager } from '../../Handlers/Crates/InventoryManager';
import { InteractionCollector } from '../../Handlers/InteractionCollector';
import { MusicManager } from '../../Handlers/Music/MusicPlayer';
import { Command } from '../../types/misc';

const parseInventoryItem = (
  item: {
    cardID: string;
    id: string;
  },
  card: CardType
) => {
  return {
    name: `${rarityEmojiMap[card.rarity]}   ${card.name}`,
    value: `Item ID: \`${item.id}\`
    \`\`\`${card.description}\`\`\`
    `,
  } as EmbedField;
};
export const inventory = {
  name: 'inventory',
  description: 'Get your inventory, or the inventory of a user',
  args: [
    {
      name: 'user',
      description: 'The user to get the rank card of',
      type: Constants.ApplicationCommandOptionTypes.USER,
      required: false,
    },
  ],
  type: Constants.ApplicationCommandTypes.CHAT_INPUT,
  execute: async (bot, { interaction }) => {
    if (!interaction.guildID || !interaction.member)
      return interaction.createMessage('This is a guild only command!');
    const selectedUserID = (
      interaction.data?.options?.[0] as InteractionDataOptionsUser
    )?.value;
    const user = selectedUserID
      ? bot.users.get(selectedUserID) || (await bot.getRESTUser(selectedUserID))
      : interaction.user || interaction.member?.user;
    if (!user) return interaction.createMessage('User not found!');
    const start = Date.now();
    const inventory = await InventoryManager.getInstance().getUserInventory(
      user.id,
      interaction.guildID
    );
    const globalInventory =
      await InventoryManager.getInstance().getUserInventory(user.id, '@global');
    if (!globalInventory.cards.length && !inventory.cards.length) {
      await interaction.createMessage({
        embeds: [
          {
            title: `Cannot view ${user.username}'s inventory`,
            description: `This user's inventory is empty!`,
            color: 16728385,
            thumbnail: {
              url: 'https://i.pinimg.com/736x/f8/37/17/f837175981662cb08c92bfee0be2a6be.jpg',
            },
          },
        ],
      });
      if (interaction.guildID === '739559911033405592') {
        // check crate count
        const userCrates = await CrateManager.getInstance().getUserCrates(
          interaction.member
            ? interaction.member.user.id
            : interaction.user?.id!,
          interaction.guildID,
          true
        );
        if (userCrates.length < 2) {
          const crateTemplate =
            await CrateManager.getInstance().getCrateTemplate(
              `63eb39f288bdaa3a2df23e35`
            );
          if (!crateTemplate) return;
          // random between 2-4 crates
          const crateCount = Math.floor(Math.random() * 4) + 3;
          for (let i = 0; i < crateCount; i++)
            await CrateManager.getInstance().generateCrate(
              crateTemplate,
              interaction.guildID,
              interaction.member
                ? interaction.member.user.id
                : interaction.user?.id!
            );

          interaction.createFollowup({
            embeds: [
              {
                title: `Free Tet Dev Crates!`,
                description: `As a new user, you have been given \`${crateCount}\` crates! You can open them by using going to the inventory and clicking on the crates!`,
              },
            ],
          });
        }
      }
      const userCrates = (await CrateManager.getInstance().getUserCrates(
        interaction.member ? interaction.member.user.id : interaction.user?.id!,
        `@global`,
        true
      )) as Crate[];
      if (userCrates.filter((x) => x.guildID === '@global').length < 2) {
        const crateTemplate = await CrateManager.getInstance().getCrateTemplate(
          `63eb4ebb0296c1c2c951ba82`
        );
        if (!crateTemplate) return console.log(`Crate template not found!`);
        // random between 2-4 crates
        const crateCount = Math.floor(Math.random() * 3) + 2;
        for (let i = 0; i < crateCount; i++)
          await CrateManager.getInstance().generateCrate(
            crateTemplate,
            `@global`,
            interaction.member
              ? interaction.member.user.id
              : interaction.user?.id!
          );

        interaction.createFollowup({
          embeds: [
            {
              title: `Free Crates!`,
              description: `As a new user, you have been given \`${crateCount}\` crates! You can open them by using going to the inventory and clicking on the crates!`,
            },
          ],
        });
      }
    }
    const cardData = inventory.cards.concat(globalInventory.cards);
    const cards = (
      await Promise.all(
        Array.from(
          new Set(
            inventory.cards
              .map((item) => item.cardID)
              .concat(globalInventory.cards.map((item) => item.cardID))
          )
        ).map(getCard)
      )
    ).filter((x) => x) as CardType[];
    const cardMap = new Map<string, CardType>();
    cards.forEach((card) => cardMap.set(card._id.toString(), card));

    const embeds = [] as EmbedOptions[];
    const pages = Math.ceil(cardData.length / 5);
    let page = 1;
    await interaction.acknowledge();
    for (let i = 0; i < pages; i++) {
      const cardPage = cardData.slice(i * 5, i * 5 + 5);
      const embed: EmbedOptions = {
        title: `Inventory for ${user.username}`,
        description: `Page ${i + 1} of ${pages}`,
        color: 4456364,
        thumbnail: {},
        fields: cardPage.map((item) =>
          parseInventoryItem(item, cardMap.get(item.cardID)!)
        ),
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
    if (interaction.guildID === '739559911033405592') {
      // check crate count
      const userCrates = await CrateManager.getInstance().getUserCrates(
        interaction.member ? interaction.member.user.id : interaction.user?.id!,
        interaction.guildID,
        true
      );
      if (userCrates.length < 2) {
        const crateTemplate = await CrateManager.getInstance().getCrateTemplate(
          `63eb39f288bdaa3a2df23e35`
        );
        if (!crateTemplate) return;
        // random between 2-4 crates
        const crateCount = Math.floor(Math.random() * 4) + 3;
        for (let i = 0; i < crateCount; i++)
          await CrateManager.getInstance().generateCrate(
            crateTemplate,
            interaction.guildID,
            interaction.member
              ? interaction.member.user.id
              : interaction.user?.id!
          );

        interaction.createFollowup({
          embeds: [
            {
              title: `Free Tet Dev Crates!`,
              description: `As a new user, you have been given \`${crateCount}\` crates! You can open them by using going to the inventory and clicking on the crates!`,
            },
          ],
        });
      }
    }
    const userCrates = (await CrateManager.getInstance().getUserCrates(
      interaction.member ? interaction.member.user.id : interaction.user?.id!,
      `@global`,
      true
    )) as Crate[];
    if (userCrates.filter((x) => x.guildID === '@global').length < 2) {
      const crateTemplate = await CrateManager.getInstance().getCrateTemplate(
        `63eb4ebb0296c1c2c951ba82`
      );
      if (!crateTemplate) return console.log(`Crate template not found!`);
      // random between 2-4 crates
      const crateCount = Math.floor(Math.random() * 3) + 2;
      for (let i = 0; i < crateCount; i++)
        await CrateManager.getInstance().generateCrate(
          crateTemplate,
          `@global`,
          interaction.member
            ? interaction.member.user.id
            : interaction.user?.id!
        );

      interaction.createFollowup({
        embeds: [
          {
            title: `Free Crates!`,
            description: `As a new user, you have been given \`${crateCount}\` crates! You can open them by using going to the inventory and clicking on the crates!`,
          },
        ],
      });
    }
  },
} as Command;

export default inventory;
