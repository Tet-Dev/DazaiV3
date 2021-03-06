const fetch = require("node-fetch");
const { SpotifyParser } = require("spotilink");
const { PlayerManager, Player } = require("eris-lavalink");
const ms = require("ms");
const superagent = require("superagent");
const { DataClient } = require("eris-boiler");
const { Client, VoiceChannel, StageChannel, VoiceConnection, GuildChannel, TextChannel, Message, Member } = require("eris");
const { Response } = require("node-fetch");
const MusicDrawer = require("./MusicDrawer");
const TetLib = require("./TetLib");
const sleep = (delay) => new Promise((resolve) => setTimeout(resolve, delay));
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
	return hours + ":" + minutes + ":" + seconds;
}
function genID(length) {
	let result = "";
	const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
	for (let i = 0; i < characters.length; i++)
		result += characters.charAt(Math.floor(Math.random() * charactersLength));
	return result;
}
/**
 * 
 * @param {GuildChannel} channel 
 * @returns {Player}
 */
function getPlayer(channel) {
	if (!channel || !channel.guild) {
		return Promise.reject("Not a guild channel.");
	}
	let player = bot.voiceConnections.get(channel.guild.id);
	if (player) {
		return Promise.resolve(player);
	}
	let options = {};
	if (channel.guild.region) {
		options.region = channel.guild.region;
	}
	return bot.joinVoiceChannel(channel.id, options);
}
async function resolveTracks(node, search) {
	const result = await superagent.get(`http://${node.host}:2333/loadtracks?identifier=${search}`)
		.set("Authorization", node.password)
		.set("Accept", "application/json")
		.catch(console.trace);
	if (!result) {
		throw "Unable play that video.";
	}
	return result.body;
}
/** @type {Map<String,GuildData>} */
let guildData = new Map();
let gData = guildData;
let spotilink;
let nodes;
let regions;
/** @type {DataClient} */
let bot;
class MusicHandler {
	/** @type {MusicHandler} */
	static self;
	static guildData = gData;
	constructor() {
		MusicHandler.self = this;
		nodes = JSON.parse(process.env.LavalinkNodes);
		this.nodes = nodes;
		if (process.env.SPOTIFYID && process.env.SPOTIFYSECRET)
			spotilink = new SpotifyParser(nodes[Math.floor(Math.random() * nodes.length)], process.env.SPOTIFYID, process.env.SPOTIFYSECRET);
		regions = {
			us: ["us"],
		};
		if (!(process.bot.voiceConnections instanceof PlayerManager)) {
			process.bot.voiceConnections = new PlayerManager(process.bot, nodes, {
				numShards: process.bot.shards.size, // number of shards
				userId: process.bot.user.id, // the user id of the bot
				regions: regions,
				defaultRegion: "us",
			});
		}
	}
	static init() {
		bot = process.bot;
		new MusicHandler();
	}
	async spotiAlbum(album) { return await spotilink.getAlbumTracks(album, true); }
	async spotiSong(song) { return await spotilink.getTrack(song, true); }
	async spotiPlaylist(playlist) { return (await spotilink.getPlaylistTracks(playlist, true)).filter(x => x); }
	async getTracksFromSearch(term) { let data = await resolveTracks(nodes[0], `ytsearch:${term}`).catch(er => console.error(er)); return data; }
	async resolveTrack(term) { return await resolveTracks(nodes[0], `${term}`).catch(er => console.error(er)); }
	/**
	 * Checks if the Player has the specified guild
	 * @param {String} guildID 
	 */
	static hasGuild(guildID) {
		return guildData.has(guildID);
	}
	/**
	 * Joins vc
	 * @param {String} voiceChannelID 
	 * @param {TextChannel} txtChannel
	 * @returns {Player} player
	 */
	static async joinVC(voiceChannelID, txtChannel) {
		if (!bot.voiceConnections.get(txtChannel.guild.id)) {
			let player = await getPlayer(bot.getChannel(voiceChannelID));
			let guildID = player.guildId;
			guildData.set(guildID, {
				queue: [],
				playing: false,
				channelBound: txtChannel,
				player: player,
				skips: new Set(),
				loop: false,
				paused: 0,
			})
			let handleEnd = () => {
				guildData.get(guildID).playing = false;
				guildData.get(guildID).skips.clear();
				if (guildData.get(guildID).loop) {
					guildData.get(guildID).queue.push(guildData.get(guildID).currentlyPlaying);
				}
				MusicHandler.processQueue(guildData.get(guildID));
			};
			player.on("end", handleEnd);
			// player.on("error",)
			player.once("disconnect", () => {
				player.removeListener("end", handleEnd);
				guildData.delete(guildID);
			});
		}
	}
	static runTest() {
		return guildData.get("739559911033405592").player.state.position
	}
	/**
	 * 
	 * @param {String} guildID
	 */
	static stop(guildID) {
		try {
			bot.leaveVoiceChannel(guildData.get(guildID).player.channelId);
			guildData.get(guildID).player.disconnect();
			guildData.delete(guildID);
		} catch (error) {

		}


	}
	/**
	 * Processes a Guild's music queue. Returns true if completed successfully false otherwise
	 * @param {GuildData} guildData 
	 * @returns {Boolean}
	 */
	static processQueue(guildData) {

		if (!guildData || guildData?.player?.playing) return false;
		guildData.playing = true;
		let songInfo = guildData.queue.shift();

		if (!songInfo) {
			guildData.currentlyPlaying = null;
			guildData.playing = false;
			return 0;
		}
		guildData.currentlyPlaying = songInfo;
		guildData.startedAt = Date.now();

		MusicDrawer.generateUpNextCard(songInfo.trackData, `${songInfo.requester.username}#${songInfo.requester.user.discriminator}`, guildData);
		guildData.player.play(songInfo.trackData.track);
		return true;
	}
	/**
	 * gets the current player guild data
	 * @param {String} guildID 
	 * @returns {GuildData}
	 */
	static getGuildData(guildID) {
		return guildData.get(guildID);
	}
	/**
	 * Adds trackinfo to queue
	 * @param {TrackInfo} trackData 
	 * @param {TextChannel} channel
	 * @param {Message} msg 
	 * @param {Member} member
	 * @param {String} guildID
	 */
	static addToQueue(trackData, channel,member, guildID) {
		channel.sendTyping();
		let guData = gData.get(guildID);
		/** @type {SongRequest} */
		let songRequest = {
			requester: member,
			trackData: trackData
		};
		guData.queue = guData.queue.concat(songRequest);
		MusicHandler.processQueue(guData)
		if (gData.get(guildID).queue.length >= 1) {
			return {
				embed: {
					color: 0x00FF00,
					title: `${songRequest.trackData.info.title}`,
					description: `Author: ${songRequest.trackData.info.author}\nLength: ${TetLib.SecsToFormat(songRequest.trackData.info.length / 1000)}`,
					footer: {
						text: `Song Added By ${member.user.username}#${member.user.discriminator} | ${gData.get(guildID).queue.length} tracks in queue.`,
						icon_url: member.user.avatarURL,
					},
					url: `https://www.youtube.com/watch?v=${songRequest.trackData.info.identifier}`
				}
			}
		}
		gData.set(guildID, guData);

	}

	/**
	 * Adds an array of tracks into the queue
	 * @param {Array<TrackInfo>} tracks 
	 * @param {Member} member 
	 * @param {String} guildID
	 */
	static addArrayToQueue(tracks, member, guildID) {
		let guildData = gData.get(guildID);
		if (tracks.length == 0)
			return "Empty playlist!";
		guildData.queue = guildData.queue.concat(tracks.map(x => {
			return {
				trackData: x,
				requester: member,
			};
		}));
		MusicHandler.processQueue(guildData);
		return `Queued ${tracks.length + 1} tracks!`;
	}
	/**
	 * Disconnects the bot from the guild. Returns true if successful and false if it wasnt even connected
	 * @param {String} guildid 
	 */
	async disconnect(guildid) {
		let gobj = guildData.get(guildid);
		if (!gobj) {
			return false;
		}
		gobj.player.stop();
		bot.leaveVoiceChannel(gobj.player.channelId);
		bot.voiceConnections.delete(guildid);
		guildData.delete(guildid);
		return true;
	}
	/**
	 * Pauses music streaming.
	 * @param {String} guildid 
	 */
	static pause(guildid) {
		let gobj = guildData.get(guildid);
		if (!gobj) {
			return 0;
		}
		if (gobj.player.paused) {
			return 1;
		}
		gobj.player.setPause(true);
		return 2;
	}
	/**
	 * Resumes music streaming.
	 * @param {String} guildid 
	 */
	static resume(guildid) {
		let gobj = guildData.get(guildid);
		if (!gobj) {
			return 0;
		}
		if (!gobj.player.paused) {
			return 1;
		}
		gobj.player.setPause(false);
		return 2;
	}
	/**
	 * Seeks through a song. Duration is in SECONDS
	 * @param {String} guildid 
	 * @param {Number} duration 
	 * @param {boolean} absolute 
	 * @returns {Number} newPosition
	 */
	static seek(guildid, duration, absolute) {
		let gobj = guildData.get(guildid);
		if (!gobj) {
			return 0;
		}
		gobj.player.seek(Math.min(gobj.currentlyPlaying.trackData.info.length, absolute ? duration * 1000 : gobj.player.state.position + duration * 1000));
		return Math.max(0, Math.min(gobj.currentlyPlaying.trackData.info.length, absolute ? duration * 1000 : gobj.player.state.position + duration * 1000));
	}
}
module.exports = MusicHandler;
/**
 * @typedef {Object} InternalTrackInfo
 * @property {String} identifier
 * @property {Boolean} isSeekable
 * @property {String} author
 * @property {Number} length
 * @property {Boolean} isStream
 * @property {Number} position
 * @property {String} title
 * @property {String} uri
 */

/**
 * @typedef {Object} TrackInfo
 * @property {String} track
 * @property {InternalTrackInfo} info
 */

/**
 * @typedef {Object} SongRequest
 * @property {TrackInfo} trackData
 * @property {Member} requester
 */

/**
 * @typedef {Object} GuildData
 * @property {Array<SongRequest>} queue
 * @property {Boolean} playing
 * @property {TextChannel} channelBound
 * @property {Player} player
 * @property {Set<String>} skips
 * @property {SongRequest} currentlyPlaying
 * @property {Number} startedAt
 * @property {Boolean} loop
 * @property {Number} paused
 */