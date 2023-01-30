import { Constants, VoiceChannel } from 'eris';
import { MusicManager } from '../../../../Handlers/Music/MusicPlayer';
import { RESTHandler, RESTMethods } from '../../../../types/misc';

export const getMusicStatus = {
  method: RESTMethods.GET,
  path: '/guilds/:guildID/music/channels',
  sendUser: true,
  run: async (req, res, next, user) => {
    const guildID = req.params.guildID;
    const allChannels = bot.guilds
      .get(guildID)
      ?.channels.filter(
        (c) => c.type === Constants['ChannelTypes'].GUILD_VOICE
      ) as VoiceChannel[];

    const joinableChannels = allChannels.filter((c) => {
      let canJoin =
        c.permissionsOf(bot.user.id).has('voiceConnect') &&
        (c.userLimit > c.voiceMembers.size ||
          c.permissionsOf(bot.user.id).has('voiceMoveMembers'));
      let canSpeak = c.permissionsOf(bot.user.id).has('voiceSpeak');
      return canJoin && canSpeak;
    });

    res.json({
      channels: joinableChannels.map((c) => ({
        id: c.id,
        name: c.name,
        userLimit: c.userLimit,
        voiceMembers: c.voiceMembers.map((m) => ({
          id: m.id,
          username: m.username,
          discriminator: m.discriminator,
          avatarURL: m.avatarURL,
        })),
      })),
    });
  },
} as RESTHandler;
export default getMusicStatus;
