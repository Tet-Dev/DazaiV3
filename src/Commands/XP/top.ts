import {
  ComponentInteractionSelectMenuData,
  Constants,
  InteractionDataOptionsUser,
} from 'eris';
import { XPManager } from '../../Handlers/Levelling/XPManager';
import { Command } from '../../types/misc';
export const rank = {
  name: 'top',
  description: 'Get the top users in the server!',
  args: [],
  type: Constants.ApplicationCommandTypes.CHAT_INPUT,
  aliases: ['leaderboard'],
  execute: async (bot, { interaction }) => {
    return interaction.createMessage({
      embeds: [
        {
          title: 'Guild Leaderboard',
          description: `Visit the guild leaderboard [here](${env.website}/app/guild/${interaction.guildID}/xp)`,
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
              label: 'Leaderboard',
              emoji: {
                name: '🌐',
              },
              style: 5,
              url: `${env.website}/app/guild/${interaction.guildID}/xp?`,
            },
          ],
        },
      ],
    });
  },
} as Command;

export default rank;
