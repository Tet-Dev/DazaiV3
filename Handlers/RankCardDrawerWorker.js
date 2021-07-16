const fs = require("fs");
const fsp = fs.promises;
const Jimp = require("jimp");
// const ytdl = require("ytdl-core");
require("dotenv").config();
const { spawn } = require("child_process");
let time = Date.now();
function genID(length) {
	var result = "";
	var characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
	var charactersLength = characters.length;
	for (var i = 0; i < length; i++) {
		result += characters.charAt(Math.floor(Math.random() * charactersLength));
	}
	return result;
}
// process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = "0";

let noto = fs.readFileSync("noto.otf");//read font files
let pop = fs.readFileSync("pop.ttf");
const imagescript = require("imagescript");
const fetch = require("node-fetch");

const config = {
	"font": {
		"sizes":
			[20, 32, 64, 80],
		"active":
			noto
	},
	"pfp": {
		"rendering": {
			"sidelength":
				256,
			"edgeSmoothness":
				1.0
		}
	},
	"xpbar": {
		"progress": {
			"height":
				1,
			"leftmargin":
				0,
			"topmargin":
				318
		},
		"track": {
			"height":
				1,
			"leftmargin":
				-1,
			"topmargin":
				318
		}
	}
};

const activefont = config.font.active;

const { Image } = imagescript;
let cachedNoto20;
let cachedNoto32;
let cachedNoto80;
let cachedNoto64;
(async () => {
	let allCachedFonts = await Image.cacheFontAtScales([config.font.sizes[0], config.font.sizes[1], config.font.sizes[2], config.font.sizes[3]], activefont);//font sizes
	cachedNoto20 = allCachedFonts[config.font.sizes[0]];
	cachedNoto32 = allCachedFonts[config.font.sizes[1]];
	cachedNoto64 = allCachedFonts[config.font.sizes[2]];
	cachedNoto80 = allCachedFonts[config.font.sizes[3]];

});
let cachedPop20;
let cachedPop32;
let cachedPop80;
let cachedPop64;
(async () => {
	let allCachedFonts = await Image.cacheFontAtScales([20, 32, 80, 64], pop);
	cachedPop32 = allCachedFonts[32];
	cachedPop80 = allCachedFonts[80];
	cachedPop64 = allCachedFonts[64];
	cachedPop20 = allCachedFonts[20];

})();
let bgs = new Map();

//Load BGs into cache
(async () => {
	let allfiles = await fsp.readdir("./assets/DazaiBgs");
	for (let i = 0; i < allfiles.length; i++) {
		if (allfiles[i] === ".DS_Store" || allfiles[i].endsWith(".gif") || allfiles[i].endsWith(".mp4")) continue;
		let file = await Image.decode(fs.readFileSync(`./assets/DazaiBgs/${allfiles[i]}`)).catch(er => console.trace(er, "ER!"));
		bgs.set(`./assets/DazaiBgs/${allfiles[i]}`, file);
	}
})();
const sleep = (delay) => new Promise((resolve) => setTimeout(resolve, delay));
let queue = [];
process.on("message", (data) => {
	queue.push(JSON.parse(data));
});
async function getBG(path) {
	return (await bgs.get(path) ? bgs.get(path).clone() : Image.decode(await fsp.readFile(path)));
}


async function generateTetCard(level, xp, next, currentFormatted, nextFormatted, colorschemeR, colorschemeG, colorschemeB, rank, avatar, bgimg, name, writeOut) {
	time = Date.now();
	let base = await getBG(bgimg);

	let pfp = await fetch(avatar);
	pfp = await pfp.buffer();
	pfp = await Image.decode(pfp);
	if (pfp.height < 256) pfp.resize(256, 256);
	pfp = pfp.cropCircle(false, 0.05);


	let rankLvl = await Image.renderTextFromCache(cachedPop32, `Rank ${rank}`, Jimp.rgbaToInt(255, 255, 255, 255));
	let lvl = await Image.renderTextFromCache(cachedPop80, `Level ${level}`, Jimp.rgbaToInt(255, 255, 255, 255));
	let text = await Image.renderTextFromCache(cachedPop64, name, Jimp.rgbaToInt(parseInt(colorschemeR), parseInt(colorschemeG), parseInt(colorschemeB), 255));
	let lvlDetails = await Image.renderTextFromCache(cachedPop20, `${currentFormatted} / ${nextFormatted} XP`, Jimp.rgbaToInt(255, 255, 255, 255));
	base = base.clone();
	base.resize(1024, 340);
	base.composite(pfp, 40, Math.round(base.height / 2) - Math.round(pfp.height / 2));
	base.composite(rankLvl, (pfp.width + 50), 60);
	base.composite(lvl, (pfp.width + 50), 80);
	base.composite(text, (pfp.width + 50), 164);
	xp = xp || next * 0.0009765625;
	xp = xp / next > 1 ? next : xp;
	let xpBar = new Image(Math.max(xp * 1024 / next, 1), 30);
	let color = Image.colorToRGBA(pfp.averageColor());
	color[3] = 100;
	base.drawBox(0, 320, 1024, 30, Image.rgbaToColor(color[0], color[1], color[2], color[3]));

	xpBar.fill(Jimp.rgbaToInt(parseInt(colorschemeR), parseInt(colorschemeG), parseInt(colorschemeB), 255));
	base.composite(xpBar, 0, 318);
	base.composite(lvlDetails, 950 - (9 * `${currentFormatted} / ${nextFormatted} XP`.length), 290);
	let temp = "./temp/" + genID(10) + ".png";
	base.resize(1024, 340);

	if (writeOut) {
		await fsp.writeFile(temp, await base.encode(3)).catch(er => console.error(er));
	}
	let res = !writeOut && await base.encode(3);

	return writeOut ? temp : res;
}

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
async function generateGrifyCard(level, xp, next, currentFormatted, nextFormatted, colorschemeR, colorschemeG, colorschemeB, rank, avatar, bgimg, name, writeOut) {
	let base = await getBG(bgimg);
	base = base.clone();
	base.resize(1024, 340);//are these the final dimensions?
	let pfp = await fetch(avatar);
	pfp = await pfp.buffer();
	pfp = await Image.decode(pfp);
	if (!(pfp.height === config.pfp.rendering.sidelength)) pfp.resize(config.pfp.rendering.sidelength, config.pfp.rendering.sidelength);//removed if (pfp.height < 256), so pfp is guaranteed to be 256
	pfp = pfp.cropCircle(false, config.pfp.rendering.edgeSmoothness);
	base.composite(pfp, 40, Math.round(base.height / 2) - Math.round(pfp.height / 2));
	let rankLvl = await Image.renderTextFromCache(cachedNoto32, `Rank ${rank}`, Jimp.rgbaToInt(255, 255, 255, 200));
	let lvl = await Image.renderTextFromCache(cachedNoto80, `Level ${level}`, Jimp.rgbaToInt(255, 255, 255, 200));
	let text = await Image.renderTextFromCache(cachedNoto64, name, Jimp.rgbaToInt(parseInt(colorschemeR), parseInt(colorschemeG), parseInt(colorschemeB), 255));
	// fs.writeFileSync("test2.png",await text.encode());
	let lvlDetails = await Image.renderTextFromCache(cachedNoto20, `${currentFormatted} / ${nextFormatted} XP`, Jimp.rgbaToInt(255, 255, 255, 255));
	const o = pfp.width + 50;
	base.composite(rankLvl, o, 60);
	base.composite(lvl, o - 4.5, 80);
	base.composite(text, o + 1, 164);
	xp = xp || next * 0.0009765625;
	if (xp / next > 1) xp = next;
	const xpprogress = Math.max(xp * 1024 / next, 1);
	let xpBar = new Image(xpprogress, config.xpbar.progress.height);
	let color = Image.colorToRGBA(pfp.dominantColor());//averageColor
	color[3] = 100;
	//color = [255,255,255,1]
	//base.drawBox(config.xpbar.track.leftmargin, config.xpbar.track.height, 1026, 30, Image.rgbaToColor(color[0],color[1],color[2],color[3]));//top xp bar track 
	let abcd = new Image(1024, 22);
	const f = 0.25;
	abcd.fill(Jimp.rgbaToInt(f * color[0], f * color[1], f * color[2], 170));
	base.composite(abcd, config.xpbar.progress.leftmargin, 0);//0, 318


	//base.drawBox(config.xpbar.track.leftmargin, config.xpbar.track.topmargin, 1024, 30, Image.rgbaToColor(color[0],color[1],color[2],color[3]));
	//base.drawBox(config.xpbar.track.leftmargin, config.xpbar.track.height, 1024, config.xpbar.track.height, Image.rgbaToColor(color[0],color[1],color[2], 100));//320
	let transparent = new Image(xpprogress, 22);
	transparent.fill(Jimp.rgbaToInt(color[0], color[1], color[2], 170));
	base.composite(transparent, config.xpbar.progress.leftmargin, config.xpbar.progress.topmargin);//0, 318

	let ct = new Image(1024 - xpprogress, 22);
	ct.fill(Jimp.rgbaToInt(color[0], color[1], color[2], 60));
	base.composite(ct, xpprogress, config.xpbar.progress.topmargin);//0, 318
	//xpbar
	xpBar.fill(Jimp.rgbaToInt(parseInt(colorschemeR), parseInt(colorschemeG), parseInt(colorschemeB), 255));
	base.composite(xpBar, config.xpbar.progress.leftmargin, config.xpbar.progress.topmargin);//0, 318
	base.composite(lvlDetails, xpprogress - (9 * `${currentFormatted} / ${nextFormatted} XP`.length), 290);
	let temp = "./temp/" + genID(10) + ".png";
	base.resize(1024, 340);
	if (writeOut) {
		await fsp.writeFile("./test.png", await base.encode(3)).catch(er => console.error(er));

	}
	return writeOut ? temp : await base.encode(3);
}
async function generateCardData(level, xp, next, currentFormatted, nextFormatted, colorschemeR, colorschemeG, colorschemeB, rank, avatar, bgimg, name, writeOut, design) {

	if (design === "tetDesign")
		return await generateTetCard(level, xp, next, currentFormatted, nextFormatted, colorschemeR, colorschemeG, colorschemeB, rank, avatar, bgimg, name, writeOut);
	if (design === "grifyDesign")
		return await generateGrifyCard(level, xp, next, currentFormatted, nextFormatted, colorschemeR, colorschemeG, colorschemeB, rank, avatar, bgimg, name, writeOut);
}
async function generateGIFCard(level, xp, next, currentFormatted, nextFormatted, colorschemeR, colorschemeG, colorschemeB, rank, avatar, bgimg, name, writeout, design) {
	return new Promise(async (res, rej) => {
		let temp2 = "./temp/" + genID(12) + ".gif";
		let blankPath = await generateCardData(level, xp, next, currentFormatted, nextFormatted, colorschemeR, colorschemeG, colorschemeB, rank, avatar, "./assets/jimpStuff/fullBlankBG.png", name, true, design);
		let ffmpegCMD = spawn(require("ffmpeg-static"), ["-i", bgimg, "-i", blankPath, "-filter_complex", "overlay=0:0", "-pix_fmt", "yuv420p", "-c:a", "copy", temp2]);
		ffmpegCMD.on("close", async (code) => {
			await fsp.unlink(blankPath);
			res({ data: (await fsp.readFile(temp2)), type: "gif" });
			fsp.unlink(temp2);
		});
	}).catch(console.trace);

	// return temp2;
}
(async () => {
	// eslint-disable-next-line no-constant-condition
	while (true) {
		while (queue.length == 0) {
			await sleep(10);
		}
		let item = queue.shift();
		let type = [generateGIFCard, generateCardData,][~~item.type];
		let path = await type(...item.data).catch(er => console.trace(er));
		process.send({ key: item.key, data: path });
	}
})();