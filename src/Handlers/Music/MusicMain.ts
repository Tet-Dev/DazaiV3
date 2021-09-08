import { User } from 'eris';
import { Manager, VoicePacket, Player, Track, NodeOptions } from 'erela.js';
import tetGlobal from '../../tetGlobal';
import env from '../../env';
import MusicDrawer from './MusicDrawer';


function parseTime(seconds: number) {
  let hours = Math.floor(seconds / 3600);
  let minutes = Math.floor((seconds % 3600) / 60);
  seconds = seconds % 60;
  return `${hours}:${minutes}:${seconds}`;
}

export default class MusicHandler {
  Manager: Manager;
  static self: MusicHandler;
  guildMap: Map<String, Player>;
  constructor() {
    const bot = tetGlobal.Bot!;
    this.Manager = new Manager({
      nodes: JSON.parse(env.LavalinkNodes) as NodeOptions[],
      send: (id, payload) => {
        const guild = bot.guilds.get(id);
        if (!guild) return;
        guild.shard.sendWS(payload.op, payload.d);
      }
    })
    this.Manager.init(bot.user.id);
    MusicDrawer.init();
    this.guildMap = new Map();
    this.Manager.on('nodeConnect', node => {
      console.log(`Node '${node.options.identifier}' connected.`)
    })
    this.Manager.on('nodeError', (node, error) => {
      console.log(`Node '${node.options.identifier}' encountered an error: ${error.message}.`)
    })
    bot.on('rawWS', (d => {
      this.Manager.updateVoiceState(d as VoicePacket);
    }))
    this.Manager.on("trackStart", async (player, track) => {
      let imageBuffer = await MusicDrawer.generateUpNextCard(track, player.queue);
      await bot.createMessage(player.textChannel || "", "", {
        file: imageBuffer,
        name: "Dazai_UpNext.png"
      })
    });
  }
  static getGuildMap(guildID: string, voiceChannelID?: string, textChannelID?: string) {
    if (!this.self.guildMap.has(guildID)) {
      if (voiceChannelID && textChannelID) {
        this.self.guildMap.set(guildID, this.self.Manager.create({
          guild: guildID,
          voiceChannel: voiceChannelID,
          textChannel: textChannelID,
        }));
        this.self.guildMap.get(guildID)?.connect();
      }
      else {
        return null;
      }
    }
    let guildPlayer = this.self.guildMap.get(guildID);
    if (guildPlayer)
      return this.self.guildMap.get(guildID);
    return null;
  }
  static addSongToQueue(guildID: string, voiceChannelID: string, textChannelID: string, track: Track) {
    const player = MusicHandler.getGuildMap(guildID, voiceChannelID, textChannelID);
    player?.queue.add(track);
    if (!player?.playing && !player?.paused && !player?.queue.size) {
      player?.connect();

      player?.play();
      return;
    }
    else {
      tetGlobal.Bot!.createMessage(textChannelID, {
        embed: {
          color: 0x00FF00,
          title: `${track.title}`,
          description: `Author: ${track.author}\nLength: ${parseTime(track.duration)}`,
          footer: {
            text: `Song Added By ${(track.requester as User).username}#${(track.requester as User).discriminator} | ${player.queue.length} tracks in queue.`,
            icon_url: (track.requester as User).avatarURL,
          },
          url: track.uri
        }
      });
    }
  }
  static init() {
    this.self = new MusicHandler();
    tetGlobal.Logger.info("Music Handler Initialized!")
  }
}