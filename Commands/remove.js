const { GuildCommand } = require("eris-boiler/lib");
const MusicHandler = require("../Handlers/MusicV5");
const TetLib = require("../Handlers/TetLib");
const EmbedPaginator = require("eris-pagination");
module.exports = new GuildCommand({
	name: "remove", // name of command
	description: "Removes a song from the queue.",
	run: (async (client, context) => {
		// Declare Types 
		/** @type {DataClient} */
		let bot = client;
		/** @type {Message} */
		let msg = context.msg;
		/** @type {Array<String>} */
		let params = context.params;

		let guildData = MusicHandler.getGuildData(msg.guildID);
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
			EmbedPaginator.createPaginationEmbed(msg, queuePages);
		} else {
			let mappedInfo = items.map((x, i) => {
				let item = x;
				return {
					name: `[ ${i + 1 +pos-1} ] ${item.trackData.info.title}`,
					value: `${TetLib.SecsToFormat(Math.round(item.trackData.info.length / 1000))} | Requested by ${item.requester.mention} | [[Link]](${item.trackData.info.uri})`,
					inline: false,

				};
			});
			bot.createMessage(msg.channel.id, {
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
		aliases: ["Position in queue to finish deleting"],
		parameters: ["Position in queue (as shown in the queue command)"],
	} // functionality of command
	// list of things in object passed to run: bot (Databot), msg (Message), params (String[])
});