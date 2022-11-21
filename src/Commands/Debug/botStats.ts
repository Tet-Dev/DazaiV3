import { Constants } from 'eris';
import { Command } from '../../types/misc';
import { InteractionCollector } from '../../Handlers/InteractionCollector';
export const ping = {
  name: 'botstats',
  description: 'Gets Bot Statistics',
  args: [],
  type: Constants.ApplicationCommandTypes.CHAT_INPUT,
  execute: async (bot, { interaction }) => {
    // const start = Date.now();
    // await interaction.createMessage('Pinging...');
    // const end = Date.now();
    // let clicks = 0;
    const msg = await interaction.createMessage({
      embeds: [
        {
          title: 'Bot Statistics :heartbeat:',
          color: 11629370,
          fields: [
            {
              name: 'Discord Ping',
              value: '50ms',
              inline: true,
            },
            {
              name: 'Server Count (Shard)',
              value: '6942',
              inline: true,
            },
            {
              name: 'Shard ID',
              value: '5',
              inline: true,
            },
            {
              name: 'Uptime',
              value: '69323s',
            },
          ],
          thumbnail: {
            url: bot.user.dynamicAvatarURL('png', 1024),
          },
        },
      ],
      // components: [
      //   {
      //     type: Constants.ComponentTypes.ACTION_ROW,
      //     components: [
      //       {
      //         type: Constants.ComponentTypes.BUTTON,
      //         label: 'Try again',
      //         style: Constants.ButtonStyles.PRIMARY,
      //         emoji: {
      //           name: '🔁',
      //           // id: '787190767105867776',
      //           animated: true,
      //         },
      //         custom_id: 'tryagain',
      //       },
      //     ],
      //   },
      // ],
    });
    // InteractionCollector.getInstance().collectInteraction(
    //   {
    //     interactionid: 'tryagain',
    //     run: async (bot, interaction) => {
    //       // clicks++;
    //       await msg.edit(
    //         `Interaction took ${Date.now() - interaction.createdAt}ms`
    //       );
    //     },
    //     limit: 5,
    //   },
    //   msg,
    //   1000*20
    // );
    // (bot as  ErisComponents.Client);
    return;
  },
} as Command;

export default ping;
