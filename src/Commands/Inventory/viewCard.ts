import {
  ComponentInteraction,
  ComponentInteractionSelectMenuData,
  Constants,
  EmbedOptions,
  InteractionDataOptionsNumber,
  InteractionDataOptionsString,
  InteractionDataOptionsUser,
  Member,
} from 'eris';
import {
  Crate,
  rarityColorMap,
  rarityNameMap,
} from '../../constants/cardNames';
import { CrateManager } from '../../Handlers/Crates/CrateManager';
import { InventoryManager } from '../../Handlers/Crates/InventoryManager';
import { InteractionCollector } from '../../Handlers/InteractionCollector';
import { MusicManager } from '../../Handlers/Music/MusicPlayer';
import { Command } from '../../types/misc';
export const inventory = {
  name: 'item',
  description: 'Get your inventory!',
  args: [
    {
      name: 'item_id',
      description: 'The ID of the item you want to view',
      type: Constants.ApplicationCommandOptionTypes.STRING,
      required: true,
    },
  ],
  type: Constants.ApplicationCommandTypes.CHAT_INPUT,
  execute: async (bot, { interaction }) => {
    const itemID = (
      interaction.data?.options?.[0] as InteractionDataOptionsString
    )?.value;
    if (!itemID)
      return interaction.createMessage({
        embeds: [
          {
            title: `Cannot view item`,
            description: `Please provide an item ID!`,
            color: 16728385,
            thumbnail: {
              url: 'https://i.pinimg.com/736x/f8/37/17/f837175981662cb08c92bfee0be2a6be.jpg',
            },
          },
        ],
      });
    const result = await InventoryManager.getInstance().findItemFromID(itemID);
    if (!result)
      return interaction.createMessage({
        embeds: [
          {
            title: `Cannot view item`,
            description: `Item with ID \`${itemID}\` does not exist!`,
            color: 16728385,
            thumbnail: {
              url: 'https://i.pinimg.com/736x/f8/37/17/f837175981662cb08c92bfee0be2a6be.jpg',
            },
          },
        ],
      });
    const { card, inventory } = result;
    if (!card)
      return interaction.createMessage({
        embeds: [
          {
            title: `Cannot view item`,
            description: `Card with ID \`${itemID}\` does not exist!`,
            color: 16728385,
          },
        ],
      });

    const guild =
      (inventory.guildID !== `@global` && bot.guilds.get(inventory.guildID)) ??
      (await bot.getRESTGuild(inventory.guildID));
    const user =
      bot.users.get(inventory.userID) ??
      (await bot.getRESTUser(inventory.userID));
    if (!guild && inventory.guildID !== `@global`)
      return interaction.createMessage({
        embeds: [
          {
            title: `Cannot view item`,
            description: `Guild with ID \`${inventory.guildID}\` does not exist!`,
            color: 16728385,
            thumbnail: {
              url: 'https://i.pinimg.com/736x/f8/37/17/f837175981662cb08c92bfee0be2a6be.jpg',
            },
          },
        ],
      });

    const embed: EmbedOptions = {
      title: `${card.name}`,
      description: `Rarity: \`${rarityNameMap[card.rarity]}\`
Guild: \`${guild ? guild.name : `Global`}\`
\`\`\`
${card.description}
\`\`\`
`,
      image: {
        url: card.url,
      },
      footer: {
        icon_url: user.dynamicAvatarURL(),
        text: `${user.username}#${user.discriminator} • Item ID: ${itemID}`,
      },
      color: rarityColorMap[card.rarity],
      author: {
        name: `Viewing ${guild ? guild.name : `Global`} item`,
        icon_url:
          (guild && guild.dynamicIconURL(undefined, 64)) ||
          bot.user.dynamicAvatarURL(),
      },
    };
    await interaction.createMessage({
      embeds: [embed],
    });
  },
} as Command;

export default inventory;
