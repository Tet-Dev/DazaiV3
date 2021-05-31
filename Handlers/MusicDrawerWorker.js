const fs = require("fs");
// const fsp = fs.promises;
const Jimp = require("jimp");
// const ytdl = require("ytdl-core");
const yn = require("youtube-node");
const yt = new yn;
yt.setKey(process.env.GOOGLEAPIKEY);

function getVideo(id) {
	// eslint-disable-next-line no-async-promise-executor
	return new Promise(async (reso, rej) => {
		yt.getById(id, (er, res) => {

			if (er)
				return rej(er);
			else
				return reso(res.items[0]);
		});
	});
}
// process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = "0";
function SecsToFormat(string) {
	var sec_num = parseInt(string, 10);
	var hours = Math.floor(sec_num / 3600);
	var minutes = Math.floor((sec_num - hours * 3600) / 60);
	var seconds = sec_num - hours * 3600 - minutes * 60;

	if (hours < 10) {
		hours = "0" + hours;
	}
	if (minutes < 10) {
		minutes = "0" + minutes;
	}
	if (seconds < 10) {
		seconds = "0" + seconds;
	}
	return (parseInt(hours) > 0 ? (hours + ":") : "") + minutes + ":" + seconds;
}
let noto = fs.readFileSync("noto.otf");
const imagescript = require("imagescript");
const fetch = require("node-fetch");

const { Image } = imagescript;
let cachedNoto24;
let cachedNoto32;
let cachedNoto40;
(async () => {
	cachedNoto24 = await Image.cacheFont(24, noto);
	cachedNoto32 = await Image.cacheFont(32, noto);
	cachedNoto40 = await Image.cacheFont(39, noto);
	console.log("Cache Ready!");
})();
const sleep = (delay) => new Promise((resolve) => setTimeout(resolve, delay));
let queue = [];
process.on("message", (data) => {
	queue.push(JSON.parse(data));
});
async function generateNowPlaying(dat) {
	let timeStart = dat[1];
	let dataOG = dat[0];

	let data = await getVideo(dataOG.info.identifier).catch(er => console.trace(er));
	// let requested = dat[2];
	let thumbnail;
	let tbuffer;
	let link = data.snippet.thumbnails.high.url;
	let thumbnail2 = await fetch(link.split("?")[0]);
	tbuffer = await thumbnail2.buffer();
	let spareBuffer = Buffer.from(tbuffer);
	thumbnail2 = await Image.decode(tbuffer);
	thumbnail = thumbnail2;
	let bgcopy = await thumbnail.clone();
	// bgcopy = cropImg(bgcopy);


	bgcopy = await Jimp.read(spareBuffer);
	bgcopy.blur(13);

	bgcopy = await Image.decode(await bgcopy.getBufferAsync(Jimp.MIME_PNG));
	let yScaleFactor = 1300 * bgcopy.height / bgcopy.width;
	bgcopy.resize(bgcopy.width / bgcopy.height * yScaleFactor, yScaleFactor);
	// x = Math.round(bgcopy.width-1024)/2
	bgcopy.crop(Math.round(bgcopy.width - 1024) / 2 > 0 ? Math.round(bgcopy.width - 1024) / 2 : 0, Math.round(bgcopy.height - 420) / 2 > 0 ? Math.round(bgcopy.height - 420) / 2 : 0, 1024, 420);
	let cover = new Image(1024, bgcopy.height * (1024 / bgcopy.width));
	cover.fill(Image.rgbaToColor(0, 0, 0, 127));
	bgcopy.composite(cover, 0, 0);
	// bgcopy = cropImg(bgcopy);
	thumbnail.crop(Math.round((thumbnail.width / 2) - ((thumbnail.height - 90) / 2)), 45, thumbnail.height - 90, thumbnail.height - 90);
	thumbnail.roundCorners(8);
	let newimage = new Image(1024, 420);
	let author = await Image.renderTextFromCache(cachedNoto24, data.snippet.channelTitle, Image.rgbToColor(255, 255, 255), 650, Image.WRAP_STYLE_WORD);
	let imgText = await Image.renderTextFromCache(cachedNoto40, data.snippet.title.substring(0, 120), Image.rgbToColor(255, 255, 255), 12000, Image.WRAP_STYLE_WORD);
	imgText.crop(0, 0, imgText.width > 940 ? 940 : imgText.width, imgText.height);
	let vidlen = SecsToFormat((Math.round(dataOG.info.length / 1000) || 0));
	let txtcolor = Image.colorToRGBA(thumbnail.dominantColor(true, true,));
	txtcolor = txtcolor.map(x => x + 60 > 255 ? 255 : x + 60);

	let duraText = await Image.renderTextFromCache(cachedNoto32, ` ${SecsToFormat(Math.round((Date.now() - timeStart) / 1000))} / ${vidlen}`, Image.rgbToColor(255, 255, 255), 450, Image.WRAP_STYLE_WORD);
	let requestedBy = await Image.renderTextFromCache(cachedNoto32, `${dat[2]}`, Image.rgbaToColor(txtcolor[0], txtcolor[1], txtcolor[2], txtcolor[3]), 646, Image.WRAP_STYLE_WORD);
	// newimage.lightness(0.5,true);
	let progressBar = new Image(Math.round((Date.now() - timeStart) * 1024 / (dataOG.info.length || 1)), 15);
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
async function generateUpNext(dat) {
	let dataOG = dat[0];
	let data = await getVideo(dataOG.info.identifier).catch(er => console.trace(er));
	console.log(`Generating card for ${data.snippet.title}`);
	let nextSongs = dat[2] || [];
	let thumbnail;
	let tbuffer;
	let link = data.snippet.thumbnails.high.url;
	let thumbnail2 = await fetch(link.split("?")[0]);
	tbuffer = await thumbnail2.buffer();
	let spareBuffer = Buffer.from(tbuffer);
	thumbnail2 = await Image.decode(tbuffer);
	thumbnail = thumbnail2;
	let bgcopy = await thumbnail.clone();

	bgcopy = await Jimp.read(spareBuffer);
	bgcopy.blur(13);
	console.log("Check 1 passed");
	bgcopy = await Image.decode(await bgcopy.getBufferAsync(Jimp.MIME_PNG));
	let yScaleFactor = 1300 * bgcopy.height / bgcopy.width;
	bgcopy.resize(bgcopy.width / bgcopy.height * yScaleFactor, yScaleFactor);
	bgcopy.crop(Math.round(bgcopy.width - 1024) / 2 > 0 ? Math.round(bgcopy.width - 1024) / 2 : 0, Math.round(bgcopy.height - 420) / 2 > 0 ? Math.round(bgcopy.height - 420) / 2 : 0, 1024, 420);
	let cover = new Image(1024, bgcopy.height * (1024 / bgcopy.width));
	cover.fill(Image.rgbaToColor(0, 0, 0, 127));
	bgcopy.composite(cover, 0, 0);
	thumbnail.crop(Math.round((thumbnail.width / 2) - ((thumbnail.height - 90) / 2)), 45, thumbnail.height - 90, thumbnail.height - 90);
	thumbnail.roundCorners(8);
	let newimage = new Image(1024, 420);
	let author = await Image.renderTextFromCache(cachedNoto24, data.snippet.channelTitle, Image.rgbToColor(255, 255, 255), 650, Image.WRAP_STYLE_WORD);
	let imgText = await Image.renderTextFromCache(cachedNoto40, data.snippet.title.substring(0, 120), Image.rgbToColor(255, 255, 255), 12000, Image.WRAP_STYLE_WORD);
	imgText.crop(0, 0, imgText.width > 940 ? 940 : imgText.width, imgText.height);
	let vidlen = SecsToFormat((Math.round(dataOG.info.length / 1000) || 0));
	let txtcolor = Image.colorToRGBA(thumbnail.dominantColor(true, true,));
	txtcolor = txtcolor.map(x => x + 60 > 255 ? 255 : x + 60);
	console.log("Check 2 passed");
	let duraText = await Image.renderTextFromCache(cachedNoto32, `Length: ${vidlen}`, Image.rgbToColor(255, 255, 255), 450, Image.WRAP_STYLE_WORD);
	let requestedBy = await Image.renderTextFromCache(cachedNoto24, `${dat[1]}`, Image.rgbaToColor(txtcolor[0], txtcolor[1], txtcolor[2], txtcolor[3]), 646, Image.WRAP_STYLE_WORD);
	let nextQueue = new Image(645, 127);
	nextQueue.fill(Image.rgbaToColor(0, 0, 0, 150));
	for (let i = 0; i < nextSongs.length; i++) {
		if (i == 2) {
			break;
		}
		console.log(nextSongs[i]);
		let tempImg = new Image(645, 63);
		let binfo = await getVideo(nextSongs[i].info.identifier);
		let ithumb = await fetch(binfo.snippet.thumbnails.standard.url);
		ithumb = await Image.decode(await ithumb.buffer());
		ithumb.crop(Math.round((ithumb.width / 2) - ((ithumb.height - 90) / 2)), 45, ithumb.height - 90, ithumb.height - 90);
		ithumb.resize(57, 57);
		let tText = await Image.renderTextFromCache(cachedNoto32, `#${i + 1}| ${SecsToFormat(Math.round(nextSongs[i].info.length / 1000))} | ${binfo.snippet.title.substring(0, 30)}`, Image.rgbToColor(255, 255, 255));
		tText.crop(0, 0, 550, tText.height);
		tempImg.composite(tText, 5, 12.5);
		tempImg.composite(ithumb, 580, 9);
		// nextQueue.roundCorners(8);
		nextQueue.composite(tempImg, 0, (i + 0.5) * 5 + i * 58 - 6.5);
	}
	console.log("Check 3 passed");
	thumbnail.resize(240, 240);
	newimage.composite(bgcopy, 0, 0);
	newimage.composite(thumbnail, 51, 51);
	newimage.composite(author, 51, 355);
	newimage.composite(requestedBy, 325, 90 - 72 + 14 + (imgText.height) / 2);
	newimage.composite(duraText, 326, 78 + 14);
	newimage.composite(imgText, 51, 300);
	newimage.roundCorners(15);
	console.log("Check 4 passed");
	newimage.composite(nextQueue, 327, 133 + 14);
	let encodeData = (await newimage.encode(3));
	console.log("Returning... ");
	return encodeData;
}
(async () => {
	// eslint-disable-next-line no-constant-condition
	while (true) {
		while (queue.length == 0) {
			await sleep(10);
		}

		let item = queue.shift();
		let type = item.type ? generateUpNext : generateNowPlaying;
		let path = await type(item.data).catch(er => console.trace(er));
		process.send({ key: item.key, data: path });
		// abc.substring(1,abc.length-1)
		//Parse args


	}
})();
