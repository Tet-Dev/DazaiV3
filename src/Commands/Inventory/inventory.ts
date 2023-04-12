import { Constants, EmbedOptions, InteractionDataOptionsUser } from 'eris';
import { InventoryManager } from '../../Handlers/Crates/InventoryManager';
import TetLib from '../../Handlers/TetLib';
import { Command } from '../../types/misc';

// Define the "inventory" command
export const inventory = {
  name: 'inventory',
  description: 'Get your inventory, or the inventory of a user',

  // Define the command arguments
  args: [
    {
      name: 'user',
      description: 'The user to get the rank card of',
      type: Constants.ApplicationCommandOptionTypes.USER,
      required: false,
    },
  ],

  // Define the command type
  type: Constants.ApplicationCommandTypes.CHAT_INPUT,

  // Define the execute function for the "inventory" command
  execute: async (bot, { interaction }) => {
    // If the command is not being executed in a guild, return an error message
    if (!interaction.guildID || !interaction.member)
      return interaction.createMessage('This is a guild only command!');

    // Find the selected user ID from the command arguments
    const selectedUserID = (
      TetLib.findCommandParam(
        interaction.data?.options,
        'user'
      ) as InteractionDataOptionsUser
    )?.value;

    // Get the user to show the inventory for
    const user = selectedUserID
      ? bot.users.get(selectedUserID) || (await bot.getRESTUser(selectedUserID))
      : interaction.user || interaction.member?.user;

    // If the user is not found, return an error message
    if (!user) return interaction.createMessage('User not found!');

    // Get the user's inventory and global inventory
    const inventory = await InventoryManager.getInstance().getUserInventory(
      user.id,
      interaction.guildID
    );
    const globalInventory =
      await InventoryManager.getInstance().getUserInventory(user.id, '@global');

    // If both inventories are empty, return an error message
    if (!globalInventory.cards.length && !inventory.cards.length) {
      return await interaction.createMessage({
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
    }

    // Define the embed to show for the inventory
    const embed = {
      title: `View __${user.username}__'s Inventory`,
      description: `Click on the button below to view <@!${user.id}>'s inventory!`,
      color: 12611583,
    } as EmbedOptions;

    // Return the inventory message with a link button to view the inventory online
    return await interaction.createMessage({
      embeds: [embed],
      components: [
        {
          type: Constants.ComponentTypes.ACTION_ROW,
          components: [
            {
              type: Constants.ComponentTypes.BUTTON,
              label: 'View Online',
              emoji: {
                name: '🎒',
              },
              style: Constants.ButtonStyles.LINK as any,
              url: `${env.website}/app/guild/${interaction.guildID}/inventory/${user.id}`,
            },
          ],
        },
      ],
    });
  },
} as Command;

export default inventory;
