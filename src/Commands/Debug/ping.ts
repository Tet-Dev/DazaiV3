import { Constants } from 'eris';
import { Command } from '../../types/misc';
import { InteractionCollector } from '../../Handlers/InteractionCollector';
export const ping = {
  name: 'ping',
  description: 'Pings the bot',
  args: [],
  type: Constants.ApplicationCommandTypes.CHAT_INPUT,
  execute: async (bot, { interaction }) => {
    const start = Date.now();
    await interaction.createMessage('Pinging...');
    const end = Date.now();
    let clicks = 0;
    const msg = await interaction.createFollowup({
      content: `Pong! Took ${end - start}ms`,
      components: [
        {
          type: Constants.ComponentTypes.ACTION_ROW,
          components: [
            {
              type: Constants.ComponentTypes.BUTTON,
              label: 'Try again',
              style: Constants.ButtonStyles.PRIMARY,
              emoji: {
                name: '🔁',
                // id: '787190767105867776',
                animated: true,
              },
              custom_id: 'tryagain',
            },
          ],
        },
      ],
    });
    InteractionCollector.getInstance().collectInteraction(
      {
        interactionid: 'tryagain',
        run: async (bot, interaction) => {
          // clicks++;
          await msg.edit(
            `Interaction took ${Date.now() - interaction.createdAt}ms`
          );
        },
        limit: 5,
        whitelistUsers: [(interaction.user || interaction.member?.user!).id],
      },
      msg,
      1000 * 20
    );
    // (bot as  ErisComponents.Client);
    return;
  },
} as Command;

export default ping;
