import {
  ComponentInteractionSelectMenuData,
  Constants,
  InteractionDataOptionsString,
} from 'eris';
import { Command } from '../../types/misc';
import { InteractionCollector } from '../../Handlers/InteractionCollector';
import { MusicManager } from '../../Handlers/Music/MusicPlayer';
export const skip = {
  name: 'skip',
  description: 'Skip the current song!',
  args: [],
  aliases: ['forceskip', 'fs'],
  type: Constants.ApplicationCommandTypes.CHAT_INPUT,
  execute: async (bot, { interaction }) => {
    if (!interaction.guildID || !interaction.member)
      return interaction.createMessage('This is a guild only command!');
    const start = Date.now();
    const res = await MusicManager.getInstance().skip(interaction.guildID);
    if (!res) {
      return interaction.createMessage('There is no song playing right now!');
    }
    if (res) {
      return interaction.createMessage({
        embeds: [
          {
            title: 'Music Skipped',
            description: `Skipped the current song, \`\`\`${res.info.title}\`\`\``,
            color: 16728385,
            thumbnail: {
              url: 'https://cdn.discordapp.com/attachments/757863990129852509/1044221426418331648/tumblr_o7fk7quWVh1shr9wko3_400.jpg',
            },
          },
        ],
      });
    }
    // return interaction.createMessage({
    //   embeds: [
    //     {
    //       title: 'Music Resumed',
    //       description: 'Music has been resumed! use `/pause` to resume it!',
    //       color: 4456364,
    //       thumbnail: {
    //         url: 'https://cdn.discordapp.com/attachments/757863990129852509/1044221426418331648/tumblr_o7fk7quWVh1shr9wko3_400.jpg',
    //       },
    //     },
    //   ],
    // });
  },
} as Command;

export default skip;
