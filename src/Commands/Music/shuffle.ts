import {
  ComponentInteraction,
  ComponentInteractionButtonData,
  ComponentInteractionSelectMenuData,
  Constants,
  Embed,
  EmbedOptions,
  InteractionDataOptionsNumber,
  Member,
} from 'eris';
import { InteractionCollector } from '../../Handlers/InteractionCollector';
import { MusicManager } from '../../Handlers/Music/MusicPlayer';
import { Command } from 'types/misc';

export const queue = {
  name: 'shuffle',
  description: 'Shuffles the queue of the current server',
  args: [],
  type: Constants.ApplicationCommandTypes.CHAT_INPUT,
  execute: async (bot, { interaction }) => {
    if (!interaction.guildID || !interaction.member)
      return interaction.createMessage('This is a guild only command!');
    const start = Date.now();
    const res = await MusicManager.getInstance().getGuildData(
      interaction.guildID
    );
    if (!res || !res.queue.length) {
      return interaction.createMessage({
        embeds: [
          {
            title: `Cannot shuffle queue`,
            description: `The queue is empty!`,
            color: 16728385,
            thumbnail: {
              url: 'https://i.pinimg.com/736x/f8/37/17/f837175981662cb08c92bfee0be2a6be.jpg',
            },
          },
        ],
      });
    }
    res.queue.shuffle();
    return interaction.createMessage({
      embeds: [
        {
          title: 'Shuffled Queue',
          description: `The queue has been shuffled!`,
          color: 11629370,
          thumbnail: {
            url: 'https://i.imgur.com/8QZ7Z9A.png',
          },
        },
      ],
    });
  },
} as Command;

export default queue;
