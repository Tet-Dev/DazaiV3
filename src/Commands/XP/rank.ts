import {
  ComponentInteractionSelectMenuData,
  Constants,
  InteractionDataOptionsUser,
} from 'eris';
import { XPManager } from '../../Handlers/Levelling/XPManager';
import { Command } from '../../types/misc';
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
    console.log(user);
    const ackPromise = interaction.acknowledge()
    const guildCard = await XPManager.getInstance().generateRankCard(
      interaction.guildID,
      user.id
    );
    await ackPromise;
    return interaction.createFollowup(
      {},
      {
        file: Buffer.from(guildCard.buffer),
        name: `Dazai_RankCard_${user.username}.${guildCard.type}`,
      }
    );
  },
} as Command;

export default rank;
