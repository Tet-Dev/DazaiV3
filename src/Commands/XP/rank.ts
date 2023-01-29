import {
    ComponentInteractionSelectMenuData,
    Constants,
    InteractionDataOptionsString,
  } from 'eris';
  import { Command } from '../../types/misc';
  import { InteractionCollector } from '../../Handlers/InteractionCollector';
  import { MusicManager } from '../../Handlers/Music/MusicPlayer';
  export const pause = {
    name: 'rank',
    description: 'Pause the current song! (Or resume it if it is already paused)',
    args: [],
    type: Constants.ApplicationCommandTypes.CHAT_INPUT,
    execute: async (bot, { interaction }) => {
      if (!interaction.guildID || !interaction.member)
        return interaction.createMessage('This is a guild only command!');
      const start = Date.now();
      const res = await MusicManager.getInstance().pause(interaction.guildID);
      if (res === null) {
        return interaction.createFollowup('There is no song playing right now!');
      }
      if (res) {
        return interaction.createMessage({
          embeds: [
            {
              title: 'Music Paused',
              description: 'Music has been paused! use `/resume` to resume it!',
              color: 16728385,
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
    },
  } as Command;
  
  export default pause;
  