import { ChildProcess, fork } from 'child_process';
import { Player, Track } from 'erela.js';
import { Member } from 'eris';
import path, { join } from 'path';

export class MusicCardManager {
  static instance: MusicCardManager;
  static getInstance(): MusicCardManager {
    if (!MusicCardManager.instance)
      MusicCardManager.instance = new MusicCardManager();
    return MusicCardManager.instance;
  }
  jobMap: Map<string, (data: Buffer) => void> = new Map();
  workers: ChildProcess[] = [];
  constructor() {
    this.jobMap = new Map();
    this.init();
  }
  init(count?: number) {
    for (let i = 0; i < (count || env.MusicDrawers || 1); i++) {
      const worker = fork(join(__dirname, '../Workers/MusicCardWorker.ts'), [
        '-r',
        'ts-node/register',
      ]);
      worker.on('message', d => {
        const data = d as {
          type: 'nowplaying';
          nonce: string;
          data: Uint8Array;
        };
        // console.log('Got message', { data });
        let uint = new Uint8Array(Object.values(data.data));
        let buffer = Buffer.alloc(uint.byteLength);
        for (let i = 0; i < buffer.length; ++i) {
          buffer[i] = uint[i];
        }
        const cb = this.jobMap.get(data.nonce);

        console.log({ cb });
        if (cb) cb(buffer);
      });
      this.workers.push(worker);
      worker.on('exit', (n, s) => {
        this.workers.splice(this.workers.indexOf(worker), 1);
        this.init(1);
        console.log('Worker died, restarting', n, s);
      });
      worker.on('error', e => {
        console.log('Worker error', e);
      });
    }
  }
  getNowPlayingImage(player: Player) {
    return new Promise(res => {
      const nonce = (Math.random() * 1000000000).toString(36);
      this.jobMap.set(nonce, res);
      const track = player.queue.current;
      if (!track) return res(null);
      this.workers[~~(this.workers.length * Math.random())].send({
        type: 'nowplaying',
        nonce,
        data: {
          title: track.title,
          author: track.author,
          duration: track.duration,
          thumbnail: track.thumbnail,
          played: player.position,
          requester: track.requester,
        },
      });
    }) as Promise<Buffer | null>;
  }
  getUpNextImage(track: Track) {
    return new Promise(res => {
      const nonce = (Math.random() * 1000000000).toString(36);
      this.jobMap.set(nonce, res);
      if (!track) return res(null);
      this.workers[~~(this.workers.length * Math.random())].send({
        type: 'nextsong',
        data: {
          title: track.title,
          author: track.author,
          duration: track.duration,
          nonce,
          thumbnail: track.thumbnail,
          requester: `${(track.requester as Member).user.username}#${
            (track.requester as Member).user.discriminator
          }`,
        },
      });
    }) as Promise<Buffer | null>;
  }
}
