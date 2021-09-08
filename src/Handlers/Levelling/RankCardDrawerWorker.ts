import fetch from "node-fetch";
import * as imagescript from "imagescript";
import * as fs from "fs";
import Jimp from "jimp";
import TetLib from "../../Helpers/TetLib";
import { spawn } from "child_process";
const fsp = fs.promises;
// let noto = fs.readFileSync("./assets/noto.otf");//read font files
let pop = fs.readFileSync("./assets/pop.ttf");
// let pop = fs.readFileSync("./assets/ubuntu.ttf");
/** @type {String,Image} */
const pfpCache = new Map();
async function getPFP(avatar: string) {
	if (pfpCache.has(avatar))
		return pfpCache.get(avatar).clone();
	let pfp = await fetch(avatar);
	let img = (await Image.decode(await pfp.buffer()));
	pfpCache.set(avatar, img.clone());
	setTimeout(() => {
		pfpCache.delete(avatar);
	}, 1000 * 60 * 1200);
	return img;
}
// const config = {
// 	"font": {
// 		"sizes":
// 			[20, 32, 64, 80],
// 		"active":
// 			noto
// 	},
// 	"pfp": {
// 		"rendering": {
// 			"sidelength":
// 				256,
// 			"edgeSmoothness":
// 				1.0
// 		}
// 	},
// 	"xpbar": {
// 		"progress": {
// 			"height":
// 				1,
// 			"leftmargin":
// 				0,
// 			"topmargin":
// 				318
// 		},
// 		"track": {
// 			"height":
// 				1,
// 			"leftmargin":
// 				-1,
// 			"topmargin":
// 				318
// 		}
// 	}
// };

// const activefont = config.font.active;

const { Image } = imagescript;
// let cachedNoto20: any;
// let cachedNoto32: any;
// let cachedNoto80: any;
// let cachedNoto64: any;
// (async () => {
// 	let allCachedFonts = await Image.cacheFontAtScales([config.font.sizes[0], config.font.sizes[1], config.font.sizes[2], config.font.sizes[3]], activefont);//font sizes
// 	cachedNoto20 = allCachedFonts[config.font.sizes[0]];
// 	cachedNoto32 = allCachedFonts[config.font.sizes[1]];
// 	cachedNoto64 = allCachedFonts[config.font.sizes[2]];
// 	cachedNoto80 = allCachedFonts[config.font.sizes[3]];
// 	console.log("Cache Noto Ready!");
// });
let cachedPop20: any;
let cachedPop32: any;
let cachedPop80: any;
let cachedPop64: any;
(async () => {
	let allCachedFonts = await Image.cacheFontAtScales([20, 32, 80, 64], pop) as { 32: any, 64: any, 20: any, 80: any };
	cachedPop32 = allCachedFonts[32];
	cachedPop80 = allCachedFonts[80];
	cachedPop64 = allCachedFonts[64];
	cachedPop20 = allCachedFonts[20];
	console.log("Cache Ready!");
})();
// let cachedNoto16;
// let cachedNoto24;
// let cachedNoto32;
// let cachedNoto40;
// (async () => {
// 	console.time("cacheFont");
// 	let allCachedFonts = await Image.cacheFontAtScales([16,24,32,48,],noto);
// 	// cachedNoto24 = await Image.cacheFont(24, noto);
// 	console.timeEnd("cacheFont");
// 	cachedNoto64 = allCachedFonts[48];
// 	cachedNoto32 = allCachedFonts[32];
// 	cachedNoto24 = allCachedFonts[24];
// 	cachedNoto16 = allCachedFonts[16];

// 	ready += 2;
// })();
let bgs = new Map();

class TimeTracker {
	time = 0;
	constructor() {
		this.time = Date.now();
	}
	start() {
		this.time = Date.now();
	}
	logTime(label?: string) {
		let t = Date.now() - this.time;
		console.log(label, t);
		this.time = Date.now();
	}

}



//Load Assets
(async () => {
	let allfiles = await fsp.readdir("./assets/DazaiBgs");
	// fontMap.set("baloo", await fsp.readFile("./assets/baloo/Baloo-Regular.ttf"));
	for (let i = 0; i < allfiles.length; i++) {
		if (allfiles[i] === ".DS_Store" || allfiles[i].endsWith(".gif") || allfiles[i].endsWith(".mp4")) continue;
		let file = await Image.decode(fs.readFileSync(`./assets/DazaiBgs/${allfiles[i]}`)).catch(er => console.trace(er, "ER!"));
		bgs.set(`./assets/DazaiBgs/${allfiles[i]}`, file);
	}
})();
const sleep = (delay: number) => new Promise((resolve) => setTimeout(resolve, delay));
let queue = [] as { type: number, data: [number, number, number, string, string, number, number, number, number, string, string, string, boolean, string], key: string }[];
process.on("message", (data) => {
	queue.push(JSON.parse(data));
});
async function getBG(path: string) {
	return (await bgs.get(path) ? bgs.get(path).clone() : Image.decode(await fsp.readFile(path)));
}


async function generateTetCard(level: number, xp: number, next: number, currentFormatted: string, nextFormatted: string, colorschemeR: number, colorschemeG: number, colorschemeB: number, rank: number, avatar: string, bgimg: string, name: string, writeOut: boolean) {
	let tt = new TimeTracker();
	tt.start();
	let base = await getBG(bgimg);
	base = base.clone();
	base.resize(1024, 340);
	tt.logTime("base resized");
	let pfp = await getPFP(avatar);
	tt.logTime("fetched pfp");
	if (pfp.height < 256) pfp.resize(256, 256);
	pfp = pfp.cropCircle(false, 0.05);
	tt.logTime("resized pfp");
	base.composite(pfp, 40, Math.round(base.height / 2) - Math.round(pfp.height / 2));
	tt.logTime("composited pfp");
	let rankLvl = await Image.renderTextFromCache(cachedPop32, `Rank ${rank}`, Jimp.rgbaToInt(255, 255, 255, 255));
	tt.logTime("rankText rendered");
	let lvl = await Image.renderTextFromCache(cachedPop80, `Level ${level}`, Jimp.rgbaToInt(255, 255, 255, 255));
	tt.logTime("levelText rendered");
	// let rect = 
	let text = await Image.renderTextFromCache(cachedPop64, name, Jimp.rgbaToInt(colorschemeR, colorschemeG, colorschemeB, 255));
	tt.logTime("usernameText rendered");
	// fs.writeFileSync("test2.png",await text.encode());
	let lvlDetails = await Image.renderTextFromCache(cachedPop20, `${currentFormatted} / ${nextFormatted} XP`, Jimp.rgbaToInt(255, 255, 255, 255));
	tt.logTime("xpCurrent rendered");
	base.composite(rankLvl, (pfp.width + 50), 60);
	tt.logTime("rankText composited");
	base.composite(lvl, (pfp.width + 50), 80);
	tt.logTime("levelText composited");
	base.composite(text, (pfp.width + 50), 164);
	tt.logTime("usernameText composited");
	xp = xp || next * 0.0009765625;
	if (xp / next > 1)
		xp = next;
	console.log(xp, next);
	let xpBar = new Image(Math.max(xp * 1024 / next, 1), 30);
	let color = Image.colorToRGBA(pfp.averageColor());
	color[3] = 100;
	base.drawBox(0, 320, 1024, 30, Image.rgbaToColor(color[0], color[1], color[2], color[3]));
	tt.logTime("xpBar rendered");
	xpBar.fill(Jimp.rgbaToInt(colorschemeR, colorschemeG, colorschemeB, 255));
	tt.logTime("xpBar filled");
	base.composite(xpBar, 0, 318);
	tt.logTime("xpBar composited");
	base.composite(lvlDetails, 950 - (9 * `${currentFormatted} / ${nextFormatted} XP`.length), 290);
	tt.logTime("xpCurrent rendered");
	let temp = "./temp/" + TetLib.genID(10) + ".png";
	base.resize(1024, 340);
	if (writeOut) {
		await fsp.writeFile(temp, await base.encode(3)).catch(er => console.error(er));
	}
	let res = !writeOut && await base.encodeJPEG(85);
	tt.logTime("image returned");
	return writeOut ? temp : res;
}

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

async function generateCardData(level: number, xp: number, next: number, currentFormatted: string, nextFormatted: string, colorschemeR: number, colorschemeG: number, colorschemeB: number, rank: number, avatar: string, bgimg: string, name: string, writeOut: boolean, design: string) {
	const data: [number, number, number, string, string, number, number, number, number, string, string, string, boolean] =
		[level, xp, next, currentFormatted, nextFormatted, colorschemeR, colorschemeG, colorschemeB, rank, avatar, bgimg, name, writeOut]
	return {
		data: design === "tetDesign" ? await generateTetCard(...data) : null,
		type: "jpeg"
	}
}
async function generateGIFCard(level: number, xp: number, next: number, currentFormatted: string, nextFormatted: string, colorschemeR: number, colorschemeG: number, colorschemeB: number, rank: number, avatar: string, bgimg: string, name: string, _: boolean, design: string) {
	return new Promise(async (res, _) => {
		let temp2 = "./temp/" + TetLib.genID(12) + ".gif";
		let blankPath = (await generateCardData(level, xp, next, currentFormatted, nextFormatted, colorschemeR, colorschemeG, colorschemeB, rank, avatar, "./assets/jimpStuff/fullBlankBG.png", name, true, design)).data;
		let ffmpegCMD = spawn(require("ffmpeg-static"), ["-i", bgimg, "-i", blankPath, "-filter_complex", "overlay=0:0", "-pix_fmt", "yuv420p", "-c:a", "copy", temp2]);
		ffmpegCMD.on("close", async (_) => {
			await fsp.unlink(blankPath);
			res({ data: (await fsp.readFile(temp2)), type: "gif" });
			fsp.unlink(temp2);
		});
	}).catch(console.trace);

	// return temp2;
}

//async function generateCard({ username, pfp, bgPath, color, bal, bio }) {
//	while (ready < 4) {
//		await sleep(1);
//	}
//	let image = bgs.get(bgPath).clone();
//	let pfpi = await Image.decode(await (await fetch(pfp)).buffer());
//	if (pfpi.width !== 256 || pfpi.height !== 256)
//		pfpi.resize(256, 256);
//	// pfpi.roundCorners(10);
//	image.composite(pfpi, 42, 42);
//	let usernameTxt = await Image.renderTextFromCache(cachedNoto64, username, Image.rgbToColor(...color));
//	let bioimg = await Image.renderTextFromCache(cachedNoto24, bio, Image.rgbToColor(255, 255, 255), 438, true);
//	// let animated = new Image(512,128);
//	usernameTxt.crop(0, 0, 388, usernameTxt.height);
//	image.composite(bioimg, 288 + 42, 128)
//	image.composite(usernameTxt, 288 + 42, 42);
//	let divider = new Image(3, 256);
//	divider.fill(Image.rgbToColor(10, 10, 10));

//	image.composite(divider, 750, 42);
//	image.composite(ecoTitle, 848, 42);
//	image.composite(moneyIcon, 785, 100);
//	let balance = await Image.renderTextFromCache(cachedNoto24, `「${nFormatter(bal)}」DC`,Image.rgbToColor(...color));
//	image.composite(balance, 825, 97);
//	fs.writeFileSync("./test.png", await image.encode(9));
//}

// queue.push({
// 	type: 1,
// 	data: [55, 12500, 20340, "12.5k", "20.34k", 255, 255, 255, 1, "https://cdn.discordapp.com/avatars/678335216154181666/41b2df16f7cf60d69739a6307a80cb99.png?size=256", "./assets/DazaiBgs/spacegray.png", "Grify The Maid", true,"tet"]
// });
(async () => {
	// eslint-disable-next-line no-constant-condition
	while (true) {
		while (queue.length == 0) {
			await sleep(10);
		}
		let item = queue.shift();
		let type = [generateGIFCard, generateCardData,][~~item!.type];
		let path = await type(...item!.data).catch(er => console.trace(er));
		process.send!({ key: item!.key, data: path }!);
		// abc.substring(1,abc.length-1)
	}
})();
