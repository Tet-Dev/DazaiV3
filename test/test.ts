import { existsSync, mkdirSync, readFileSync } from 'fs';
import { lstat, readFile, readdir } from 'fs/promises';
import { MongoClient } from 'mongodb';
import { dirname } from 'path';
import { env } from '../src/env';
import sharp from 'sharp';
// //@ts-ignore
// async function readAllImages(dir: string) {
//   let dirContents = await readdir(dir);
//   return await Promise.all(
//     dirContents.map(async (file) => {
//       if ((await lstat(`${dir}/${file}`)).isDirectory()) {
//         return await readAllImages(`${dir}/${file}`);
//       }
//       return `${dir}/${file}`;
//     })
//   );
// }
// async function main() {
//   const cardsP = readAllImages('cards') as Promise<string[]>;
//   const cards = (await cardsP).flat(99);
//   console.log(cards);
//   for (const cardInd in cards) {
//     const card = cards[cardInd];
//     // check for image extension
//     if (!card.match(/\.(png|jpg|jpeg|gif)/)) continue;
//     console.log(card);
//     const buffer = await readFile(card);
//     const img = await sharp(buffer, {
//         animated: `${card}`.match(/\.gif/) ? true : false,
//     }).webp();
//     const output = `${card.replace('cards/','cards3/').replace(/\.(png|jpg|jpeg|gif)/,'')}.webp`
//     // check if directory exists
//     // if not, create it
//     if (!existsSync(dirname(output))) {
//         mkdirSync(dirname(output), { recursive: true });
//     }

//     await img.toFile(output);
//     console.log(`Converted ${card}`,output);
//   }
// }
// // main();
// async function name() {
//     const sh = await sharp(readFileSync('test.webp'),{"animated":true});
//     const xiao = await sharp(readFileSync('xiao.webp'),{"animated":true});
//     const md = await sh.metadata();
//     console.log(md.pages);
//     const xiaoMD = await xiao.metadata();
//     console.log(xiaoMD.pages);

// }
// name()


const M = new MongoClient(env.MongoURL);
M.connect();
async function u() {
    const all = await M.db("Guilds").collection('customCards').find({}).toArray() as any[];
    for (const card of all) {
        console.log(card);
        card.url = card.url.replace('cards/','cards3/').replace(/\.(png|jpg|jpeg|gif)/,'')+'.webp';
        await M.db("Guilds").collection('customCards').updateOne({_id:card._id},{$set:card});
        console.log(card.name);
    }
}
u();