import * as imagescript from 'imagescript';
//  '../../types/external/ImageScript';
import nfetch from '../FixedNodeFetch';
import Jimp from 'jimp';
import { readFileSync, writeFileSync } from 'fs';
import { RankCardGenerationDataBundle } from 'Handlers/Levelling/RankCardManager';
import { spawn } from 'child_process';
import ffmpeg from 'ffmpeg-static';
import { Readable } from 'stream';
import { readFile, unlink, writeFile } from 'fs/promises';
const genID = (length: number) => {
  var result = '';
  var characters =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  var charactersLength = characters.length;
  for (var i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
};

function toArrayBuffer(buffer: Buffer) {
  const arrayBuffer = new ArrayBuffer(buffer.length);
  const view = new Uint8Array(arrayBuffer);
  for (let i = 0; i < buffer.length; ++i) {
    view[i] = buffer[i];
  }
  return arrayBuffer;
}
const { Image } = imagescript;
const inter400 = readFileSync('assets/fonts/inter/Inter-Regular.ttf');
const inter500 = readFileSync('assets/fonts/inter/Inter-Medium.ttf');
const inter600 = readFileSync('assets/fonts/inter/Inter-SemiBold.ttf');
const inter700 = readFileSync('assets/fonts/inter/Inter-Bold.ttf');
const inter800 = readFileSync('assets/fonts/inter/Inter-ExtraBold.ttf');
const pop = readFileSync('assets/pop.ttf');
// const inter400Print = Image.cacheFont(20, inter400).then((font: any) => {
//   console.log('Cached inter400');
//   return font;
// });
// const inter500Print = Image.cacheFont(24, inter500).then((font: any) => {
//   console.log('Cached inter500');
//   return font;
// });
// const inter600Print = Image.cacheFont(32, inter600).then((font: any) => {
//   console.log('Cached inter600');
//   return font;
// });
// const inter900Print = Image.cacheFont(48, inter900).then((font: any) => {
//   console.log('Cached inter900');
//   return font;
// });

const backgroundCacher = new Map<string, Buffer>();

const getBackgroundBuffer = async (url: string) => {
  if (backgroundCacher.has(url)) {
    return backgroundCacher.get(url)!;
  }
  const imgBuffer = await nfetch(url).then((res) => res.buffer());
  // clone imgBuffer so it can be cached
  backgroundCacher.set(url, imgBuffer);
  // delete cached image after 1 day or if map has more than 1000 entries
  setTimeout(() => {
    backgroundCacher.delete(url);
  }, 1000 * 60 * 60 * 24);
  return imgBuffer;
};

function SecsToFormat(str: number) {
  let sec_num = str;
  let hours = Math.floor(sec_num / 3600);
  let minutes = Math.floor((sec_num - hours * 3600) / 60);
  let seconds = sec_num - hours * 3600 - minutes * 60;

  return (
    (hours > 0 ? hours.toString().padStart(2, '0') + ':' : '') +
    minutes.toString().padStart(2, '0') +
    ':' +
    seconds.toString().padStart(2, '0')
  );
}

async function generateOverlay(data: RankCardGenerationDataBundle) {
  const { username, discriminator, avatar, level, xp, xpToNext, rank } = data;
  const canvas = new Image(1024, 340);
  // canvas.fill(Jimp.rgbaToInt(0, 0, 0, 80));
  let time = Date.now();
  const imgBuffer = await nfetch(avatar).then((res) => res.buffer());
  const pfp = (await imagescript.decode(imgBuffer, true)) as imagescript.Image;
  console.log('PFP', Date.now() - time);
  pfp.resize(224, 224);
  pfp.cropCircle(true, 0);
  const blackout = new Image(982, 298);

  blackout.fill(Jimp.rgbaToInt(21, 21, 21, 180));
  let progressBar = new Image(~~((xp / xpToNext) * 982), 8);
  progressBar.fill(Jimp.rgbaToInt(255, 255, 255, 255));
  let progressBarBg = new Image(982, 8);
  progressBarBg.fill(Jimp.rgbaToInt(0, 0, 0, 200));
  blackout.composite(progressBarBg, 0, 298 - 8);
  blackout.composite(progressBar, 0, 298 - 8);
  blackout.roundCorners(12);
  canvas.composite(blackout, 24, 24);
  canvas.composite(pfp, 58, 58);
  console.log('BlackoutComposit', Date.now() - time);
  time = Date.now();
  let rankImg = await Image.renderText(
    pop,
    32,
    `RANK ${rank}`,
    Jimp.rgbaToInt(255, 255, 255, 255)
  );
  let lvlImg = await Image.renderText(
    pop,
    64,
    `Lv. ${level}`,
    Jimp.rgbaToInt(255, 255, 255, 255)
  );
  let xpImg = await Image.renderText(
    pop,
    16,
    `${xp} / ${xpToNext} XP`,
    Jimp.rgbaToInt(255, 255, 255, 255)
  );
  const layout = new imagescript.TextLayout({
    maxWidth: 653,
    wrapStyle: 'word',
    wrapHardBreaks: true,
  });
  let nameImg = await Image.renderText(
    pop,
    48,
    `${username}`,
    Jimp.rgbaToInt(255, 255, 255, 255),
    layout
  );
  let discImg = await Image.renderText(
    pop,
    32,
    `#${discriminator}`,
    Jimp.rgbaToInt(200, 200, 200, 255)
  );
  console.log('TextRender', Date.now() - time);
  time = Date.now();

  // create Data Canvas
  const dataCanvas = new Image(
    684,
    nameImg.height + lvlImg.height + rankImg.height - 12 * 3
  );
  // create Name Canvas
  const nameCanvas = new Image(
    nameImg.width + 6 + discImg.width,
    nameImg.height
  );
  nameCanvas.composite(nameImg, 0, 0);

  if (nameImg.width + 6 + discImg.width < 684) {
    nameCanvas.composite(
      discImg,
      nameImg.width + 6,
      nameCanvas.height - discImg.height - 12
    );
  }
  dataCanvas.composite(rankImg, 0, -6);
  dataCanvas.composite(lvlImg, 0, rankImg.height - 12);
  dataCanvas.composite(nameCanvas, 0, rankImg.height + lvlImg.height - 24);
  canvas.composite(dataCanvas, 316, 170 - dataCanvas.height / 2);
  canvas.composite(xpImg, 1024 - 42 - xpImg.width, 298 - xpImg.height);
  console.log('Compositing', Date.now() - time);
  return canvas;
}
async function generateRankCard(data: RankCardGenerationDataBundle) {
  console.log('Generating rank card');
  const [overlay, canvas] = await Promise.all([
    await generateOverlay(data),
    data.background
      ? data.background.endsWith('.gif')
        ? await imagescript.decode(await getBackgroundBuffer(data.background))
        : await imagescript.decode(await getBackgroundBuffer(data.background))
      : new Image(1024, 340).fill(Jimp.rgbaToInt(40, 40, 40, 255)),
  ]);
  console.log('Donwloaded background', data.background);
  if (data.background?.match(/\.gif$/)) {
    const gif = canvas as imagescript.GIF;
    for (let frame of gif) {
      frame.composite(overlay, 0, 0);
    }
    let time = Date.now();
    const encoded = await gif.encode(80);
    console.log('Encoded gif', Date.now() - time);
    return {
      buffer: encoded,
      type: 'gif',
    };
    // let timeTest = Date.now();
    // const tempRandomFile = `./temp/${genID(40)}.png`;
    // const tempGif = `./temp/${genID(40)}.gif`;

    // let tempOutput = `./temp/${genID(40)}.gif`;
    // await Promise.all([
    //   writeFile(tempGif, await getBackgroundBuffer(data.background)),
    //   writeFile(tempRandomFile, await overlay.encode(1)),
    // ]);
    // console.log('Wrote files', Date.now() - timeTest);
    // timeTest = Date.now();
    // // sleep for 2000 second to make sure the files are written
    // if (!ffmpeg) throw new Error('FFMPEG not found');
    // let ffmpegCMD = spawn(ffmpeg, [
    //   '-i',
    //   tempGif,
    //   '-i',
    //   tempRandomFile,
    //   '-filter_complex',
    //   'overlay=0:0',
    //   // '-pix_fmt',
    //   // 'yuv420p',
    //   '-c:a',
    //   'copy',
    //   tempOutput,
    // ]);
    // // on error
    // ffmpegCMD.stderr.on('data', (data) => {
    //   console.log(`stderr: ${data}`);
    // });
    // // on close
    // ffmpegCMD.on('close', (code) => {
    //   console.log(`child process exited with code ${code}`);
    // });

    // const output = (await new Promise((res) => {
    //   ffmpegCMD.on('close', async (_) => {
    //     unlink(tempGif);
    //     unlink(tempRandomFile);
    //     console.log('FFMPEG done', Date.now() - timeTest);
    //     res(await readFile(tempOutput));
    //     // unlink(tempOutput);
    //   });
    // })) as Buffer;
    // console.log('FFMPEG done', Date.now() - timeTest, output);
    // // buffer to uint8array

    // return {
    //   buffer: new Uint8Array(output),
    //   type: 'gif',
    // };
  }
  (canvas as imagescript.Image).composite(overlay, 0, 0);
  return {
    buffer: await (canvas as imagescript.Image).encodeJPEG(90),
    type: 'jpg',
  };
  // check if
}

const queue = [] as {
  nonce: string;
  data: RankCardGenerationDataBundle;
}[];
process.on('message', async (msg: any) => {
  queue.push(msg);
});
let genSlots = 4;
(async () => {
  // eslint-disable-next-line no-constant-condition
  while (true) {
    while (queue.length == 0) {
      await new Promise((resolve) => setTimeout(resolve, 10));
    }
    while (genSlots <= 0) {
      await new Promise((resolve) => setTimeout(resolve, 10));
    }

    if (genSlots >= 0) {
      (async () => {
        genSlots--;
        let item = queue.shift()!;
        console.log('Processing', item.nonce);
        const bufferData = await generateRankCard(item.data);
        process.send?.({
          nonce: item.nonce,
          ...bufferData,
        });
        console.log('Done', item.nonce);
        genSlots++;
      })();
    }

    // abc.substring(1,abc.length-1)
    //Parse args
  }
})();
