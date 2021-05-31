/* eslint-disable no-async-promise-executor */

const { map } = require("lodash");

// const SQLHandler = require("../../sqlHandler/SQLCommunicator");
let sqlConnection;
let bot;
let reddit;
let subMap;
class RedditHandler {
	constructor(b) {
		sqlConnection = b.SQLHandler;
		bot = b;
	}
	async init() {
		let data = await sqlConnection.query("SELECT * FROM nadekoguilddata.redditsubs");
		subMap = new Map();
		let tempmap = [];

		data.forEach(row => {
			let spl = row.redditsub.split(",");
			tempmap.concat(spl);
			spl.forEach(x => {
				let curr = subMap.get(x) || [];
				curr.push(row.discordChannelID);
				subMap.set(x, curr);
			});
		});
		const Reddit = require("reddit-helper");
		reddit = new Reddit();
		reddit.setMinutes(1 / 6);
		await reddit.sub.bulk.add(Array.from(subMap.keys()));
		reddit.on("ready", () => console.log("The module is now ready, Loaded", reddit.sub.list().length, "Subs! "));
		reddit.on("reddit_error", (err) => console.log(err.stack, "Reddit Error!"));
		reddit.on("post", async (sub, data) => {
			let subs = subMap.get(sub);
			if (!subs) return;
			data.forEach(obj => {
				subs.forEach(async (x) => {
					bot.createMessage(x, {
						embed: {
							title: obj.title,
							image: {
								url: obj.url
							},
							description: "New Post From followed subreddit r/" + obj.sub.name,
							url: obj.permalink,
							author: {
								name: obj.author.name,
								icon_url: bot.user.staticAvatarURL,
							},
							color: 16747520,
							fields: [
								{
									name: "Subreddit Members: ",
									value: obj.sub.members,
									inline: true
								},
							],
						},
					}).catch(() => { });
				});
			});

			
		});
		await reddit.start();
	}
	async addSub(sub, guildid, channelid) {
		try {
			let data = await sqlConnection.genericGet("redditsubs", "discordChannelID", channelid);
			delete data.discordChannelID;
			data.discordGuildID = guildid;
			data.redditsub = sub;
			await sqlConnection.genericUpdate("redditsubs", "discordChannelID", channelid, data);
			let dat = subMap.get(sub) || [];
			if (!dat.length) reddit.sub.add(sub);
			dat.push(channelid);
			subMap.set(sub,dat);
			return true;
		} catch (error) {
			console.trace(error);
			return false;
		}

		// let all =  await sqlConnection.genericGet("redditsubs","discordGuildID",channelid);
	}
	async removeSub(guildid,channelid) {
		try {
			let data = await sqlConnection.genericDelete("redditsubs", "discordChannelID", channelid);
			let sub = data.redditsub;
			let dat = subMap.get(sub) || [];
			if (dat.length == 1) reddit.sub.remove(sub);
			dat = dat.filter(x=>x!==channelid);
			subMap.set(sub,dat);
			return true;
		} catch (error) {
			console.trace(error);
			return false;
		}

	}

}
module.exports = RedditHandler;