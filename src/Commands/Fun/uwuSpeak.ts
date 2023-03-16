import {
  ComponentInteractionSelectMenuData,
  Constants,
  InteractionDataOptionsUser,
} from 'eris';
import { XPManager } from '../../Handlers/Levelling/XPManager';
import TetLib from '../../Handlers/TetLib';
import { Command } from '../../types/misc';
export const uwuSpeak = {
  name: 'kitten',
  description: 'Become a discord kitten',
  args: [
    {
      name: 'user',
      description: '(Admin) force someone else into being a discord kitten',
      type: Constants.ApplicationCommandOptionTypes.USER,
      required: false,
    },
  ],
  type: Constants.ApplicationCommandTypes.CHAT_INPUT,
  execute: async (bot, { interaction }) => {
    if (env.devmode) return;
    if (!interaction.guildID || !interaction.member)
      return interaction.createMessage('This is a guild only command!');
    const selectedUserID = (
      TetLib.findCommandParam(
        interaction.data.options,
        'user'
      ) as InteractionDataOptionsUser
    )?.value;
    const user = selectedUserID
      ? bot.users.get(selectedUserID) || (await bot.getRESTUser(selectedUserID))
      : interaction.user || interaction.member?.user;
    if (!user) return interaction.createMessage('User not found!');
    if (
      !interaction.member?.permissions.has('administrator') &&
      selectedUserID
    ) {
      return interaction.createMessage({
        embeds: [
          {
            title: `Cannot make someone else a discord kitten`,
            description: `You do not have permission to do this! you need be a Discord Mod with the \`Administrator\` permission!`,
            color: 16728385,
          },
        ],
      });
    }
    const memData = await XPManager.getInstance().getGuildMemberXP(
      interaction.guildID,
      user.id
    );
    if (memData.kitten) {
      if (
        memData.kitten === 2 &&
        !interaction.member?.permissions.has('administrator')
      ) {
        return interaction.createMessage({
          embeds: [
            {
              title: `Cannot change ${
                selectedUserID ? `${user.username}'s` : `your`
              } kitten status`,
              description: `You do not have permission to do this! you need be a Discord Mod with the \`Administrator\` permission!`,
              color: 16728385,
            },
          ],
        });
      }
      await XPManager.getInstance().updateGuildMemberXP(
        interaction.guildID,
        user.id,
        {
          kitten: 0,
        }
      );
      return interaction.createMessage({
        embeds: [
          {
            title: `${
              selectedUserID ? `${user.username} is ` : `You're`
            } no longer a discord kitten`,
            description: `${
              selectedUserID ? `${user.username} is ` : `You're`
            } no longer a discord kitten and now can talk normally!`,
            color: 16728385,
          },
        ],
      });
    }
    await XPManager.getInstance().updateGuildMemberXP(
      interaction.guildID,
      user.id,
      {
        kitten:
          selectedUserID && interaction.member?.permissions.has('administrator')
            ? 2
            : 1,
      }
    );
    return interaction.createMessage({
      embeds: [
        {
          title: `${
            selectedUserID ? `${user.username} is ` : `You're`
          } now a discord kitten`,
          description: `${
            selectedUserID ? `${user.username} is ` : `You're`
          } now a discord kitten and now can only talk in uwu!`,
          color: 16728385,
        },
      ],
    });
  },
} as Command;

export default uwuSpeak;
