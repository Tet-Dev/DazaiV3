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
    const data = {
      track: MusicManager.getJSONOfTrack(track),
      status,
      position: player.position,
      queue: player.queue.map(MusicManager.getJSONOfTrack),
    };
    res.json(data);
  },
} as RESTHandler;
export default getMusicStatus;
