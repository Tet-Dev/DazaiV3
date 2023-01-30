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
  name: 'queue',
  description: 'Shows the queue of the current server',
  args: [
    {
      name: 'page',
      description:
        'The page of the queue you want to see (defaults to 1 if not provided)',
      type: Constants.ApplicationCommandOptionTypes.NUMBER,
      required: false,
    },
  ],
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
            title: `Cannot view queue`,
            description: `The queue is empty!`,
            color: 16728385,
            thumbnail: {
              url: 'https://i.pinimg.com/736x/f8/37/17/f837175981662cb08c92bfee0be2a6be.jpg',
            },
          },
        ],
        components: [
          {
            type: Constants.ComponentTypes.ACTION_ROW,
            components: [
              {
                type: Constants.ComponentTypes.BUTTON,
                label: 'View Online',
                emoji: {
                  name: '🌐',
                },
                style: 5,
                url: `http://localhost:3000/app/guild/${interaction.guildID}/music?`,
              },
            ],
          },
        ],
      });
    }
    if (res) {
      const pages = Math.ceil(res.queue.length / 10);
      let page =
        (interaction.data.options?.[0] as InteractionDataOptionsNumber)
          ?.value ?? 1;
      if (page > pages || page <= 0) {
        return interaction.createMessage({
          embeds: [
            {
              title: 'Invalid Page',
              description: `The page you provided is invalid! Please provide a page between 1 and ${pages}`,
              color: 16728385,
              thumbnail: {
                url: 'https://cdn.discordapp.com/attachments/757863990129852509/1044221426418331648/tumblr_o7fk7quWVh1shr9wko3_400.jpg',
              },
            },
          ],
        });
      }
      //   slice queue into array of arrays of 10
      const embeds = [] as EmbedOptions[];
      for (let i = 0; i < pages; i++) {
        const queue = res.queue.slice(i * 10, i * 10 + 10);
        const embed: EmbedOptions = {
          title: `Song Queue`,
          description: `Page ${i + 1} of ${pages}`,
          color: 4456364,
          thumbnail: {
            url: 'https://cdn.discordapp.com/attachments/757863990129852509/1044221426418331648/tumblr_o7fk7quWVh1shr9wko3_400.jpg',
          },
          fields: queue.map((song, index) => ({
            name: `${i * 10 + index + 1}. ${song.title}`,
            value: `Requested by <@${(song.requester as Member).id}> (${
              (song.requester as Member).nick ||
              (song.requester as Member).username
            }#${(song.requester as Member).discriminator})`,
          })),
        };

        embeds.push(embed);
      }
      await interaction.acknowledge();
      const msg = await interaction.createFollowup({
        embeds: [embeds[page - 1]],
        components: [
          {
            type: Constants.ComponentTypes.ACTION_ROW,
            components: [
              {
                type: Constants.ComponentTypes.BUTTON,
                label: 'View Online',
                emoji: {
                  name: '🌐',
                },
                style: 5,
                url: `http://localhost:3000/app/guild/${interaction.guildID}/music?`,
              },
            ],
          },
          {
            type: Constants.ComponentTypes.ACTION_ROW,
            components: [
              {
                type: Constants.ComponentTypes.SELECT_MENU,
                custom_id: 'pageSelect',
                placeholder: 'Jump to page',
                options: embeds.map((_, index) => ({
                  label: `Page ${index + 1}`,
                  value: `${index + 1}`,
                })),
              },
            ],
          },
          {
            type: Constants.ComponentTypes.ACTION_ROW,
            components: [
              {
                type: Constants.ComponentTypes.BUTTON,
                custom_id: 'pageLeft',
                label: 'Previous page',
                emoji: {
                  name: '⬅️',
                },
                style: 1,
                disabled: page === 1,
              },
              {
                type: Constants.ComponentTypes.BUTTON,
                custom_id: 'pageRight',
                label: 'Next page',
                emoji: {
                  name: '➡️',
                },
                style: 1,
                disabled: page === pages,
              },
            ],
          },
        ],
      });
      const editPage = async (
        pg: number,
        interaction: ComponentInteraction
      ) => {
        page = pg;
        await msg.edit({
          embeds: [embeds[page - 1]],
          components: [
            {
              type: Constants.ComponentTypes.ACTION_ROW,
              components: [
                {
                  type: Constants.ComponentTypes.SELECT_MENU,
                  custom_id: 'pageSelect',
                  placeholder: 'Jump to page',
                  options: embeds.map((_, index) => ({
                    label: `Page ${index + 1}`,
                    value: `${index + 1}`,
                  })),
                },
              ],
            },
            {
              type: Constants.ComponentTypes.ACTION_ROW,
              components: [
                {
                  type: Constants.ComponentTypes.BUTTON,
                  custom_id: 'pageLeft',
                  label: 'Previous page',
                  emoji: {
                    name: '⬅️',
                  },
                  style: 1,
                  disabled: Number(page) === 1,
                },
                {
                  type: Constants.ComponentTypes.BUTTON,
                  custom_id: 'pageRight',
                  label: 'Next page',
                  emoji: {
                    name: '➡️',
                  },
                  style: 1,
                  disabled: Number(page) === pages,
                },
              ],
            },
          ],
        });
        await interaction.acknowledge();
      };

      InteractionCollector.getInstance().collectInteraction(
        {
          interactionid: 'pageSelect',
          run: async (bot, interaction) => {
            let pg = ~~(interaction.data as ComponentInteractionSelectMenuData)
              .values[0];
            await editPage(pg, interaction);
            // interaction.acknowledge()
          },
          limit: 100000,
          whitelistUsers: [(interaction.user || interaction.member?.user!).id],
          doNotAcknowledge: true,
        },
        msg,
        1000 * 120
      );
      InteractionCollector.getInstance().collectInteraction(
        {
          interactionid: 'pageLeft',
          run: async (bot, interaction) => {
            await editPage(page - 1, interaction);
            // interaction.acknowledge()
          },
          doNotAcknowledge: true,
          whitelistUsers: [(interaction.user || interaction.member?.user!).id],
        },
        msg,
        1000 * 120
      );
      InteractionCollector.getInstance().collectInteraction(
        {
          interactionid: 'pageRight',
          run: async (bot, interaction) => {
            await editPage(page + 1, interaction);
            // interaction.acknowledge()
          },
          doNotAcknowledge: true,
          whitelistUsers: [(interaction.user || interaction.member?.user!).id],
        },
        msg,
        1000 * 120
      );
    }
  },
} as Command;

export default queue;
