import * as imagescript from 'imagescript';
//  '../../types/external/ImageScript';
import nfetch from '../FixedNodeFetch';
import Jimp from 'jimp';
import { readFileSync, writeFileSync } from 'fs';
import { readFile } from 'fs/promises';
import { slanderGIFMap } from '../Fun/Slander/SlanderManager';
const { Image } = imagescript;
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

const dazaiPFPPromise = new Promise(async (res) => {
  const dazaiPFP = await nfetch(
    `https://cdn.discordapp.com/attachments/757863990129852509/1086049836794662972/dazai-1.png`
  );
  const dazaiPFPBuffer = await dazaiPFP.buffer();
  const dazaiPFPImage = (await imagescript.decode(
    dazaiPFPBuffer
  )) as imagescript.Image;
  dazaiPFPImage.opacity(0.3);
  res(dazaiPFPImage);
}) as Promise<imagescript.Image>;
async function getSlanderGIFBuffer(slanderGIF: string) {
  if (slanderGIFMap[slanderGIF as keyof typeof slanderGIFMap]) {
    slanderGIF = slanderGIFMap[slanderGIF as keyof typeof slanderGIFMap];
    return imagescript.decode(await readFile(slanderGIF), false);
  }
  if (slanderGIF.match(/https?:\/\/.+/)) {
    // if it's a link, download it
    const imgBuffer = await nfetch(slanderGIF).then((res) => res.buffer());
    return imagescript.decode(imgBuffer, false);
  }
}

async function generateSlander(title: string, slanderGIF: string) {
  const slander = (await getSlanderGIFBuffer(slanderGIF)) as imagescript.GIF;
  if (!slander) return;
  const layout = new imagescript.TextLayout({
    maxWidth: slander.width * 0.9,
    wrapStyle: 'word',
  });
  const renText = await Image.renderText(
    inter900,
    40,
    title,
    Jimp.rgbaToInt(255, 255, 255, 255),
    layout
  );
  const canvasText = new Image(slander.width, renText.height + 32);
  canvasText.fill(Jimp.rgbaToInt(21, 21, 21, 255));
  // center slanderText on canvas
  canvasText.composite(
    renText,
    (canvasText.width - renText.width) / 2,
    (canvasText.height - renText.height) / 2
  );
  const daz = await dazaiPFPPromise;
  const daz2 = daz.clone();
  daz2.resize(-1, slander.height * 0.15, Image.RESIZE_NEAREST_NEIGHBOR);
  let frameArr = [] as imagescript.Frame[];
  for (let i = 0; i < slander.length; i++) {
    const frame = new imagescript.Frame(
      slander.width,
      slander.height + canvasText.height,
      slander[i].duration
    );

    frame.composite(canvasText, 0, 0);
    frame.composite(slander[i], 0, canvasText.height);
    frame.composite(daz2, 0, frame.height - daz2.height);
    frameArr.push(frame);
  }

  const gif = new imagescript.GIF(frameArr, -1);
  return await gif.encode(95);

  // const canvas = new Image(slander.width, slander.height + canvasText.height);
  // canvas.composite(canvasText, 0, 0);
  // canvas.composite(slander, 0, canvasText.height);

  // return canvas.encode(90, {});
  // // check if slanderGIF is a keyword or a link
}
process.on('message', async (msg: any) => {
  await generateSlander(msg.title, msg.slanderGIF).then((res) => {
    process.send!({
      data: res,
      nonce: msg.nonce,
    });
  });
});
// (async () => {
//   // eslint-disable-next-line no-constant-condition
//   while (true) {
//     while (queue.length == 0) {
//       await new Promise((resolve) => setTimeout(resolve, 10));
//     }

//     let item = queue.shift();
//     if (item.type === 'nextsong') {
//       await generateNextSongCard(item.data);
//     } else if (item.type === 'nowplaying') {
//       await generateNowPlayingCard(item.data);
//     }
//     // abc.substring(1,abc.length-1)
//     //Parse args
//   }
// })();
