// import { Manager, Player, Track, UnresolvedTrack } from 'erela.js';
import { LavalinkManager, Player, Track, UnresolvedTrack } from "lavalink-client";
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
  musicManager: LavalinkManager;
  private constructor() {
    super();
    MusicCardManager.getInstance();
    this.musicManager = new LavalinkManager({
      // The nodes to connect to, optional if using default lavalink options
      nodes: env.LavalinkNodes,
      // Method to send voice data to Discord
      sendToShard: (id, payload) => {
        const guild = bot.guilds.get(id);
        // NOTE: FOR ERIS YOU NEED JSON.stringify() THE PAYLOAD
        if (guild) guild.shard.sendWS(payload.op, payload.d);
        console.trace({ payload });
      },
      autoSkip: true,
      client: {
        id: bot.user.id,
        username: bot.user.username,
      },
      queueOptions: {
        
      }
    });
    // this.musicManager.createNode(env.LavalinkNodes[0]);
    bot.on('rawWS', (d) => {
      // if (!['VOICE_STATE_UPDATE', 'VOICE_SERVER_UPDATE'].includes(d.t!)) return;
      this.musicManager.sendRawData(d);
      // console.log({ voiceState: d });
    });
    bot.on('voiceChannelLeave', (member, channel) => {
      if (member.id !== bot.user.id) return;
      const player = this.guildMap.get(member.guild.id);
      if (!player) return;
      if (player.voiceChannelId === channel.id) {
        this.disconnect(member.guild.id);
        player.textChannelId && bot.createMessage(player.textChannelId,{
          embeds: [
            {
              title: 'Disconnected',
              description: `Bye! I have been removed from the voice channel! If you want me to join again, use the \`/connect\` command!`,
              color: 4456364,
              thumbnail: {
                url: 'https://cdn.discordapp.com/attachments/757863990129852509/1044221426418331648/tumblr_o7fk7quWVh1shr9wko3_400.jpg',
              },
            },
          ],
        });
      }
    });
    // this.musicManager.on('nodeRaw', d => console.log(d));
    this.musicManager.nodeManager.on("connect", (node) => {
      console.log(`Node ${node.options.host} connected`);
    });
    this.musicManager.nodeManager.on("error", (node, error) => {
      console.log(
        `Node ${node.options.host} had an error: ${error.message}`
      );
    });
    this.musicManager.on('playerDisconnect', (player) => {
      this.guildMap.delete(player.guildId);
      player.destroy();
    });
    this.musicManager.on('trackStart', async (player, track) => {
      console.log('Track started', { track });
      if (player.textChannelId) {
        const card = await MusicCardManager.getInstance().getUpNextImage(track);
        if (!card) return;
        const text = bot.getChannel(player.textChannelId) as TextChannel;
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
                    url: `${env.website}/app/guild/${player.guildId}/music?`,
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
    const player = this.musicManager.createPlayer({
        guildId: guildID,
        voiceChannelId: channelID,
        textChannelId: textChannelID,
        // optional configurations:
        selfDeaf: true, 
        selfMute: false, 
        volume: 100
    })
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
    console.log('Added song to queue', { song });
    console.log(player.playing, player.paused, player.queue)
    if (!player.playing && !player.paused && player.queue.tracks.length <= 1) {
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
    const song = player.queue.splice(index, 1)[0] as Track;
    if (!song) return;
    return song;
  }

  async search(query: string, requester: Member) {
    // get guild data
    const guildPlayer = this.getGuildData(requester.guild.id);
    if (!guildPlayer) return { error: true, message: 'Not connected to voice.' };
    // search for song'
    const results = await guildPlayer.search(query, requester);
    switch (results.loadType) {
      case 'error':
        return { error: true, message: results.exception?.message };
      case 'empty':
        return { error: true, message: 'No results found.' };
      case 'playlist':
        return { error: false, tracks: results.tracks, type: 'playlist' };
      case 'track':
        return { error: false, tracks: results.tracks, type: 'track' };
      case 'search':
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
    player.pause();
    return true;
  }
  async resume(guildID: string) {
    const player = this.getGuildData(guildID);
    if (!player) return null;
    if (!player.paused) return false;
    player.resume();
    return true;
  }
  async skip(guildID: string) {
    const player = this.getGuildData(guildID);
    if (!player) return null;
    let track = player.queue.current;
    player.skip();
    return track;
  }
  static getJSONOfTrack(track: UnresolvedTrack | Track) {
    const user = track.requester as User;
    return {
      title: track.info.title,
      url: track.info.uri,
      duration: track.info.duration,
      thumbnail: track.info.artworkUrl,
      author: track.info.author,
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
