import {
  ComponentInteractionSelectMenuData,
  Constants,
  InteractionDataOptionsUser,
} from 'eris';
import { CrateManager } from '../../Handlers/Crates/CrateManager';
import { Command } from '../../types/misc';
export const inventory = {
  name: 'inventory',
  description: 'Get your inventory!',
  args: [],
  type: Constants.ApplicationCommandTypes.CHAT_INPUT,
  execute: async (bot, { interaction }) => {
    await interaction.createMessage({
      embeds: [
        {
          title: 'Get your inventory!',
          description: `Visit your server inventory [here](${env.website}/app/guild/${interaction.guildID}/inventory)`,
          color: 4456364,
          thumbnail: {
            url: 'https://cdn.discordapp.com/attachments/757863990129852509/1044221426418331648/tumblr_o7fk7quWVh1shr9wko3_400.jpg',
          },
        },
      ],
      components: [
        {
          type: Constants.ComponentTypes.ACTION_ROW,
          components: [
            {
              type: Constants.ComponentTypes.BUTTON,
              label: 'Inventory',
              emoji: {
                name: '🎒',
              },
              style: 5,
              url: `${env.website}/app/guild/${interaction.guildID}/inventory?`,
            },
          ],
        },
      ],
    });
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
        await CrateManager.getInstance().generateCrate(
          crateTemplate,
          interaction.guildID,
          interaction.member
            ? interaction.member.user.id
            : interaction.user?.id!
        );
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
              title: 'You have been given 2 crates!',
              description:
                'As a new user, you have been given 2 crates! You can open them by using going to the inventory and clicking on the crates!',
            },
          ],
        });
      }
    }
  },
} as Command;

export default inventory;
