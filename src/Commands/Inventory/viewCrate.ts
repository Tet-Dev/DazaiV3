// Import necessary dependencies and types
import { ComponentType, ButtonStyle } from 'discord-api-types/v10';
import { Constants, EmbedOptions, InteractionDataOptionsString } from 'eris';
import { rarityNameMap, UserCrate } from '../../constants/cardNames';
import { CrateManager } from '../../Handlers/Crates/CrateManager';
import { InteractionCollector } from '../../Handlers/InteractionCollector';
import TetLib from '../../Handlers/TetLib';
import { Command } from '../../types/misc';

// Define the crateView command
export const crateView = {
  name: 'crate',
  description: 'View or open a crate!',
  // Define the arguments for the command
  args: [
    {
      name: 'crate_id',
      description: 'The ID of the crate you want to view',
      type: Constants.ApplicationCommandOptionTypes.STRING,
      required: true,
    },
  ],
  // Define the type of command
  type: Constants.ApplicationCommandTypes.CHAT_INPUT,
  // Define the function to execute when the command is called
  execute: async (bot, { interaction }) => {
    // Extract the crate ID from the interaction data
    const crateID = (
      TetLib.findCommandParam(
        interaction.data.options,
        'crate_id'
      ) as InteractionDataOptionsString
    ).value;
    // If no crate ID was provided, send an error message
    if (!crateID)
      return interaction.createMessage({
        embeds: [
          {
            title: `Cannot view crate`,
            description: `Please provide a crate ID!`,
            color: 16728385,
            thumbnail: {
              url: 'https://i.pinimg.com/736x/f8/37/17/f837175981662cb08c92bfee0be2a6be.jpg',
            },
          },
        ],
      });
    // Get the UserCrate object for the specified crate ID
    const crate = (await CrateManager.getInstance().getUserCrate(
      crateID
    )) as UserCrate;
    // If the crate doesn't exist, send an error message
    if (!crate)
      return interaction.createMessage({
        embeds: [
          {
            title: `Cannot view crate`,
            description: `Crate with ID \`${crateID}\` does not exist!`,
            color: 16728385,
            thumbnail: {
              url: 'https://i.pinimg.com/736x/f8/37/17/f837175981662cb08c92bfee0be2a6be.jpg',
            },
          },
        ],
      });

    // Get the guild and user associated with the crate
    const guild =
      (crate.guildID !== `@global` && bot.guilds.get(crate.guildID)) ??
      (await bot.getRESTGuild(crate.guildID));
    const user =
      bot.users.get(crate.userID) ?? (await bot.getRESTUser(crate.userID));
    // If the guild doesn't exist, send an error message
    if (!guild && crate.guildID !== `@global`)
      return interaction.createMessage({
        embeds: [
          {
            title: `Cannot view item`,
            description: `Guild with ID \`${crate.guildID}\` does not exist!`,
            color: 16728385,
            thumbnail: {
              url: 'https://i.pinimg.com/736x/f8/37/17/f837175981662cb08c92bfee0be2a6be.jpg',
            },
          },
        ],
      });

    // If the crate has already been opened, show the crate details
    if (crate.opened) {
      await interaction.createMessage({
        embeds: [
          {
            title: `${crate.name}`,
            description: `
\`\`\`
${crate.description}
\`\`\`
        Crate Origin: \`${crate.guildID && guild ? guild.name : 'Global'}\`
        Crate Received: <t:${Math.floor(crate.createdAt / 1000)}:R>
        Crate Opened: **<t:${Math.floor(crate.openedAt! / 1000)}:R>**
        Crate Item: **${crate.opened ? crate.item?.name : '[???]'}** ${
              crate.opened ? `(\`${crate.itemID}\`)` : ''
            }
        `,
            thumbnail: {
              url:
                crate.guildID && guild
                  ? guild.dynamicIconURL('png', 64) ??
                    'https://cdn.discordapp.com/attachments/757863990129852509/1094019901624172674/wanDazai.jpg'
                  : 'https://cdn.discordapp.com/attachments/757863990129852509/1094019901624172674/wanDazai.jpg',
            },
            footer: {
              text: `Crate owned by ${user.username}#${user.discriminator} (${user.id}) | ID: ${crate._id}`,
              icon_url: user.dynamicAvatarURL('png', 128),
            },
          },
        ],
      });
    } else {
      // If the crate hasn't been opened yet, show the unopened crate details
      const embed: EmbedOptions = {
        title: `${crate.name} (Unopened)`,
        description: `
\`\`\`
${crate.description}
\`\`\`
        Crate Origin: \`${crate.guildID && guild ? guild.name : 'Global'}\`
        Crate Received: <t:${Math.floor(crate.createdAt / 1000)}:R>
        Crate Item: **${crate.opened ? crate.item?.name : '[???]'}**
        `,
        thumbnail: {
          url:
            crate.guildID && guild
              ? guild.dynamicIconURL('png', 64) ??
                'https://cdn.discordapp.com/attachments/757863990129852509/1094019901624172674/wanDazai.jpg'
              : 'https://cdn.discordapp.com/attachments/757863990129852509/1094019901624172674/wanDazai.jpg',
        },
        footer: {
          text: `Crate owned by ${user.username}#${user.discriminator} (${user.id}) | ID: ${crate._id}`,
          icon_url: user.dynamicAvatarURL('png', 128),
        },
      };
      await interaction.acknowledge();
      // If the crate belongs to the user who called the command, show the "Open Crate" button
      const msg = await interaction.createFollowup({
        embeds: [embed],
        components:
          crate.userID === (interaction.user || interaction.member?.user)?.id
            ? [
                {
                  type: ComponentType.ActionRow,
                  components: [
                    {
                      type: ComponentType.Button,
                      label: 'Open Crate',
                      style: ButtonStyle.Primary,
                      custom_id: 'open_crate',
                      disabled: crate.opened,
                    },
                  ],
                },
              ]
            : [],
      });
      // If the crate doesn't belong to the user who called the command, stop here
      if (crate.userID !== (interaction.user || interaction.member?.user)?.id)
        return;
      // Wait for the user to click the "Open Crate" button
      await InteractionCollector.getInstance().waitForInteraction(
        {
          interactionid: 'open_crate',
          whitelistUsers: [(interaction.user || interaction.member?.user!).id],
        },
        msg,
        1000 * 120
      );
      // Check if the crate has been opened by another user in the meantime
      const crate2 = await CrateManager.getInstance().getUserCrate(
        crate._id.toString(),
        true
      );
      if (crate2?.opened) {
        // If the crate has been opened, show an error message
        await interaction.createFollowup({
          content: `This crate has already been opened!`,
        });
        return;
      }
      // Mark the crate as opened and send the item details
      await CrateManager.getInstance().openCrate(crate._id as string);
      const followup = await interaction.createFollowup({
        content: `🎉🎉🎉 Congratulations! 🎉🎉🎉`,
        embeds: [
          {
            title: `✨ New Item!`,
            description: `
            You have received a **${rarityNameMap[crate.item.rarity]}** **${
              crate.item?.name
            }**
            from \`${crate.name}\`!
\`\`\`
${crate.item?.description}
\`\`\`
            `,
            image: {
              url: crate.item?.url,
            },
          },
        ],
      });
    }

    // End of execute function
  },
} as Command;

export default crateView;
