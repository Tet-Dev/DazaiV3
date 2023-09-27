// @ts-nocheck

import * as imagescript from 'imagescript';
//  '../../types/external/ImageScript';
import nfetch from '../FixedNodeFetch';
import Jimp from 'jimp';
import sharp from 'sharp';
import { readFileSync } from 'fs';
const { Image } = imagescript;
const inter400 = readFileSync('assets/fonts/inter/Inter-Regular.ttf');
const inter500 = readFileSync('assets/fonts/inter/Inter-Medium.ttf');
const inter600 = readFileSync('assets/fonts/inter/Inter-SemiBold.ttf');
const inter900 = readFileSync('assets/fonts/inter/Inter-Black.ttf');
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

async function generateBaseCard(data: {
  title: string;
  author: string;
  requester: string;
  thumbnail: string;
  durationtxt: string;
}) {
  const { title, author, thumbnail, durationtxt } = data;
  const canvas = new Image(1024, 420);
  const imgBuffer = await nfetch(
    thumbnail
  ).then(res => res.buffer()).catch(er=>{console.log("Error fetching",er);null});
  const processedBuffer = thumbnail.match(/\.webp/) ? await sharp(imgBuffer).jpeg().toBuffer() : imgBuffer;
  // console.log('Got thumbnail', data);
  const img = (await imagescript.decode(processedBuffer)) as imagescript.Image;
  // console.log('Decoded thumbnail', data);
  // img.resize(480, Image.RESIZE_AUTO);
  // crop a square form the center
  img.crop(
    Math.floor((img.width - img.height) / 2),
    0,
    Math.min(img.width, img.height),
    Math.min(img.width, img.height)
  );
  const bgImg = img.clone();
  // console.log('Cloned thumbnail', data);
  bgImg.resize(1024, Image.RESIZE_AUTO);
  const blurBg = (await imagescript.decode(
    await (await Jimp.read(Buffer.from(await bgImg.encode())))
      .blur(25)
      .getBufferAsync(Jimp.MIME_PNG)
  )) as imagescript.Image;
  // console.log('Blurred thumbnail', data);

  // console.log('Resized thumbnail', data);
  img.resize(256, 256);
  img.roundCorners(42);
  // blurBg.crop(0, 240 - blurBg.height / 2, 1024, 420);
  // blurBg.roundCorners(64);
  //center y axis
  canvas.composite(blurBg, 0, 240 - blurBg.height / 2);
  canvas.composite(
    new Image(1024, 420).fill(Image.rgbaToColor(0, 0, 0, 180)),
    0,
    0
  );
  canvas.composite(img, 48, 82);
  // console.log('Composited thumbnail', data);
  const layout = new imagescript.TextLayout({
    maxWidth: 598,
    wrapHardBreaks: true,
    wrapStyle: 'word',
  });
  const titleText = await Image.renderText(
    inter900,
    40,
    title,
    Image.rgbToColor(255, 255, 255),
    layout
    // imagescript
  );
  const durationText = await Image.renderText(
    inter600,
    32,
    durationtxt,
    Image.rgbToColor(255, 255, 255),
    layout
    // Image.WRAP_STYLE_WORD
  );
  const authorText = await Image.renderText(
    inter500,
    24,
    author,
    Image.rgbToColor(255, 255, 255),
    layout
    // Image.WRAP_STYLE_WORD
  );
  const requesterText = await Image.renderText(
    inter400,
    20,
    `${data.requester}`,
    Image.rgbaToColor(255, 255, 255, 128),
    layout
    // Image.WRAP_STYLE_WORD
  );
  // console.log('Rendered requester', data);
  canvas.composite(titleText, 346, 82);
  canvas.composite(durationText, 346, 264);
  canvas.composite(authorText, 346, 312);
  canvas.composite(requesterText, 346, 74 - requesterText.height);
  // canvas.composite(requesterText, 943 - requesterText.width, 264+(durationText.height-requesterText.height)/2);

  // console.log('Composited text', data);
  return { canvas, img };
}
async function generateNextSongCard(data: {
  title: string;
  author: string;
  requester: string;
  thumbnail: string;
  duration: number;
  nonce: string;
}) {
  // console.log('Generating base card', data);
  const res = await generateBaseCard({
    ...data,
    durationtxt: SecsToFormat(data.duration / 1000),
  });
  res.canvas.encode(3).then((res: Uint8Array) => {
    // console.log('Sending next song card', data);
    process.send!({ type: 'nextsong', nonce: data.nonce, data: res });
  });
}
async function generateNowPlayingCard(data: {
  title: string;
  author: string;
  requester: string;
  thumbnail: string;
  duration: number;
  played: number;
  nonce: string;
}) {
  const res = await generateBaseCard({
    ...data,
    durationtxt: `${SecsToFormat(data.played / 1000)} / ${SecsToFormat(
      data.duration / 1000
    )}`,
  });
  const progressBar = new Image(1024, 4);
  progressBar.fill(0xffffff);
  const progress = new Image(
    Math.floor((data.played / data.duration) * 1024),
    4
  );
  progress.fill(await res.img.dominantColor(true, true, 2));
  progressBar.composite(progress, 0, 0);
  res.canvas.composite(progressBar, 0, 416);
  res.canvas.encode(3).then((res: Uint8Array) => {
    process.send!({ type: 'nowplaying', nonce: data.nonce, data: res });
  });
}
const queue = [] as any[];
process.on('message', async (msg: any) => {
  queue.push(msg);
});
(async () => {
  // eslint-disable-next-line no-constant-condition
  while (true) {
    while (queue.length == 0) {
      await new Promise(resolve => setTimeout(resolve, 10));
    }

    let item = queue.shift();
    if (item.type === 'nextsong') {
      await generateNextSongCard(item.data);
    } else if (item.type === 'nowplaying') {
      await generateNowPlayingCard(item.data);
    }
    // abc.substring(1,abc.length-1)
    //Parse args
  }
})();
