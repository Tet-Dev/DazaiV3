import {
  Constants,
  InteractionDataOptionsString,
  InteractionDataOptionsUser,
} from 'eris';
import { Command } from '../../types/misc';
import { InteractionCollector } from '../../Handlers/InteractionCollector';
import { XPManager } from '../../Handlers/Levelling/XPManager';
import TetLib from '../../Handlers/TetLib';
import {
  LevellingRewards,
  LevelUpRewardType,
} from '../../Handlers/Levelling/LevelRewards';

/**
 * Retroactive rewards command information
 */
export const retroRewards = {
  name: 'retroactiverewards',
  description: 'Admin Only. Retroactively give levelling rewards to users.',
  args: [
    {
      name: 'user',
      description:
        'Apply retroactive rewards to a specific user. Leave blank to apply to all users.',
      type: Constants.ApplicationCommandOptionTypes.USER,
      required: false,
    },
    {
      name: 'reward_id',
      description:
        'The reward ID to give. Leave blank to give all rewards. You can find the reward IDs online.',
      type: Constants.ApplicationCommandOptionTypes.STRING,
      required: false,
    },
  ],
  type: Constants.ApplicationCommandTypes.CHAT_INPUT,
  execute: async (bot, { interaction }) => {
    console.log('Retroactive rewards command used');

    // Check if command was executed in a server
    if (!interaction.guildID) {
      return interaction.createMessage({
        embeds: [
          {
            title: `Cannot retroactively give rewards`,
            description: `This command can only be used in a server!`,
            color: 16728385,
          },
        ],
      });
    }

    // Check if user has administrator permissions
    if (!interaction.member?.permissions.has('administrator')) {
      return interaction.createMessage({
        embeds: [
          {
            title: `Cannot retroactively give rewards`,
            description: `You do not have permission to do this! you need the \`Administrator\` permission!`,
            color: 16728385,
          },
        ],
      });
    }

    console.log('acking...');
    await interaction.acknowledge();

    const start = Date.now();

    // Get selected user ID and reward ID from command options
    const selectedUserID = (
      TetLib.findCommandParam(
        interaction.data?.options,
        'user'
      ) as InteractionDataOptionsUser
    )?.value;
    const selectedRewardID = (
      TetLib.findCommandParam(
        interaction.data?.options,
        'reward_id'
      ) as InteractionDataOptionsString
    )?.value;

    // Get reward information based on selected reward ID
    let reward = selectedRewardID
      ? await LevellingRewards.getInstance().getGuildReward(selectedRewardID)
      : null;

    // If reward ID is selected but not found, return error message
    if (!reward && selectedRewardID) {
      await interaction.createFollowup({
        embeds: [
          {
            title: `Error Giving Retroactive Rewards`,
            description: `That reward ID does not exist!`,
            color: 16728385,
          },
        ],
      });
      return;
    }

    // Get user information based on selected user ID
    let userReference = selectedUserID
      ? bot.guilds.get(interaction.guildID)?.members.get(selectedUserID) ||
        (await bot.getRESTGuildMember(interaction.guildID, selectedUserID))
      : null;

    // If user ID is selected but not found, return error message
    if (!userReference && selectedUserID) {
      await interaction.createFollowup({
        embeds: [
          {
            title: `Error Giving Retroactive Rewards`,
            description: `That user does not exist!`,
            color: 16728385,
          },
        ],
      });
      return;
    }

    console.log('here');

    // Create a message for confirming reward giving action
    const msg = await interaction.createFollowup({
      embeds: [
        {
          title: `Confirm Giving Retroactive Rewards`,
          description: `Please confirm that you want to give ${
            selectedRewardID ? `\`${reward?.name}\`` : 'all rewards'
          } to ${
            selectedUserID ? userReference?.mention : 'all users'
          }. This means that ${
            selectedUserID ? userReference?.username : 'all users'
          } will get their level up rewards again! 
          **This should be used only when changes to the rewards are made!** 
          Any users who have already received new rewards will get them again!
          You have 30 seconds to confirm this action before it is cancelled!
          `,
          color: 16728385,
        },
      ],
      components: [
        {
          type: Constants.ComponentTypes.ACTION_ROW,
          components: [
            {
              type: Constants.ComponentTypes.BUTTON,
              custom_id: 'confirmGive',
              label: 'Confirm Giving Retroactive Rewards',
              style: Constants.ButtonStyles.DANGER,
            },
          ],
        },
      ],
    });

    // Wait for confirmation from user
    const collectInter =
      await InteractionCollector.getInstance().waitForInteraction(
        {
          whitelistUsers: [interaction.member.user.id],
          interactionid: `confirmGive`,
          limit: 1,
        },
        msg,
        30000
      );

    // Create a message for acknowledging reward giving process
    await collectInter.createFollowup({
      embeds: [
        {
          title: `Giving Retroactive Rewards`,
          description: `Please wait while the rewards are being given!`,
          color: 16728385,
        },
      ],
    });

    // If all rewards are selected, give retroactive rewards to all users in the server
    if (!selectedRewardID) {
      const allXPUsers = selectedUserID
        ? [
            await XPManager.getInstance().getGuildMemberXP(
              interaction.guildID,
              selectedUserID
            ),
          ]
        : await XPManager.getInstance().getAllGuildMemberXP(
            interaction.guildID
          );
      for (const user of allXPUsers) {
        let xp = user.xp;
        let level = user.level;
        console.log({ user: user.userID, xp, level });
        console.log({ user: user.userID, xp, level });

        // Calculate XP and level based on retroactive rewards
        while (level > 0) {
          const xpNeeded = XPManager.getInstance().getRequiredXPForLevel(level);
          console.log({ user: user.userID, xp, level, xpNeeded });
          xp += xpNeeded;
          level--;
        }

        // Update user's XP and level information in the database
        await XPManager.getInstance().updateGuildMemberXP(
          interaction.guildID,
          user.userID,
          {
            xp,
            level,
          }
        );
      }
    } else {
      // If a specific reward is selected, give retroactive rewards to all users in the server based on their level
      const allXPUsers = selectedUserID
        ? [
            await XPManager.getInstance().getGuildMemberXP(
              interaction.guildID,
              selectedUserID
            ),
          ]
        : await XPManager.getInstance().getAllGuildMemberXP(
            interaction.guildID
          );
      const guildRewards = [reward as LevelUpRewardType];
      for (const user of allXPUsers) {
        let xp = user.xp;
        let level = user.level;
        console.log({ user: user.userID, xp, level });
        let rwds = [] as LevelUpRewardType[];
        for (let i = 0; i <= level; i++) {
          rwds.push(
            ...LevellingRewards.getInstance().parseGuildRewardsForLevel(
              interaction.guildID,
              i,
              guildRewards
            )
          );
        }

        // Process retroactive rewards for a specific user
        const rewardProcess =
          await LevellingRewards.getInstance().processGuildRewardsForMember(
            interaction.guildID,
            user.userID,
            [0, level],
            rwds
          );
        if (!rewardProcess) {
          await collectInter.createFollowup({
            embeds: [
              {
                title: `Error Giving Retroactive Rewards`,
                description: `There was an error giving rewards!`,
                color: 16728385,
              },
            ],
          });
          return;
        }
      }
    }

    // Create a message for acknowledging that retroactive rewards have been given
    await collectInter.createFollowup({
      embeds: [
        {
          title: `Retroactive Rewards Given`,
          description: `All users in the server have been given their retroactive rewards as soon as they talk!`,
          color: 16728385,
        },
      ],
    });
  },
} as Command;

export default retroRewards;
