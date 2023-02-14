import {
  ComponentInteractionSelectMenuData,
  Constants,
  InteractionDataOptionsUser,
} from 'eris';
import { Crate } from '../../constants/cardNames';
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
    const userCrates = (await CrateManager.getInstance().getUserCrates(
      interaction.member ? interaction.member.user.id : interaction.user?.id!,
      interaction.guildID,
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
