import {
  ComponentInteractionSelectMenuData,
  Constants,
  InteractionDataOptionsUser,
} from 'eris';
import { XPManager } from '../../Handlers/Levelling/XPManager';
import { Command } from '../../types/misc';
import { PermissionManager } from '../../Handlers/PermissionHandler';
import { performance } from 'perf_hooks';
export const rank = {
  name: 'rank',
  description: 'Get your rank card!',
  args: [
    {
      name: 'user',
      description: 'The user to get the rank card of',
      type: Constants.ApplicationCommandOptionTypes.USER,
      required: false,
    },
  ],
  type: Constants.ApplicationCommandTypes.CHAT_INPUT,
  permissions: ['rank'],
  execute: async (bot, { interaction }) => {
    if (!interaction.guildID || !interaction.member)
      return interaction.createMessage('This is a guild only command!');
    const selectedUserID = (
      interaction.data?.options?.[0] as InteractionDataOptionsUser
    )?.value;
    if (selectedUserID) {
      if (interaction.member) {
        const hasPermission =
          await PermissionManager.getInstance().hasMultiplePermissions(
            interaction.guildID!,
            interaction.member.roles,
            ['rankOther']
          );
        if (typeof hasPermission === 'object') {
          interaction.createMessage({
            embeds: [
              await PermissionManager.getInstance().rejectInteraction(
                hasPermission.missing,
                interaction.member?.user || interaction.user
              ),
            ],
          });
          return;
        }
      }
    }
    let perf = performance.now();
    const user = selectedUserID
      ? bot.users.get(selectedUserID) || (await bot.getRESTUser(selectedUserID))
      : interaction.user || interaction.member?.user;
    if (!user) return interaction.createMessage('User not found!');
    const ackPromise = interaction.acknowledge();
    const findUser = performance.now() - perf;
    perf = performance.now();
    const guildCard = await XPManager.getInstance().generateRankCard(
      interaction.guildID,
      user.id
    );

    const generateCard = performance.now() - perf;
    perf = performance.now();
    await ackPromise;
    await interaction.createFollowup(
      {},
      {
        file: Buffer.from(guildCard.buffer),
        name: `Dazai_RankCard_${user.username}.${guildCard.type}`,
      }
    );
    const sendCard = performance.now() - perf;
    console.log('rank timing', {
      findUser,
      generateCard,
      sendCard,
    });
    return;
  },
} as Command;

export default rank;
