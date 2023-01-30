import { Constants, TextableChannel, VoiceChannel } from 'eris';
import { MusicManager } from '../../../../Handlers/Music/MusicPlayer';
import { RESTHandler, RESTMethods } from '../../../../types/misc';

export const connectToChannel = {
  method: RESTMethods.POST,
  path: '/guilds/:guildID/music/channels',
  sendUser: true,
  run: async (req, res, next, user) => {
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const guildID = req.params.guildID;
    const textChannel = req.body.textChannel as string;
    const voiceChannel = req.body.voiceChannel as string;
    if (!textChannel || !voiceChannel) {
      return res.status(400).json({ error: 'Missing text or voice channel' });
    }
    // check for permissions
    const textChannelObj = bot.getChannel(textChannel) as TextableChannel;
    if (
      !textChannelObj ||
      textChannelObj.type !== Constants.ChannelTypes.GUILD_TEXT
    ) {
      return res.status(400).json({ error: 'Invalid text channel' });
    }
    const voiceChannelObj = bot.getChannel(voiceChannel) as VoiceChannel;
    if (
      !voiceChannelObj ||
      voiceChannelObj.type !== Constants.ChannelTypes.GUILD_VOICE
    ) {
      return res.status(400).json({ error: 'Invalid voice channel' });
    }
    const member = await bot.getRESTGuildMember(guildID, user.id);
    if (!member) {
      return res.status(400).json({ error: 'Invalid member' });
    }
    // check if member can see, send messages, and connect to voice channel
    if (!textChannelObj.permissionsOf(member).has('viewChannel')) {
      return res.status(400).json({ error: 'Member cannot view text channel' });
    }
    if (!textChannelObj.permissionsOf(member).has('sendMessages')) {
      return res
        .status(400)
        .json({ error: 'Member cannot send messages in text channel' });
    }
    if (!voiceChannelObj.permissionsOf(member).has('voiceConnect')) {
      return res
        .status(400)
        .json({ error: 'Member cannot connect to voice channel' });
    }
    // check if bot can see, send messages, and connect to voice channel
    if (!textChannelObj.permissionsOf(bot.user.id).has('viewChannel')) {
      return res.status(400).json({ error: 'Bot cannot view text channel' });
    }
    if (
      !textChannelObj.permissionsOf(bot.user.id).has('sendMessages') ||
      !textChannelObj.permissionsOf(bot.user.id).has('embedLinks')
    ) {
      return res
        .status(400)
        .json({ error: 'Bot cannot send messages in text channel' });
    }
    if (!voiceChannelObj.permissionsOf(bot.user.id).has('voiceConnect')) {
      return res
        .status(400)
        .json({ error: 'Bot cannot connect to voice channel' });
    }
    const music = MusicManager.getInstance().connect(
      guildID,
      voiceChannel,
      textChannel
    );
    if (!music) {
      return res.status(400).json({ error: 'Failed to connect to channel' });
    }
    res.json({ success: true });
  },
} as RESTHandler;
export default connectToChannel;
