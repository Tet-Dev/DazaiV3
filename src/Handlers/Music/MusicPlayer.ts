import { Manager, Player, Track, UnresolvedTrack } from 'erela.js';
import { Constants, Member, TextChannel, User } from 'eris';
import EventEmitter from 'events';
import { MusicCardManager } from './MusicCardManager';

export class MusicManager extends EventEmitter {
  static instance: MusicManager;
  static getInstance(): MusicManager {
    if (!MusicManager.instance) MusicManager.instance = new MusicManager();
    return MusicManager.instance;
  }
  guildMap: Map<string, Player> = new Map();
  musicManager: Manager;
  private constructor() {
    super();
    MusicCardManager.getInstance();
    this.musicManager = new Manager({
      // The nodes to connect to, optional if using default lavalink options
      nodes: env.LavalinkNodes,
      // Method to send voice data to Discord
      send: (id, payload) => {
        const guild = bot.guilds.get(id);
        // NOTE: FOR ERIS YOU NEED JSON.stringify() THE PAYLOAD
        if (guild) guild.shard.sendWS(payload.op, payload.d);
        console.trace({ payload });
      },
      autoPlay: true,
    });
    this.musicManager.createNode(env.LavalinkNodes[0]);
    bot.on('rawWS', (d) => {
      if (!['VOICE_STATE_UPDATE', 'VOICE_SERVER_UPDATE'].includes(d.t!)) return;
      //@ts-ignore
      this.musicManager.updateVoiceState(d);
      console.log({ voiceState: d });
    });
    // this.musicManager.on('nodeRaw', d => console.log(d));
    this.musicManager.on('nodeConnect', (node) => {
      console.log(`Node ${node.options.identifier} connected`);
    });
    this.musicManager.on('nodeError', (node, error) => {
      console.log(
        `Node ${node.options.identifier} had an error: ${error.message}`
      );
    });
    this.musicManager.on('playerDisconnect', (player) => {
      this.guildMap.delete(player.guild);
      player.destroy(true);
    });
    this.musicManager.on('trackStart', async (player, track) => {
      console.log('Track started', { track });
      if (player.textChannel) {
        const card = await MusicCardManager.getInstance().getUpNextImage(track);
        if (!card) return;
        const text = bot.getChannel(player.textChannel) as TextChannel;
        text.createMessage(
          {
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
                    url: `http://localhost:3000/app/guild/${player.guild}/music?`,
                  },
                ],
              },
            ],
          },
          { file: card, name: 'card.png' }
        );
      }
    });
    this.musicManager.on('trackEnd', (player, track) => {
      console.log('Track ended', { track });
      // if (player.queue.size) player.play();
      // else this.disconnect(player.guild);
    });
  }
  getGuildData(guildID: string) {
    return this.guildMap.get(guildID);
  }
  connect(guildID: string, channelID: string, textChannelID: string) {
    if (this.guildMap.has(guildID)) return this.guildMap.get(guildID);
    const player = this.musicManager.create({
      guild: guildID,
      voiceChannel: channelID,
      textChannel: textChannelID,
      selfDeafen: true,
    });
    player.connect();
    this.guildMap.set(guildID, player);
    return player;
  }
  disconnect(guildID: string) {
    const player = this.guildMap.get(guildID);
    if (!player) return;
    player.destroy();
    this.guildMap.delete(guildID);
  }
  queueSong(guildID: string, song: Track) {
    const player = this.getGuildData(guildID);
    if (!player) return undefined;
    //@ts-ignore
    player.queue.add(song);
    if (!player.playing && !player.paused && !player.queue.size) {
      player.play();
      console.log('Requesting play');
      return true;
    }
    return false;
    // console.log(player.queue, player.queue.size, player.playing, player.paused);
  }
  async removeQueuedSong(guildID: string, index: number) {
    const player = this.getGuildData(guildID);
    if (!player) return;
    const song = player.queue[index];
    if (!song) return;
    player.queue.remove(index);
    return song;
  }

  async search(query: string, requester: Member) {
    const results = await this.musicManager.search(query, requester);
    switch (results.loadType) {
      case 'LOAD_FAILED':
        return { error: true, message: results.exception?.message };
      case 'NO_MATCHES':
        return { error: true, message: 'No results found.' };
      case 'PLAYLIST_LOADED':
        return { error: false, tracks: results.tracks, type: 'playlist' };
      case 'TRACK_LOADED':
        return { error: false, tracks: results.tracks, type: 'track' };
      case 'SEARCH_RESULT':
        return { error: false, tracks: results.tracks, type: 'search' };
    }
  }
  async pause(guildID: string) {
    const player = this.getGuildData(guildID);
    if (!player) return null;

    if (player.paused) {
      this.resume(guildID);
      return false;
    }
    player.pause(true);
    return true;
  }
  async resume(guildID: string) {
    const player = this.getGuildData(guildID);
    if (!player) return null;
    if (!player.paused) return false;
    player.pause(false);
    return true;
  }
  async skip(guildID: string) {
    const player = this.getGuildData(guildID);
    if (!player) return null;
    let track = player.queue.current;
    player.stop();
    return track;
  }
  static getJSONOfTrack(track: UnresolvedTrack | Track) {
    const user = track.requester as User;
    return {
      title: track.title,
      url: track.uri,
      duration: track.duration,
      thumbnail: track.displayThumbnail?.('maxresdefault') || track.thumbnail,
      author: track.author,
      requestedBy: {
        id: user.id,
        username: user.username,
        discriminator: user.discriminator,
        avatar: user.avatarURL,
      },
    };
  }
}
export type GuildMusicData = {
  queue: MusicInfo[];
  playing: boolean;
  // startedAt: number;
  paused: boolean;
  nowPlaying: MusicInfo;
};
export type MusicInfo = {
  title: string;
  url: string;
  duration: number;
  thumbnail: string;
  requestedBy: Member;
};
