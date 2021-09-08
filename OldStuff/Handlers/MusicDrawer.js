const cp = require("child_process");
const TetLib = require("./TetLib");
let musicWorker = null;
let nowPlaying = null;
const musicMap = new Map();
module.exports = {
	/**
	 * 
	 * @param {import("./MusicV5").TrackInfo} song 
	 * @param {String} whoPlayed 
	 * @param {import("./MusicV5").GuildData} guildData 
	 */
	generateUpNextCard: async (song, whoPlayed, guildData) => {
		let resData = await new Promise((res) => {
			let randID = TetLib.genID(50);
			musicMap.set(randID, res);
			musicWorker.send(JSON.stringify({
				type: 1,
				data: [song, whoPlayed, guildData.queue.map(x=>x.trackData)],
				key: randID
			}));
		});
		let uint = (new Uint8Array(Object.values(resData)));
		let buffer = Buffer.alloc(uint.byteLength);
		for (let i = 0; i < buffer.length; ++i) {
			buffer[i] = uint[i];
		}
		await guildData.channelBound.createMessage({
			content : "",
		}, {
			file: buffer,
			name: "Dazai.png"
		}).catch(er => console.trace(er));
	},
	init: () => {
		musicWorker = cp.fork("./Handlers/MusicDrawerWorker");
		musicWorker.on("message", async (m) => {
			musicMap.get(m.key)(m.data);
			musicMap.delete(m.key);
		});
	},
	/**
	 * 
	 * @param {import("./MusicV5").TrackInfo} song 
	 * @param {String} whoPlayed 
	 * @param {import("./MusicV5").GuildData} guildData
	 */
	generateNowPlayingCard: async (song,whoPlayed,guildData,channel)=>{
		let resData = await new Promise((res) => {
			let randID = TetLib.genID(50);
			musicMap.set(randID, res);
			musicWorker.send(JSON.stringify({
				type: 0,
				data: [song, guildData?.player?.state?.position, whoPlayed],
				key: randID
			}));
		});
		let uint = (new Uint8Array(Object.values(resData)));
		let buffer = Buffer.alloc(uint.byteLength);
		for (let i = 0; i < buffer.length; ++i) {
			buffer[i] = uint[i];
		}
		// await (channel || guildData.channelBound).createMessage({
		// 	content : "",
		// }, {
		// 	file: buffer,
		// 	name: "Dazai.png"
		// }).catch(er => console.trace(er));
		return buffer;
	}
};