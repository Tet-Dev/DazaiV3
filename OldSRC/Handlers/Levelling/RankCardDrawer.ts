import { ChildProcess, fork } from "child_process";
import { Member } from "eris";
import env from "../../env";
import TetLib from "../../Helpers/TetLib";
import { UserData } from "../DatabaseHandler";
import initColor from "./colorMap";
import { LevellingHandler } from "./LevellingHandler";
import initLink from "./linkMap";

let RankCardMap = new Map();

let rankCardWorkers: ChildProcess[] = [];
const LinkMap = initLink();
const ColorMap = initColor();

export const RankCardDrawer = {
	init: () => {
		for (let i = 0; i < env.RankCardDrawers; i++) {
			let rankCardWorker = fork("src/Handlers/Levelling/RankCardDrawerWorker.ts");
			rankCardWorker.on("message", async (m: any) => {
				RankCardMap.get(m.key)(m.data);
				RankCardMap.delete(m.key);
			});
			rankCardWorkers.push(rankCardWorker);
		}
	},
	/**
	 * Generates a rank card for a given user
	 * @param {Eris.Member} member
	 * @param {import('../../src/Handlers/SQLHandler').SQLUserData} userData
	 * @returns {Promise<BufferAndType>} 
	 */
	generate: async (member: Member, userData: UserData) => {
		let LBData = await LevellingHandler.getUserPositionData
			(member.guild.id, member.id);
		let xpData = LBData!.leaderboard[LBData!.position] || { exp: 0, level: 0 };
		let currentXP = xpData.exp;
		let level = xpData.level;
		let currentXPFormatted = TetLib.formatNumber(currentXP);
		let nextLevel = Math.round(100 * level ** 1.3);
		let nextLevelFormatted = TetLib.formatNumber(nextLevel);
		let username = TetLib.getMemberDisplayName(member, true);
		let position = LBData!.position;
		let bgName = LinkMap.get(userData.personalbg) || LinkMap.get("spacegray");
		let color = ColorMap.get(userData.personalcolor) || [255, 255, 255];
		let design = "tetDesign" || userData.design || "tetDesign";
		console.log(member.avatarURL, member.defaultAvatar)
		let avatar = member.avatarURL || member.user.dynamicAvatarURL('png', 128);
		let resData = await new Promise((res) => {
			let randID = TetLib.genID(50);
			RankCardMap.set(randID, res);
			rankCardWorkers[Math.floor(Math.random() * rankCardWorkers.length)].send(JSON.stringify({
				type: bgName.endsWith(".gif") ? 0 : 1,
				data: [level, currentXP, nextLevel, currentXPFormatted, nextLevelFormatted, color[0], color[1], color[2], position + 1, avatar, bgName, username, false, design],
				key: randID
			}));
		}) as {

			data: Uint8Array | Buffer, type?: string
		};
		let type = resData.type
		let dataArray = resData.data;
		let buffer;
		let uint = (new Uint8Array(Object.values(dataArray)));
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
export default RankCardDrawer;