import {
  ComponentInteractionSelectMenuData,
  Constants,
  InteractionDataOptionsString,
} from 'eris';
import { Command } from '../../types/misc';
import { InteractionCollector } from '../../Handlers/InteractionCollector';
import { MusicManager } from '../../Handlers/Music/MusicPlayer';
import moment from 'moment';
const msToReadable = (ms: number) => {
  const secLen = 1000,
    minLen = 60 * secLen,
    hourLen = 60 * minLen;
  const twoDigits = (n: number) => `${~~n}`.padStart(2, '0');

  const d = ms;
  const hours = twoDigits(d / hourLen) + ':';

  return (
    (hours === '00:' ? '' : hours) +
    twoDigits((d % hourLen) / minLen) +
    ':' +
    twoDigits((d % minLen) / secLen)
  );
};
export const play = {
  name: 'play',
  description: 'Play a song from youtube!',
  args: [
    {
      name: 'song',
      description:
        'The name of the song/the URL of the song/playlist URL (Spotify + Youtube)',
      type: Constants.ApplicationCommandOptionTypes.STRING,
      required: true,
    },
  ],
  type: Constants.ApplicationCommandTypes.CHAT_INPUT,
  permissions: ['playSong'],
  execute: async (bot, { interaction }) => {
    if (!interaction.guildID || !interaction.member)
      return interaction.createMessage('This is a guild only command!');
    const start = Date.now();
    const player = MusicManager.getInstance().getGuildData(interaction.guildID);
    if (!player) {
      // get interaction member voice channel
      // if not in voice channel, return
      // if in voice channel, connect to voice channel
      const voiceChannel = interaction.member.voiceState.channelID;
      if (!voiceChannel) {
        // return interaction.createMessage(
        //   'You are not in a voice channel! Please join one, our to use this command!'
        // );

        return interaction.createMessage({
          embeds: [
            {
              title: `You are not in a voice channel!`,
              description: `Please use \`/connect\` to connect me to a voice channel or join a voice channel to use this command!`,
              color: 16728385,
              thumbnail: {
                url: 'https://i.pinimg.com/736x/f8/37/17/f837175981662cb08c92bfee0be2a6be.jpg',
              },
            },
          ],
        });
      }
      const connecter = await MusicManager.getInstance().connect(
        interaction.guildID,
        voiceChannel,
        interaction.channel.id
      );
      if (!connecter) {
        return interaction.createMessage({
          embeds: [
            {
              title: 'Unable to connect',
              description: 'Unable to connect to the voice channel!',
              color: 16728385,
              thumbnail: {
                url: 'https://cdn.discordapp.com/attachments/757863990129852509/1044221426418331648/tumblr_o7fk7quWVh1shr9wko3_400.jpg',
              },
            },
          ],
        });
      }
    }

    const initAck = await interaction.acknowledge(); //.createMessage('Searching for songs...');
    if (!interaction.data.options?.[0]) {
      return interaction.createFollowup(
        'Please provide a song name or URL to play!'
      );
    }
    const songs = await MusicManager.getInstance().search(
      (interaction.data.options[0] as InteractionDataOptionsString).value,
      interaction.member
    );
    await initAck;
    if (songs.error) {
      return interaction.createFollowup({
        embeds: [
          {
            title: `An error has occured while trying to search for \`${
              (interaction.data.options[0] as InteractionDataOptionsString)
                .value
            }\``,
            description: `\`\`\`\n${songs.message}\n\`\`\`\nThink this is a mistake? [Report it!](https://invite.dazai.app/)`,
            color: 16728385,
            thumbnail: {
              url: 'https://i.pinimg.com/736x/f8/37/17/f837175981662cb08c92bfee0be2a6be.jpg',
            },
          },
        ],
      });
    }
    if (!interaction.member?.voiceState.channelID) {
      return interaction.createFollowup(
        'You are not in a voice channel! Please join one to use this command!'
      );
    }
    MusicManager.getInstance().connect(
      interaction.member.guild.id,
      interaction.member.voiceState.channelID,
      interaction.channel.id
    );
    if (songs.type !== 'search') {
      const { tracks } = songs;
      tracks?.map((track) => {
        MusicManager.getInstance().queueSong(
          interaction.member!.guild.id,
          track
        );
      });
      return interaction.createFollowup({
        embeds: [
          {
            title: 'Added to queue!',
            description: `\`\`\`${songs.tracks?.length} songs have been added to the queue!\`\`\``,
            color: 11629370,
            thumbnail: {
              url: 'https://i.imgur.com/8QZ7Z9A.png',
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
                url: `${env.website}/app/guild/${interaction.guildID}/music?`,
              },
            ],
          },
        ],
      });
    }
    const results = songs.tracks?.slice(0, 10);
    const msg = await interaction.createFollowup({
      embeds: [
        {
          title: 'Music Search Results',
          description: 'Select a song below to play!',
          color: 11629370,
          fields: results.map((track) => {
            return {
              name: track.title,
              value: `🕓 ${msToReadable(track.duration)}  [「 Video Link 」](${
                track.uri
              })\n👤 ${track.author}`,
            };
          }),
          thumbnail: {
            url: 'https://i.pinimg.com/736x/07/2b/7e/072b7e2858a9621ec86427f70931362d.jpg',
          },
        },
      ],
      components: [
        {
          type: Constants.ComponentTypes.ACTION_ROW,
          components: [
            {
              type: Constants.ComponentTypes.SELECT_MENU,
              custom_id: 'songSelect',
              placeholder: 'Select a song',
              options: results.map((track, i) => {
                return {
                  label: `${track.title} | ${track.author}`.substring(0, 100),
                  value: i.toString(),
                };
              }),
            },
          ],
        },
      ],
    });
    InteractionCollector.getInstance().collectInteraction(
      {
        interactionid: 'songSelect',
        run: async (bot, interaction) => {
          (interaction.data as ComponentInteractionSelectMenuData).values?.map(
            async (value) => {
              const track = results[parseInt(value)];
              if (
                !MusicManager.getInstance().queueSong(
                  interaction.member!.guild.id,
                  track
                )
              )
                await interaction.createMessage({
                  embeds: [
                    {
                      title: 'Added to queue!',
                      description: `\`\`\`${track.title} has been added to the queue!\`\`\``,
                      color: 11629370,
                      thumbnail: {
                        url: `${track.thumbnail}`,
                      },
                    },
                  ],
                });
              interaction.deleteOriginalMessage();
            }
          );
        },
        limit: 1,
        whitelistUsers: [(interaction.user || interaction.member?.user!).id],
      },
      msg,
      1000 * 20
    );

    // (bot as  ErisComponents.Client);
    return;
  },
} as Command;

export default play;
