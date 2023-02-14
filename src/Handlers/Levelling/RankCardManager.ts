import { ChildProcess, fork } from 'child_process';
import { Member } from 'eris';
import path, { join } from 'path';
export type RankCardGenerationDataBundle = {
  username: string;
  discriminator: string;
  avatar: string;
  level: number;
  xp: number;
  xpToNext: number;
  rank: number;
  background?: string;
};
export class RankCardManager {
  static instance: RankCardManager;
  static getInstance(): RankCardManager {
    if (!RankCardManager.instance)
      RankCardManager.instance = new RankCardManager();
    return RankCardManager.instance;
  }
  jobMap: Map<string, (data: { buffer: Buffer; type: string }) => void> =
    new Map();
  workers: ChildProcess[] = [];
  nextWorker = 0;
  constructor() {
    this.jobMap = new Map();
    this.init();
  }
  init(count?: number) {
    for (let i = 0; i < (count || env.RankCardDrawers || 2); i++) {
      const worker = fork(join(__dirname, '../Workers/RankCardWorker'), [
        // '-r',
        // 'ts-node/register',
      ]);
      worker.on('message', (d) => {
        const data = d as {
          nonce: string;
          buffer: Uint8Array;
          type: 'jpg' | 'gif';
        };
        // console.log('Got message', { data });
        let uint = new Uint8Array(Object.values(data.buffer));
        let buffer = Buffer.alloc(uint.byteLength);
        for (let i = 0; i < buffer.length; ++i) {
          buffer[i] = uint[i];
        }
        const cb = this.jobMap.get(data.nonce);

        // console.log({ cb });
        if (cb) cb({ buffer, type: data.type });
      });
      this.workers.push(worker);
      worker.on('exit', (n, s) => {
        this.workers.splice(this.workers.indexOf(worker), 1);
        this.init(1);
        console.log('Worker died, restarting', n, s);
      });
      worker.on('error', (e) => {
        console.log('Worker error', e);
      });
    }
  }
  getRankCardImage(data: RankCardGenerationDataBundle) {
    return new Promise((res) => {
      const nonce = (Math.random() * 1000000000).toString(36);
      this.jobMap.set(nonce, res);
      console.log('Sending job to worker', nonce);
      this.workers[this.nextWorker].send({
        nonce,
        data,
      });
      this.nextWorker++;
      if (this.nextWorker >= this.workers.length) this.nextWorker = 0;
    }) as Promise<{ buffer: Buffer; type: string }>;
  }
}
