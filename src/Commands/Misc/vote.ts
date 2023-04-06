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
} from '../../constants/cardNames';
import { getCard, getCards } from '../../Handlers/Crates/CardManager';
import { CrateManager } from '../../Handlers/Crates/CrateManager';
import { InventoryManager } from '../../Handlers/Crates/InventoryManager';
import { UserDataManager } from '../../Handlers/Globals/UserDataManager';
import { InteractionCollector } from '../../Handlers/InteractionCollector';
import { MusicManager } from '../../Handlers/Music/MusicPlayer';
import TetLib from '../../Handlers/TetLib';
import { Command } from '../../types/misc';

export const inventory = {
  name: 'vote',
  description: 'Get voting info',
  args: [],
  type: Constants.ApplicationCommandTypes.CHAT_INPUT,
  execute: async (bot, { interaction }) => {
    //   if (!interaction.guildID || !interaction.member)
    //     return interaction.createMessage('This is a guild only command!');
    //   const selectedUserID = (
    //     TetLib.findCommandParam(
    //       interaction.data?.options,
    //       'user'
    //     ) as InteractionDataOptionsUser
    //   )?.value;
    //   // const showGlobal = (
    //   //   TetLib.findCommandParam(
    //   //     interaction.data?.options,
    //   //     'show_global'
    //   //   ) as InteractionDataOptionsBoolean
    //   // )?.value;

    const user = interaction.user || interaction.member?.user;
    if (!user) return interaction.createMessage('User not found!');
    const votingData = await UserDataManager.getInstance().getUserData(user.id);
    const embed = {
      title: `Voting Info for ${interaction.member?.nick || user.username}`,
      description: `You currently have voted **${votingData?.currentStreak}** times in a row (highest streak: **${votingData?.highestStreak} Votes**), and have voted a total of **${votingData?.votes}** times!`,
      fields: [
        {
          name: 'Last Vote',
          value: votingData?.lastVote
            ? `<t:${Math.floor(votingData?.lastVote / 1000)}:R>`
            : 'Never',
          inline: true,
        },
        {
          name: 'Vote Cooldown',
          value:
            (votingData?.lastVote || 0) + 12 * 60 * 60 * 1000 > Date.now()
              ? `<t:${Math.floor(
                  ((votingData?.lastVote || 0) + 12 * 60 * 60 * 1000) / 1000
                )}:R>`
              : 'Now',
          inline: true,
        },
        {
          name: 'Voting Rewards',
          value: `[View Rewards](${env.website}/app/@global)`,
          inline: true,
        },
      ],
      thumbnail: {
        url: `https://emoji.discadia.com/emojis/aa8cc650-aa39-4da8-b0ad-57f077e06a4a.PNG`,
      },

      color: 12611583,
    } as EmbedOptions;
    return await interaction.createMessage({
      embeds: [embed],
      components: [
        {
          type: Constants.ComponentTypes.ACTION_ROW,
          components: [
            {
              type: Constants.ComponentTypes.BUTTON,
              label: 'View Details',
              emoji: {
                name: '🌐',
              },
              // custom_id: 'inventory',
              style: Constants.ButtonStyles.LINK as any,
              url: `${env.website}/app/@global`,
            },
            {
              type: Constants.ComponentTypes.BUTTON,
              label: 'Vote Now',
              emoji: {
                name: '🗳️',
              },
              // custom_id: 'inventory',
              style: Constants.ButtonStyles.LINK as any,
              url: 'https://top.gg/bot/747901310749245561/vote',
            },
          ],
        },
      ],
    });
    // if (!showGlobal) {
    //   if (!inventory.cards.length) {
    //     if (globalInventory.cards.length)
    // return await interaction.createMessage({
    //   embeds: [
    //     {
    //       title: `Cannot view ${user.username}'s inventory`,
    //       description: `This user's server inventory is empty, however they have \`${
    //         globalInventory.cards.length
    //       }\` global cards! To view these, use \`\`\`/inventory show_global:True ${
    //         selectedUserID ? `user:<@!${user.id}>` : ``
    //       }\`\`\``,
    //       color: 16728385,
    //       thumbnail: {
    //         url: 'https://i.pinimg.com/736x/f8/37/17/f837175981662cb08c92bfee0be2a6be.jpg',
    //       },
    //     },
    //   ],
    // });
    //     else
    //       return await interaction.createMessage({
    //         embeds: [
    //           {
    //             title: `Cannot view ${user.username}'s inventory`,
    //             description: `This user's inventory is empty!`,
    //             color: 16728385,
    //             thumbnail: {
    //               url: 'https://i.pinimg.com/736x/f8/37/17/f837175981662cb08c92bfee0be2a6be.jpg',
    //             },
    //           },
    //         ],
    //       });
    //   }
    // }

    // const cardData = showGlobal
    //   ? inventory.cards.concat(globalInventory.cards)
    //   : inventory.cards;
    // const cards = (
    //   await getCards(
    //     Array.from(
    //       new Set(
    //         inventory.cards
    //           .map((item) => item.cardID)
    //           .concat(globalInventory.cards.map((item) => item.cardID))
    //       )
    //     )
    //   )
    // ).filter((x) => x) as CardType[];
    // const cardMap = new Map<string, CardType>();
    // cards.forEach((card) => cardMap.set(card._id.toString(), card));

    // const embeds = [] as EmbedOptions[];
    // const pages = Math.ceil(cardData.length / 5);
    // let page = 1;
    // await interaction.acknowledge();
    // for (let i = 0; i < pages; i++) {
    //   const cardPage = cardData.slice(i * 5, i * 5 + 5);
    //   const embed: EmbedOptions = {
    //     title: `Inventory for ${user.username}`,
    //     description: `Page ${i + 1} of ${pages}`,
    //     color: 4456364,
    //     thumbnail: {},
    //     fields: cardPage.map((item) =>
    //       parseInventoryItem(item, cardMap.get(item.cardID)!)
    //     ),
    //   };
    //   embeds.push(embed);
    // }

    // const msg = await interaction.createFollowup({
    //   embeds: [embeds[page - 1]],
    //   components: [
    //     {
    //       type: Constants.ComponentTypes.ACTION_ROW,
    //       components: [
    //         {
    //           type: Constants.ComponentTypes.BUTTON,
    //           label: 'View Online',
    //           emoji: {
    //             name: '🌐',
    //           },
    //           style: 5,
    //           url: `${env.website}/app/guild/${interaction.guildID}/inventory?`,
    //         },
    //       ],
    //     },
    //     {
    //       type: Constants.ComponentTypes.ACTION_ROW,
    //       components: [
    //         {
    //           type: Constants.ComponentTypes.SELECT_MENU,
    //           custom_id: 'pageSelect',
    //           placeholder: 'Jump to page',
    //           options: embeds
    //             .map((_, index) => ({
    //               label: `Page ${index + 1}`,
    //               value: `${index + 1}`,
    //             }))
    //             .slice(0, 25),
    //         },
    //       ],
    //     },
    //     {
    //       type: Constants.ComponentTypes.ACTION_ROW,
    //       components: [
    //         {
    //           type: Constants.ComponentTypes.BUTTON,
    //           custom_id: 'pageLeft',
    //           label: 'Previous page',
    //           emoji: {
    //             name: '⬅️',
    //           },
    //           style: 1,
    //           disabled: page === 1,
    //         },
    //         {
    //           type: Constants.ComponentTypes.BUTTON,
    //           custom_id: 'pageRight',
    //           label: 'Next page',
    //           emoji: {
    //             name: '➡️',
    //           },
    //           style: 1,
    //           disabled: page === pages,
    //         },
    //       ],
    //     },
    //   ],
    // });
    // const editPage = async (pg: number, interaction: ComponentInteraction) => {
    //   page = pg;
    //   await msg.edit({
    //     embeds: [embeds[page - 1]],
    //     components: [
    //       {
    //         type: Constants.ComponentTypes.ACTION_ROW,
    //         components: [
    //           {
    //             type: Constants.ComponentTypes.BUTTON,
    //             label: 'View Online',
    //             emoji: {
    //               name: '🌐',
    //             },
    //             style: 5,
    //             url: `${env.website}/app/guild/${interaction.guildID}/inventory?`,
    //           },
    //         ],
    //       },

    //       {
    //         type: Constants.ComponentTypes.ACTION_ROW,
    //         components: [
    //           {
    //             type: Constants.ComponentTypes.SELECT_MENU,
    //             custom_id: 'pageSelect',
    //             placeholder: 'Jump to page',
    //             options: embeds
    //               .map((_, index) => ({
    //                 label: `Page ${index + 1}`,
    //                 value: `${index + 1}`,
    //               }))
    //               .slice(0, 25),
    //           },
    //         ],
    //       },
    //       {
    //         type: Constants.ComponentTypes.ACTION_ROW,
    //         components: [
    //           {
    //             type: Constants.ComponentTypes.BUTTON,
    //             custom_id: 'pageLeft',
    //             label: 'Previous page',
    //             emoji: {
    //               name: '⬅️',
    //             },
    //             style: 1,
    //             disabled: Number(page) === 1,
    //           },
    //           {
    //             type: Constants.ComponentTypes.BUTTON,
    //             custom_id: 'pageRight',
    //             label: 'Next page',
    //             emoji: {
    //               name: '➡️',
    //             },
    //             style: 1,
    //             disabled: Number(page) === pages,
    //           },
    //         ],
    //       },
    //     ],
    //   });
    //   await interaction.acknowledge();
    // };

    // InteractionCollector.getInstance().collectInteraction(
    //   {
    //     interactionid: 'pageSelect',
    //     run: async (bot, interaction) => {
    //       let pg = ~~(interaction.data as ComponentInteractionSelectMenuData)
    //         .values[0];
    //       await editPage(pg, interaction);
    //       // interaction.acknowledge()
    //     },
    //     limit: 100000,
    //     whitelistUsers: [(interaction.user || interaction.member?.user!).id],
    //     doNotAcknowledge: true,
    //   },
    //   msg,
    //   1000 * 120
    // );
    // InteractionCollector.getInstance().collectInteraction(
    //   {
    //     interactionid: 'pageLeft',
    //     run: async (bot, interaction) => {
    //       await editPage(page - 1, interaction);
    //       // interaction.acknowledge()
    //     },
    //     doNotAcknowledge: true,
    //     whitelistUsers: [(interaction.user || interaction.member?.user!).id],
    //   },
    //   msg,
    //   1000 * 120
    // );
    // InteractionCollector.getInstance().collectInteraction(
    //   {
    //     interactionid: 'pageRight',
    //     run: async (bot, interaction) => {
    //       await editPage(page + 1, interaction);
    //       // interaction.acknowledge()
    //     },
    //     doNotAcknowledge: true,
    //     whitelistUsers: [(interaction.user || interaction.member?.user!).id],
    //   },
    //   msg,
    //   1000 * 120
    // );
    // if (interaction.guildID === '739559911033405592') {
    //   // check crate count
    //   const userCrates = await CrateManager.getInstance().getUserCrates(
    //     interaction.member ? interaction.member.user.id : interaction.user?.id!,
    //     interaction.guildID,
    //     true
    //   );
    //   if (userCrates.length < 2) {
    //     const crateTemplate = await CrateManager.getInstance().getCrateTemplate(
    //       `63eb39f288bdaa3a2df23e35`
    //     );
    //     if (!crateTemplate) return;
    //     // random between 2-4 crates
    //     const crateCount = Math.floor(Math.random() * 4) + 3;
    //     for (let i = 0; i < crateCount; i++)
    //       await CrateManager.getInstance().generateCrate(
    //         crateTemplate,
    //         interaction.guildID,
    //         interaction.member
    //           ? interaction.member.user.id
    //           : interaction.user?.id!
    //       );

    //     interaction.createFollowup({
    //       embeds: [
    //         {
    //           title: `Free Tet Dev Crates!`,
    //           description: `As a new user, you have been given \`${crateCount}\` crates! You can open them by using going to the inventory and clicking on the crates!`,
    //         },
    //       ],
    //     });
    //   }
    // }
    // const userCrates = (await CrateManager.getInstance().getUserCrates(
    //   interaction.member ? interaction.member.user.id : interaction.user?.id!,
    //   `@global`,
    //   true
    // )) as Crate[];
    // if (userCrates.filter((x) => x.guildID === '@global').length < 2) {
    //   const crateTemplate = await CrateManager.getInstance().getCrateTemplate(
    //     `63eb4ebb0296c1c2c951ba82`
    //   );
    //   if (!crateTemplate) return console.log(`Crate template not found!`);
    //   // random between 2-4 crates
    //   const crateCount = Math.floor(Math.random() * 3) + 2;
    //   for (let i = 0; i < crateCount; i++)
    //     await CrateManager.getInstance().generateCrate(
    //       crateTemplate,
    //       `@global`,
    //       interaction.member
    //         ? interaction.member.user.id
    //         : interaction.user?.id!
    //     );

    //   interaction.createFollowup({
    //     embeds: [
    //       {
    //         title: `Free Crates!`,
    //         description: `As a new user, you have been given \`${crateCount}\` crates! You can open them by using going to the inventory and clicking on the crates!`,
    //       },
    //     ],
    //   });
    // }
  },
} as Command;

export default inventory;
