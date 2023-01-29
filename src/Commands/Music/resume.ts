import {
  ComponentInteractionSelectMenuData,
  Constants,
  InteractionDataOptionsString,
} from 'eris';
import { Command } from '../../types/misc';
import { InteractionCollector } from '../../Handlers/InteractionCollector';
import { MusicManager } from '../../Handlers/Music/MusicPlayer';
export const play = {
  name: 'resume',
  description: 'Resume the current song!',
  args: [],
  type: Constants.ApplicationCommandTypes.CHAT_INPUT,
  execute: async (bot, { interaction }) => {
    if (!interaction.guildID || !interaction.member)
      return interaction.createMessage('This is a guild only command!');
    const start = Date.now();
    const res = await MusicManager.getInstance().resume(interaction.guildID);
    if (res === null) {
      return interaction.createMessage('There is no song playing right now!');
    }
    if (res) {
      return interaction.createMessage({
        embeds: [
          {
            title: 'Music Resumed',
            description: 'Music has been resumed! use `/pause` to resume it!',
            color: 4456364,
            thumbnail: {
              url:
                'https://cdn.discordapp.com/attachments/757863990129852509/1044221426418331648/tumblr_o7fk7quWVh1shr9wko3_400.jpg',
            },
          },
        ],
      });
    }
    return interaction.createMessage({
      embeds: [
        {
          title: 'Music Not Paused',
          description: 'Music has not been paused! use `/pause` to pause it!',
          color: 16728385,
          thumbnail: {
            url:
              'https://cdn.discordapp.com/attachments/757863990129852509/1044221426418331648/tumblr_o7fk7quWVh1shr9wko3_400.jpg',
          },
        },
      ],
    });
  },
} as Command;

export default play;
