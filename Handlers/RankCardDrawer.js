// eslint-disable-next-line no-unused-vars
const Eris = require("eris");

let RankCardMap = new Map();
let rankCardWorker;
const TetLib = require("./TetLib");
const LevellingHandler = require("./LevellingHandler");
const LinkMap = require("./RankCardHelpers/linkMap")();
const ColorMap = require("./RankCardHelpers/colorMap")();
module.exports = {
	init: () => {
		const cp = require("child_process");
		rankCardWorker = cp.fork("./Handlers/RankCardDrawerWorker.js");
		rankCardWorker.on("message", async (m) => {
			RankCardMap.get(m.key)(m.data);
			RankCardMap.delete(m.key);
		});
	},
	/**
	 * Generates a rank card for a given user
	 * @param {Eris.Member} member
	 * @param {import('./SQLHandler').SQLUserData} userData
	 * @returns {Promise<BufferAndType>} 
	 */
	generate: async (member, userData) => {
		let LBData = await LevellingHandler.getPositionInGuild(member.guild.id, member.id);
		let xpData = LBData.leaderboard[LBData.position] || { exp: 0, level: 0 };
		let currentXP = xpData.exp;
		let level = xpData.level;
		let currentXPFormatted = TetLib.formatNumber(currentXP);
		let nextLevel = Math.round(100 * level ** 1.3);
		let nextLevelFormatted = TetLib.formatNumber(currentXP);
		let username = TetLib.getMemberDisplayName(member, true);
		let position = LBData.position;
		let bgName = LinkMap.get(userData.personalbg) || LinkMap.get("spacegray");
		let color = ColorMap.get(userData.personalcolor) || [255,255,255];
		let design = "tetDesign" || userData.design || "tetDesign";
		let avatar = member.user.dynamicAvatarURL("png",256);
		let resData = await new Promise((res) => {
			let randID = TetLib.genID(50);
			RankCardMap.set(randID, res);
			rankCardWorker.send(JSON.stringify({
				type: !bgName.endsWith(".png") ? 0 : 1,
				data: [level, currentXP, nextLevel, currentXPFormatted, nextLevelFormatted, color[0], color[1], color[2], position, avatar, bgName, username ,false,design],
				key: randID
			}));
		});
		let type = resData.type;
		resData = resData.data || resData;
	
		let buffer;
		let uint = (new Uint8Array(Object.values(resData.data || resData)));
		buffer = Buffer.alloc(uint.byteLength);
		for (let i = 0; i < buffer.length; ++i) {
			buffer[i] = uint[i];
		}
		return {
			buffer,
			type
		};
	}
};
/**
 * @typedef {Object} BufferAndType
 * @property {Buffer} buffer
 * @property {String} type
 */