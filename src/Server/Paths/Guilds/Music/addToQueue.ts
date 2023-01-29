import { MusicManager } from '../../../../Handlers/Music/MusicPlayer';
import { RESTHandler, RESTMethods } from '../../../../types/misc';

export const getQueue = {
  method: RESTMethods.POST,
  path: '/guilds/:guildID/music/queue',
  sendUser: true,
  run: async (req, res, next, user) => {
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const guildID = req.params.guildID;
    // check for youtube link
    const url = req.body.url as string;
    if (!url) {
      return res.status(400).json({ error: 'No url provided' });
    }
    const member = await bot.getRESTGuildMember(guildID, user.id);
    const track = await MusicManager.getInstance().search(url, member);
    if (track.error) {
      return res.status(400).json({ error: track.message });
    }
    if (track.type !== 'track') {
      return res.status(400).json({ error: 'Not a track' });
    }
    const player = MusicManager.getInstance().getGuildData(guildID);
    if (!player) {
      return res.status(404).json({ error: 'No player found' });
    }
    const playRes = MusicManager.getInstance().queueSong(
      guildID,
      track.tracks[0]
    );
    if (playRes === undefined) {
      return res.status(400).json({ error: 'Bot is not connected to VC!' });
    }
    res.json({ track: MusicManager.getJSONOfTrack(track.tracks[0]) });
  },
} as RESTHandler;
export default getQueue;
