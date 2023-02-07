import {
  ComponentInteractionSelectMenuData,
  Constants,
  InteractionDataOptionsString,
} from 'eris';
import { Command } from '../../types/misc';
import { InteractionCollector } from '../../Handlers/InteractionCollector';
import { MusicManager } from '../../Handlers/Music/MusicPlayer';
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
    const start = Date.now();
    
    return interaction.createMessage({
      embeds: [
        {
          title: 'Music Resumed',
          description: 'Music has been resumed! use `/pause` to resume it!',
          color: 4456364,
          thumbnail: {
            url: 'https://cdn.discordapp.com/attachments/757863990129852509/1044221426418331648/tumblr_o7fk7quWVh1shr9wko3_400.jpg',
          },
        },
      ],
    });
  },
} as Command;

export default rank;
