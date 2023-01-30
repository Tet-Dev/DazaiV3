import { VoiceChannel } from 'eris';
import { MusicManager } from '../../../../Handlers/Music/MusicPlayer';
import { RESTHandler, RESTMethods } from '../../../../types/misc';

export const getMusicStatus = {
  method: RESTMethods.GET,
  path: '/guilds/:guildID/music/status',
  sendUser: false,
  run: async (req, res, next, user) => {
    const guildID = req.params.guildID;
    const player = MusicManager.getInstance().getGuildData(guildID);
    if (!player) {
      return res.status(404).json({ error: 'No player found' });
    }
    const track = player.queue.current;
    if (!track) {
      return res.status(404).json({ error: 'No track found' });
    }
    const status = player.playing ? 'playing' : 'paused';
    // get all people in the voice channel
    const voiceChannel = bot.getChannel(player.voiceChannel!) as VoiceChannel;
    voiceChannel.voiceMembers;
    const data = {
      track: MusicManager.getJSONOfTrack(track),
      status,
      position: player.position,
      queue: player.queue.map(MusicManager.getJSONOfTrack),
      members: voiceChannel.voiceMembers.map((m) => ({
        id: m.id,
        username: m.username,
        discriminator: m.discriminator,
        avatarURL: m.avatarURL,
      })),
    };
    res.json(data);
  },
} as RESTHandler;
export default getMusicStatus;
