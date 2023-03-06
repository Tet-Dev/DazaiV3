import { ComponentType, ButtonStyle } from 'discord-api-types/v10';
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
  UserCrate,
} from '../../constants/cardNames';
import { CrateManager } from '../../Handlers/Crates/CrateManager';
import { InventoryManager } from '../../Handlers/Crates/InventoryManager';
import { InteractionCollector } from '../../Handlers/InteractionCollector';
import { MusicManager } from '../../Handlers/Music/MusicPlayer';
import TetLib from '../../Handlers/TetLib';
import { Command } from '../../types/misc';
export const crateView = {
  name: 'crate',
  description: 'View or open a crate!',
  args: [
    {
      name: 'crate_id',
      description: 'The ID of the crate you want to view',
      type: Constants.ApplicationCommandOptionTypes.STRING,
      required: true,
    },
  ],
  type: Constants.ApplicationCommandTypes.CHAT_INPUT,
  execute: async (bot, { interaction }) => {
    const crateID = (
      TetLib.findCommandParam(
        interaction.data.options,
        'crate_id'
      ) as InteractionDataOptionsString
    ).value;
    if (!crateID)
      return interaction.createMessage({
        embeds: [
          {
            title: `Cannot view crate`,
            description: `Please provide an crate ID!`,
            color: 16728385,
            thumbnail: {
              url: 'https://i.pinimg.com/736x/f8/37/17/f837175981662cb08c92bfee0be2a6be.jpg',
            },
          },
        ],
      });
    const crate = (await CrateManager.getInstance().getUserCrate(
      crateID
    )) as UserCrate;
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

    const guild =
      (crate.guildID !== `@global` && bot.guilds.get(crate.guildID)) ??
      (await bot.getRESTGuild(crate.guildID));
    const user =
      bot.users.get(crate.userID) ?? (await bot.getRESTUser(crate.userID));
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
    // if (crate.opened) {

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
                    'https://images-wixmp-ed30a86b8c4ca887773594c2.wixmp.com/f/15e13870-8518-4f22-92c4-faa2555110e4/dej1xz0-79ff858a-d77f-439d-9cab-76e25ba7f8e9.png/v1/fill/w_1280,h_1280,q_80,strp/wan__dazai_by_gummysnail_dej1xz0-fullview.jpg?token=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ1cm46YXBwOjdlMGQxODg5ODIyNjQzNzNhNWYwZDQxNWVhMGQyNmUwIiwiaXNzIjoidXJuOmFwcDo3ZTBkMTg4OTgyMjY0MzczYTVmMGQ0MTVlYTBkMjZlMCIsIm9iaiI6W1t7ImhlaWdodCI6Ijw9MTI4MCIsInBhdGgiOiJcL2ZcLzE1ZTEzODcwLTg1MTgtNGYyMi05MmM0LWZhYTI1NTUxMTBlNFwvZGVqMXh6MC03OWZmODU4YS1kNzdmLTQzOWQtOWNhYi03NmUyNWJhN2Y4ZTkucG5nIiwid2lkdGgiOiI8PTEyODAifV1dLCJhdWQiOlsidXJuOnNlcnZpY2U6aW1hZ2Uub3BlcmF0aW9ucyJdfQ.ObDVGDRlq0hjQNhpECT930IVlNlYMtZ7Vffe4zwXdvk'
                  : 'https://images-wixmp-ed30a86b8c4ca887773594c2.wixmp.com/f/15e13870-8518-4f22-92c4-faa2555110e4/dej1xz0-79ff858a-d77f-439d-9cab-76e25ba7f8e9.png/v1/fill/w_1280,h_1280,q_80,strp/wan__dazai_by_gummysnail_dej1xz0-fullview.jpg?token=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ1cm46YXBwOjdlMGQxODg5ODIyNjQzNzNhNWYwZDQxNWVhMGQyNmUwIiwiaXNzIjoidXJuOmFwcDo3ZTBkMTg4OTgyMjY0MzczYTVmMGQ0MTVlYTBkMjZlMCIsIm9iaiI6W1t7ImhlaWdodCI6Ijw9MTI4MCIsInBhdGgiOiJcL2ZcLzE1ZTEzODcwLTg1MTgtNGYyMi05MmM0LWZhYTI1NTUxMTBlNFwvZGVqMXh6MC03OWZmODU4YS1kNzdmLTQzOWQtOWNhYi03NmUyNWJhN2Y4ZTkucG5nIiwid2lkdGgiOiI8PTEyODAifV1dLCJhdWQiOlsidXJuOnNlcnZpY2U6aW1hZ2Uub3BlcmF0aW9ucyJdfQ.ObDVGDRlq0hjQNhpECT930IVlNlYMtZ7Vffe4zwXdvk',
            },
            footer: {
              text: `Crate owned by ${user.username}#${user.discriminator} (${user.id}) | ID: ${crate._id}`,
              icon_url: user.dynamicAvatarURL('png', 128),
            },
          },
        ],
      });
    } else {
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
                'https://images-wixmp-ed30a86b8c4ca887773594c2.wixmp.com/f/15e13870-8518-4f22-92c4-faa2555110e4/dej1xz0-79ff858a-d77f-439d-9cab-76e25ba7f8e9.png/v1/fill/w_1280,h_1280,q_80,strp/wan__dazai_by_gummysnail_dej1xz0-fullview.jpg?token=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ1cm46YXBwOjdlMGQxODg5ODIyNjQzNzNhNWYwZDQxNWVhMGQyNmUwIiwiaXNzIjoidXJuOmFwcDo3ZTBkMTg4OTgyMjY0MzczYTVmMGQ0MTVlYTBkMjZlMCIsIm9iaiI6W1t7ImhlaWdodCI6Ijw9MTI4MCIsInBhdGgiOiJcL2ZcLzE1ZTEzODcwLTg1MTgtNGYyMi05MmM0LWZhYTI1NTUxMTBlNFwvZGVqMXh6MC03OWZmODU4YS1kNzdmLTQzOWQtOWNhYi03NmUyNWJhN2Y4ZTkucG5nIiwid2lkdGgiOiI8PTEyODAifV1dLCJhdWQiOlsidXJuOnNlcnZpY2U6aW1hZ2Uub3BlcmF0aW9ucyJdfQ.ObDVGDRlq0hjQNhpECT930IVlNlYMtZ7Vffe4zwXdvk'
              : 'https://images-wixmp-ed30a86b8c4ca887773594c2.wixmp.com/f/15e13870-8518-4f22-92c4-faa2555110e4/dej1xz0-79ff858a-d77f-439d-9cab-76e25ba7f8e9.png/v1/fill/w_1280,h_1280,q_80,strp/wan__dazai_by_gummysnail_dej1xz0-fullview.jpg?token=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ1cm46YXBwOjdlMGQxODg5ODIyNjQzNzNhNWYwZDQxNWVhMGQyNmUwIiwiaXNzIjoidXJuOmFwcDo3ZTBkMTg4OTgyMjY0MzczYTVmMGQ0MTVlYTBkMjZlMCIsIm9iaiI6W1t7ImhlaWdodCI6Ijw9MTI4MCIsInBhdGgiOiJcL2ZcLzE1ZTEzODcwLTg1MTgtNGYyMi05MmM0LWZhYTI1NTUxMTBlNFwvZGVqMXh6MC03OWZmODU4YS1kNzdmLTQzOWQtOWNhYi03NmUyNWJhN2Y4ZTkucG5nIiwid2lkdGgiOiI8PTEyODAifV1dLCJhdWQiOlsidXJuOnNlcnZpY2U6aW1hZ2Uub3BlcmF0aW9ucyJdfQ.ObDVGDRlq0hjQNhpECT930IVlNlYMtZ7Vffe4zwXdvk',
        },
        footer: {
          text: `Crate owned by ${user.username}#${user.discriminator} (${user.id}) | ID: ${crate._id}`,
          icon_url: user.dynamicAvatarURL('png', 128),
        },
      };
      await interaction.acknowledge();
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
      if (crate.userID !== (interaction.user || interaction.member?.user)?.id)
        return;
      await InteractionCollector.getInstance().waitForInteraction(
        {
          interactionid: 'open_crate',
          whitelistUsers: [(interaction.user || interaction.member?.user!).id],
        },
        msg,
        1000 * 120
      );
      // mark crate as opened
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

    // }
  },
} as Command;

export default crateView;
