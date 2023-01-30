import { Constants, VoiceChannel } from 'eris';
import { MusicManager } from '../../../../Handlers/Music/MusicPlayer';
import { RESTHandler, RESTMethods } from '../../../../types/misc';

export const getJoinableChannels = {
  method: RESTMethods.GET,
  path: '/guilds/:guildID/music/channels',
  sendUser: false,
  run: async (req, res, next, user) => {
    const guildID = req.params.guildID;
    const allVoiceChannels = bot.guilds
      .get(guildID)
      ?.channels.filter(
        (c) => c.type === Constants['ChannelTypes'].GUILD_VOICE
      ) as VoiceChannel[];

    const joinableVoiceChannels = allVoiceChannels.filter((c) => {
      let canJoin =
        c.permissionsOf(bot.user.id).has('voiceConnect') &&
        (!c.userLimit ||
          c.userLimit > c.voiceMembers.size ||
          c.permissionsOf(bot.user.id).has('voiceMoveMembers'));
      let canSpeak = c.permissionsOf(bot.user.id).has('voiceSpeak');
      return canJoin && canSpeak;
    });

    const allTextChannels = bot.guilds
      .get(guildID)
      ?.channels.filter(
        (c) => c.type === Constants['ChannelTypes'].GUILD_TEXT
      ) as VoiceChannel[];
    const sendableTextChannels = allTextChannels.filter((c) => {
      let canSend = c.permissionsOf(bot.user.id).has('sendMessages');
      let canEmbed = c.permissionsOf(bot.user.id).has('embedLinks');
      return canSend && canEmbed;
    });

    res.json({
      audioChannels: joinableVoiceChannels.map((c) => ({
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
      textChannels: sendableTextChannels.map((c) => ({
        id: c.id,
        name: c.name,
      })),
    });
  },
} as RESTHandler;
export default getJoinableChannels;
