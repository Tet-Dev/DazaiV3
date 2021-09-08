import { ChildProcess, fork } from "child_process";
import { Player, Queue, Track } from "erela.js";
import { User } from "eris";
// import { join } from "path";
import env from "../../env";
import TetLib from "../../Helpers/TetLib";
let musicWorkers: ChildProcess[];

const musicMap = new Map();
export default class MusicDrawer {
  static async generateUpNextCard(track: Track, queue: Queue,) {
    let resData = await new Promise((res) => {
      let randID = TetLib.genID(50);
      musicMap.set(randID, res);
      const requester = track.requester as User;
      const displayName = `${requester.username}#${requester.discriminator}`;
      track.thumbnail
      musicWorkers[Math.floor(Math.random() * musicWorkers.length)].send(JSON.stringify({
        type: 1,
        data: [track, displayName, queue.map(x => x), track.displayThumbnail("maxresdefault")],
        key: randID
      }));
    });
    let uint = (new Uint8Array(Object.values(resData as any)));
    let buffer = Buffer.alloc(uint.byteLength);
    for (let i = 0; i < buffer.length; ++i) {
      buffer[i] = uint[i];
    }
    return buffer;
  }
  static init() {
    musicWorkers = [];
    for (let i = 0; i < env.MusicDrawers; i++) {
      musicWorkers.push(

        fork(
          'src/Handlers/Music/MusicDrawerWorker.ts'
          , []
          , {
            execArgv: ['-r', 'ts-node/register']
          }
        )
      );
      musicWorkers[i].on("message", async (m) => {
        musicMap.get(m.key)(m.data);
        musicMap.delete(m.key);
      });
    }
  }
  static async generateNowPlayingCard(player: Player) {
    let resData = await new Promise((res) => {
      let randID = TetLib.genID(50);
      musicMap.set(randID, res);
      let requester = player.queue.current?.requester as User;
      musicWorkers[Math.floor(Math.random() * musicWorkers.length)].send(JSON.stringify({
        type: 0,
      
        data: [player.queue.current, player.position, `${requester.username}#${requester.discriminator}`,
        // @ts-ignore
        player?.queue?.current && player.queue.current.displayThumbnail("maxresdefault") || ""],
        key: randID
      }));
    });
    let uint = (new Uint8Array(Object.values(resData as any)));
    let buffer = Buffer.alloc(uint.byteLength);
    for (let i = 0; i < buffer.length; ++i) {
      buffer[i] = uint[i];
    }
    return buffer;
  }
};