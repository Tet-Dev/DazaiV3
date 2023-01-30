import { MusicManager } from '../../../../Handlers/Music/MusicPlayer';
import { RESTHandler, RESTMethods } from '../../../../types/misc';

export const getMusicStatus = {
  method: RESTMethods.POST,
  path: '/guilds/:guildID/music/status',
  sendUser: true,
  run: async (req, res, next, user) => {
    const guildID = req.params.guildID;
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const { paused, skip, seekTo, removeSong, removeSongIndex, purgeQueue } =
      req.body;
    const player = MusicManager.getInstance().getGuildData(guildID);
    if (!player) {
      return res.status(404).json({ error: 'No player found' });
    }
    if (paused) {
      MusicManager.getInstance().pause(guildID);
      bot.createMessage(player.textChannel!, {
        embeds: [
          {
            title: 'Music Paused',
            description: `Music has been paused! use \`/resume\` to resume it!`,
            color: 16728385,
            thumbnail: {
              url: 'https://cdn.discordapp.com/attachments/757863990129852509/1044221426418331648/tumblr_o7fk7quWVh1shr9wko3_400.jpg',
            },
            footer: {
              text: `${user.username}#${user.discriminator} via dashboard`,
            },
          },
        ],
      });
    } else if (paused === false) {
      bot.createMessage(player.textChannel!, {
        embeds: [
          {
            title: 'Music Resumed',
            description: `Music has been resumed`,
            color: 16728385,
            thumbnail: {
              url: 'https://cdn.discordapp.com/attachments/757863990129852509/1044221426418331648/tumblr_o7fk7quWVh1shr9wko3_400.jpg',
            },
            footer: {
              text: `${user.username}#${user.discriminator} via dashboard`,
            },
          },
        ],
      });
      MusicManager.getInstance().resume(guildID);
    }
    if (skip) {
      const skipSong = await MusicManager.getInstance().skip(guildID);
      bot.createMessage(player.textChannel!, {
        embeds: [
          {
            title: 'Music Skipped',
            description: `Skipped the current song, \`\`\`${skipSong?.title}\`\`\``,
            color: 16728385,
            thumbnail: {
              url: 'https://cdn.discordapp.com/attachments/757863990129852509/1044221426418331648/tumblr_o7fk7quWVh1shr9wko3_400.jpg',
            },
            footer: {
              text: `${user.username}#${user.discriminator} via dashboard`,
            },
          },
        ],
      });
    }
    if (seekTo) {
      bot.createMessage(player.textChannel!, {
        embeds: [
          {
            title: 'Music Seeked',
            description: `Seeked to \`\`\`${seekTo}\`\`\``,
            color: 16728385,
            thumbnail: {
              url: 'https://cdn.discordapp.com/attachments/757863990129852509/1044221426418331648/tumblr_o7fk7quWVh1shr9wko3_400.jpg',
            },
            footer: {
              text: `${user.username}#${user.discriminator} via dashboard`,
            },
          },
        ],
      });
      player.seek(seekTo);
    }
    if (removeSong || removeSongIndex) {
      // check
      if (!removeSong || (!removeSongIndex && removeSongIndex !== 0)) {
        return res.status(400).json({
          error: 'Both removeSong (url) and removeSongIndex are required',
        });
      }
      const song = player.queue[removeSongIndex];
      if (!song) {
        return res.status(400).json({ error: 'Song not found' });
      }
      if (song.uri !== removeSong) {
        return res.status(400).json({ error: 'Song url mismatch' });
      }
      const removedSong = await MusicManager.getInstance().removeQueuedSong(
        guildID,
        removeSongIndex
      );
      bot.createMessage(player.textChannel!, {
        embeds: [
          {
            title: 'Song Removed',
            description: `Removed \`\`\`${removedSong?.title}\`\`\` from the queue.`,
            color: 16728385,
            thumbnail: {
              url: 'https://cdn.discordapp.com/attachments/757863990129852509/1044221426418331648/tumblr_o7fk7quWVh1shr9wko3_400.jpg',
            },
            footer: {
              text: `${user.username}#${user.discriminator} via dashboard`,
            },
          },
        ],
      });
    }
    if (purgeQueue) {
      const guilddata = await MusicManager.getInstance().getGuildData(guildID);
      if (!guilddata) {
        return res.status(404).json({ error: 'No player found' });
      }
      guilddata.queue.clear();
      bot.createMessage(player.textChannel!, {
        embeds: [
          {
            title: 'Queue Purged',
            description: `Removed all songs from the queue.`,
            color: 16728385,
            thumbnail: {
              url: 'https://cdn.discordapp.com/attachments/757863990129852509/1044221426418331648/tumblr_o7fk7quWVh1shr9wko3_400.jpg',
            },
            footer: {
              text: `${user.username}#${user.discriminator} via dashboard`,
            },
          },
        ],
      });
    }

    res.status(200).json({ success: true });
  },
} as RESTHandler;
export default getMusicStatus;
