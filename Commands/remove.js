const { GuildCommand, IntArgument } = require("eris-boiler/lib");
const MusicHandler = require("../Handlers/MusicV5");
const TetLib = require("../Handlers/TetLib");
const Pagination = require("../Handlers/Pagination");
module.exports = new GuildCommand({
	name: "remove", // name of command
	description: "Removes a song from the queue.",
	run: (async (client, context) => {
		// Declare Types 
		/** @type {DataClient} */
		let bot = client;
		/** @type {Array<String>} */
		let params = context.params;

		let guildData = MusicHandler.getGuildData(context.channel.guild.id);
		let pos = Number(params[0]);
		if (!guildData || !guildData.queue?.length) return "There isn't anything in the queue right now! Hop into a Voice Channel and play some music!";
		if (isNaN(pos)) return `Please provide an index referring to a position in the queue (Between 1 and ${guildData.queue.length})`;
		if (pos % 1 !== 0) return `Please provide a **whole number** referring to a position in the queue (Between 1 and ${guildData.queue.length})`;
		if (pos > guildData.queue?.length) return `Please provide a valid index referring to a position in the queue (Between 1 and ${guildData.queue.length})`;
		let items = guildData.queue.splice(pos - 1, parseInt(params[1]) > 1 ? parseInt(params[1]) - pos || 1 : 1);
		if (items.length > 10) {
			let queuePages = TetLib.splitArrayIntoChunks(items, 10).map((page, pageIndex) => {
				let mappedInfo = page.map((x, i) => {
					/** @type {import("../Handlers/MusicV5").SongRequest} */
					let item = x;
					return {
						name: `[ ${pageIndex * 10 + i + 1 + pos-1} ] ${item.trackData.info.title}`,
						value: `${TetLib.SecsToFormat(Math.round(item.trackData.info.length / 1000))} | Requested by ${item.requester.mention}| [[Link]](${item.trackData.info.uri})`,
						inline: false,

					};
				});
				return {
					title: "Removed songs",
					description: "What songs were removed",
					fields: mappedInfo,
				};
			});
			new Pagination(queuePages, channel.id, (m, emoji, userID) => ((userID.id ? userID.id : userID) === context.member.id))
		} else {
			let mappedInfo = items.map((x, i) => {
				let item = x;
				return {
					name: `[ ${i + 1 +pos-1} ] ${item.trackData.info.title}`,
					value: `${TetLib.SecsToFormat(Math.round(item.trackData.info.length / 1000))} | Requested by ${item.requester.mention} | [[Link]](${item.trackData.info.uri})`,
					inline: false,

				};
			});
			bot.createMessage(channel.id, {
				"embed":
				{
					title: "Removed songs",
					description: "What songs were removed",
					fields: mappedInfo,
				}
			});
		}


	}),
	options: {
		permissionNode: "remove",
		parameters: [new IntArgument("position","position in queue to delete at",false)],
	} // functionality of command
	// list of things in object passed to run: bot (Databot), msg (Message), params (String[])
});