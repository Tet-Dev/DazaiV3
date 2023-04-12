// Import required libraries and constants
import { Constants, EmbedOptions, InteractionDataOptionsString } from 'eris';
import { rarityColorMap, rarityNameMap } from '../../constants/cardNames';
import { InventoryManager } from '../../Handlers/Crates/InventoryManager';
import { Command } from '../../types/misc';

// Define a command object for the "item" command
export const item = {
  // Specify command metadata
  name: 'item',
  description: 'View items in inventories!',
  args: [
    {
      name: 'item_id',
      description: 'The ID of the item you want to view',
      type: Constants.ApplicationCommandOptionTypes.STRING,
      required: true,
    },
  ],
  type: Constants.ApplicationCommandTypes.CHAT_INPUT,
  // Define the function to execute when the command is run
  execute: async (bot, { interaction }) => {
    // Retrieve the item ID from the interaction data
    const itemID = (
      interaction.data?.options?.[0] as InteractionDataOptionsString
    )?.value;
    // Check if the item ID is valid
    if (!itemID)
      // If not, display an error message and return
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
    // Attempt to find the item with the specified ID
    const result = await InventoryManager.getInstance().findItemFromID(itemID);
    // If the item is not found, display an error message and return
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
    // Extract the card and inventory information from the result
    const { card, inventory } = result;
    // If the card is not found, display an error message and return
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
    // Retrieve the guild and user information for the inventory
    const guild =
      (inventory.guildID !== `@global` && bot.guilds.get(inventory.guildID)) ??
      (await bot.getRESTGuild(inventory.guildID));
    const user =
      bot.users.get(inventory.userID) ??
      (await bot.getRESTUser(inventory.userID));
    // If the guild is not found, display an error message and return
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
      }); // Define the embed message to display the item information
    const embed: EmbedOptions = {
      title: `${card.name}`,
      description: `Rarity: \`${rarityNameMap[card.rarity]}\`
  Guild: \`${guild ? guild.name : `Global`}\`
  \`\`\`
  ${card.description}
  \`\`\`
  `,
      // Skip the image URL line
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
    // Send the embed message as a response to the command
    await interaction.createMessage({
      embeds: [embed],
    });
  },
} as Command;

// Export the command object
export default item;
