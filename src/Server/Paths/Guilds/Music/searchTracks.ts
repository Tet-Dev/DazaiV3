import { MusicManager } from '../../../../Handlers/Music/MusicPlayer';
import { RESTHandler, RESTMethods } from '../../../../types/misc';

export const searchTracks = {
  method: RESTMethods.GET,
  path: '/guilds/:guildID/music/search',
  sendUser: true,
  run: async (req, res, next, user) => {
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const guildID = req.params.guildID;
    const songName = req.query.song as string;
    if (!songName) {
      return res.status(400).json({ error: 'No song name provided' });
    }
    const member = await bot.getRESTGuildMember(guildID, user.id);
    const songs = await MusicManager.getInstance().search(songName, member);
    if (!songs) {
      return res.status(400).json({ error: 'No songs found' });
    }
    
    if (songs.error) {
      return res.status(400).json({ error: songs.message });
    }
    res.json({
      ...songs,
      tracks: songs.tracks?.map(MusicManager.getJSONOfTrack),
    });
  },
} as RESTHandler;
export default searchTracks;
