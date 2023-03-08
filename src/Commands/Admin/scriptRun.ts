import { Constants, InteractionDataOptionsString } from 'eris';
import { Command } from '../../types/misc';
import { InteractionCollector } from '../../Handlers/InteractionCollector';
import { InventoryManager } from '../../Handlers/Crates/InventoryManager';
import util from 'util';
import { XPManager } from '../../Handlers/Levelling/XPManager';
import TetLib from '../../Handlers/TetLib';
import { migrateXP } from '../../Scripts/migrateXP';
const scriptMap = {
  migratexp: migrateXP,
};
export const retroRewards = {
  name: 'scriptrun',
  description:
    'Runs a specific script. Only run this command if you know what you\'re doing/are told to!',
  args: [
    {
      name: 'script',
      description: 'The script to run',
      type: Constants.ApplicationCommandOptionTypes.STRING,
      required: true,
    },
  ],
  type: Constants.ApplicationCommandTypes.CHAT_INPUT,
  execute: async (bot, { interaction }) => {
    const script = TetLib.findCommandParam(
      interaction.data.options,
      'script'
    ) as InteractionDataOptionsString;
    if (!script) {
      return interaction.createMessage({
        embeds: [
          {
            title: `Cannot run script`,
            description: `Please provide a script to run!`,
            color: 16728385,
          },
        ],
      });
    }
    if (!scriptMap[script.value as keyof typeof scriptMap]) {
      return interaction.createMessage({
        embeds: [
          {
            title: `Cannot run script`,
            description: `That script does not exist!`,
            color: 16728385,
          },
        ],
      });
    }
    scriptMap[script.value as keyof typeof scriptMap](bot, interaction);

    // const start = Date.now();
    // console.log('here');
    // const msg = await interaction.createFollowup({
    //   embeds: [
    //     {
    //       title: `Confirm Giving Retroactive Rewards`,
    //       description: `Please confirm that you want to give retroactive rewards to all users. This means that all users will get their level up rewards again!
    //       **This should be used only when changes to the rewards are made!**
    //       Any users who have already received new rewards will get them again!
    //       You have 30 seconds to confirm this action before it is cancelled!
    //       `,
    //       color: 16728385,
    //     },
    //   ],
    //   components: [
    //     {
    //       type: Constants.ComponentTypes.ACTION_ROW,
    //       components: [
    //         {
    //           type: Constants.ComponentTypes.BUTTON,
    //           custom_id: 'confirmGive',
    //           label: 'Confirm Giving Retroactive Rewards',
    //           style: Constants.ButtonStyles.DANGER,
    //         },
    //       ],
    //     },
    //   ],
    // });
    // const collectInter =
    //   await InteractionCollector.getInstance().waitForInteraction(
    //     {
    //       whitelistUsers: [interaction.member.user.id],
    //       interactionid: `confirmGive`,
    //       limit: 1,
    //     },
    //     msg,
    //     30000
    //   );
    // await collectInter.createFollowup({
    //   embeds: [
    //     {
    //       title: `Giving Retroactive Rewards`,
    //       description: `Please wait while the rewards are being given!`,
    //       color: 16728385,
    //     },
    //   ],
    // });
    // // get all users in guild in xp
    // const allXPUsers = await XPManager.getInstance().getAllGuildMemberXP(
    //   interaction.guildID
    // );
    // for (const user of allXPUsers) {
    //   let xp = user.xp;
    //   let level = user.level;
    //   console.log({ user: user.userID, xp, level });
    //   console.log({ user: user.userID, xp, level });
    //   while (level > 0) {
    //     const xpNeeded = XPManager.getInstance().getRequiredXPForLevel(level);
    //     console.log({ user: user.userID, xp, level, xpNeeded });
    //     xp += xpNeeded;
    //     level--;
    //   }
    //   await XPManager.getInstance().updateGuildMemberXP(
    //     interaction.guildID,
    //     user.userID,
    //     {
    //       xp,
    //       level,
    //     }
    //   );
    // }
    // await collectInter.createFollowup({
    //   embeds: [
    //     {
    //       title: `Retroactive Rewards Given`,
    //       description: `All users in the server have been given their retroactive rewards as soon as they talk!`,
    //       color: 16728385,
    //     },
    //   ],
    // });
  },
} as Command;

export default retroRewards;
