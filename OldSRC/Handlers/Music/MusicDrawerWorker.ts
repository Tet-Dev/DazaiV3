// const fsp = fs.promises;
// const ytdl = require("ytdl-core");
import * as fs from "fs";
import Jimp from "jimp";
// yt.setKey(process.env.GOOGLEAPIKEY);

// function getVideo(id) {
// 	// eslint-disable-next-line no-async-promise-executor
// 	return new Promise(async (reso, rej) => {
// 		yt.getById(id, (er, res) => {

// 			if (er)
// 				return rej(er);
// 			else
// 				return reso(res.items[0]);
// 		});
// 	});
// }
// process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = "0";
// let noto = fs.readFileSync("./assets/noto.otf");
//Debug font
let ubuntuFont = fs.readFileSync("./assets/ubuntu.ttf");
import { Image } from "imagescript";
import fetch from "node-fetch";
import { Track, UnresolvedTrack } from "erela.js";
import TetLib from "../../Helpers/TetLib";

let cachedNoto24: any;
let cachedNoto32: any;
let cachedNoto40: any;
(async () => {
	let fonts = await Image.cacheFontAtScales([24, 32, 40], ubuntuFont) as { 32: any, 40: any, 24: any };
	cachedNoto32 = fonts[32];
	cachedNoto40 = fonts[40];
	cachedNoto24 = fonts[24];

})();
const sleep = (delay: number) => new Promise((resolve) => setTimeout(resolve, delay));
type QueueItem = { type: number, data: any[], key: string }
let queue = [] as QueueItem[];
process.on("message", (data) => {
	queue.push(JSON.parse(data));
});
async function generateNowPlaying(dat: [(Track | UnresolvedTrack | null), number, string,string]) {
	let currentSongPosition = dat[1];
	let dataOG = dat[0];

	let tbuffer;
	let link = dat[3] || dataOG?.thumbnail;

	tbuffer = await fetch(link?.split("?")[0] || "");
	let thumbnail = await Image.decode(tbuffer);
	/**
	 * @type {imagescript.Image}
	 */
	let bgcopy = await thumbnail.clone();
	bgcopy.resize(1536, Image.RESIZE_AUTO);
	let bgJimp = await Jimp.read(Buffer.from(await bgcopy.encode(3)));
	bgJimp.blur(8);
	bgcopy = await Image.decode(await bgJimp.getBufferAsync(Jimp.MIME_PNG));
	let yScaleFactor = 1300 * bgcopy.height / bgcopy.width;
	bgcopy.resize(bgcopy.width / bgcopy.height * yScaleFactor, yScaleFactor);
	bgcopy.crop(Math.round(bgcopy.width - 1024) / 2 > 0 ? Math.round(bgcopy.width - 1024) / 2 : 0, Math.round(bgcopy.height - 420) / 2 > 0 ? Math.round(bgcopy.height - 420) / 2 : 0, 1024, 420);
	let cover = new Image(1024, bgcopy.height * (1024 / bgcopy.width));
	cover.fill(Image.rgbaToColor(0, 0, 0, 127));
	bgcopy.composite(cover, 0, 0);
	thumbnail.crop(Math.round((thumbnail.width/2)-(thumbnail.height/2)),0,thumbnail.height,thumbnail.height);
	thumbnail.roundCorners(8);
	let newimage = new Image(1024, 420);
	let author = await Image.renderTextFromCache(cachedNoto24, dataOG?.author || "", Image.rgbToColor(255, 255, 255), 650, Image.WRAP_STYLE_WORD);
	let imgText = await Image.renderTextFromCache(cachedNoto40, dataOG?.title.substring(0, 120) || "", Image.rgbToColor(255, 255, 255), 12000, Image.WRAP_STYLE_WORD);
	imgText.crop(0, 0, imgText.width > 940 ? 940 : imgText.width, imgText.height);
	let vidlen = TetLib.parseTime((Math.round(dataOG?.duration!/1000|| 0) || 0));
	let txtcolor = Image.colorToRGBA(thumbnail.dominantColor(true, true,));
	txtcolor = txtcolor.map(x => x + 60 > 255 ? 255 : x + 60);

	let duraText = await Image.renderTextFromCache(cachedNoto32, ` ${TetLib.parseTime(Math.round(currentSongPosition / 1000))} / ${vidlen}`, Image.rgbToColor(255, 255, 255), 450, Image.WRAP_STYLE_WORD);
	let requestedBy = await Image.renderTextFromCache(cachedNoto32, `${dat[2]}`, Image.rgbaToColor(txtcolor[0], txtcolor[1], txtcolor[2], txtcolor[3]), 646, Image.WRAP_STYLE_WORD);
	// newimage.lightness(0.5,true);
	let progressBar = new Image(Math.round(currentSongPosition * 1024 / (dataOG?.duration!/1000 || 1)), 15);
	progressBar.fill(thumbnail.dominantColor(true, true));

	thumbnail.resize(240, 240);
	newimage.composite(bgcopy, 0, 0);
	newimage.composite(thumbnail, 51, 51);
	newimage.composite(author, 51, 355);
	newimage.composite(requestedBy, 325, 90 - 72 + 14 + (imgText.height) / 2);
	newimage.composite(duraText, 325, 78 + 14);
	newimage.composite(imgText, 51, 300);
	newimage.composite(progressBar, 0, 420 - 15);
	newimage.roundCorners(15);
	let encodeData = (await newimage.encode(3));
	return encodeData;

}
async function generateUpNext(dat: [Track, string, Track[],string]) {
	let dataOG = dat[0];
	let nextSongs = dat[2] || [];
	let tbuffer;
	let link = dat[3] || dataOG.thumbnail;
	tbuffer = await (await fetch(link! || "")).buffer();
	console.log(link);
	let thumbnail = await Image.decode(tbuffer);
	/**
	 * @type {imagescript.Image}
	 */
	let bgcopy = await thumbnail.clone();
	bgcopy.resize(1536, Image.RESIZE_AUTO);
	let bgJimp = await Jimp.read(Buffer.from(await bgcopy.encode(3)));
	bgJimp.blur(8);
	bgcopy = await Image.decode(await bgJimp.getBufferAsync(Jimp.MIME_PNG));
	let yScaleFactor = 1300 * bgcopy.height / bgcopy.width;
	bgcopy.resize(bgcopy.width / bgcopy.height * yScaleFactor, yScaleFactor);
	bgcopy.crop(Math.round(bgcopy.width - 1024) / 2 > 0 ? Math.round(bgcopy.width - 1024) / 2 : 0, Math.round(bgcopy.height - 420) / 2 > 0 ? Math.round(bgcopy.height - 420) / 2 : 0, 1024, 420);
	let cover = new Image(1024, bgcopy.height * (1024 / bgcopy.width));
	cover.fill(Image.rgbaToColor(0, 0, 0, 127));
	bgcopy.composite(cover, 0, 0);
	thumbnail.crop(Math.round((thumbnail.width/2)-(thumbnail.height/2)),0,thumbnail.height,thumbnail.height);
	thumbnail.roundCorners(8);
	let newimage = new Image(1024, 420);
	let author = await Image.renderTextFromCache(cachedNoto24, dataOG.author, Image.rgbToColor(255, 255, 255), 650, Image.WRAP_STYLE_WORD);
	let imgText = await Image.renderTextFromCache(cachedNoto40, dataOG.title.substring(0, 120), Image.rgbToColor(255, 255, 255), 12000, Image.WRAP_STYLE_WORD);
	imgText.crop(0, 0, imgText.width > 940 ? 940 : imgText.width, imgText.height);
	let vidlen = TetLib.parseTime((Math.round(dataOG.duration / 1000) || 0));
	let txtcolor = Image.colorToRGBA(thumbnail.dominantColor(true, true,));
	txtcolor = txtcolor.map(x => x + 60 > 255 ? 255 : x + 60);
	let duraText = await Image.renderTextFromCache(cachedNoto32, `Length: ${vidlen}`, Image.rgbToColor(255, 255, 255), 450, Image.WRAP_STYLE_WORD);
	let requestedBy = await Image.renderTextFromCache(cachedNoto24, `${dat[1]}`, Image.rgbaToColor(txtcolor[0], txtcolor[1], txtcolor[2], txtcolor[3]), 646, Image.WRAP_STYLE_WORD);

	let domColor = txtcolor.map(x => x > 30 ? x - 30 : 0);
	domColor[3] = 200;
	newimage.composite(bgcopy, 0, 0);
	if (nextSongs.length > 0) {
		let nextQueue = new Image(645, 127);
		nextQueue.fill(Image.rgbaToColor(
			domColor[0],
			domColor[1],
			domColor[2],
			domColor[3]
		));
		for (let i = 0; i < nextSongs.length; i++) {
			if (i == 2) {
				break;
			}
			let tempImg = new Image(645, 63);
			let songInfo = nextSongs[i];
			let ithumb = await Image.decode(await (await fetch(songInfo!.thumbnail || "")).buffer());
			ithumb.crop(Math.round((ithumb.width / 2) - ((ithumb.height - 90) / 2)), 45, ithumb.height - 90, ithumb.height - 90);
			ithumb.resize(57, 57);
			let tText = await Image.renderTextFromCache(cachedNoto32, `#${i + 1}| ${TetLib.parseTime(Math.round(songInfo.duration / 1000))} | ${songInfo.title.substring(0, 30)}`, Image.rgbToColor(255, 255, 255));
			tText.crop(0, 0, 550, tText.height);
			tempImg.composite(tText, 5, 12.5);
			tempImg.composite(ithumb, 580, 9);
			nextQueue.composite(tempImg, 0, (i + 0.5) * 5 + i * 58 - 6.5);
		}
		newimage.composite(nextQueue, 327, 133 + 14);
	}

	thumbnail.resize(240, 240);

	newimage.composite(thumbnail, 51, 51);
	newimage.composite(author, 51, 355);
	newimage.composite(requestedBy, 325, 90 - 72 + 14 + (imgText.height) / 2);
	newimage.composite(duraText, 326, 78 + 14);
	newimage.composite(imgText, 51, 300);
	newimage.roundCorners(15);

	let encodeData = (await newimage.encode(3));
	return encodeData;
}
(async () => {
	// eslint-disable-next-line no-constant-condition
	while (true) {
		while (queue.length == 0) {
			await sleep(10);
		}

		let item = queue.shift();
		let type = !!item!.type ? generateUpNext : generateNowPlaying;
		// @ts-ignore
		let path = await type(item.data).catch(er => console.trace(er));
		// @ts-ignore
		process.send({ key: item?.key, data: path });

	}
})();
