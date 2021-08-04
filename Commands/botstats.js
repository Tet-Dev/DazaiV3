/* eslint-disable linebreak-style */
const { Command } = require("eris-boiler");
const moment = require("moment");
const os = require("os");
const MusicHandler = require("../Handlers/MusicV5");
module.exports = new Command({
	name: "botstats",
	description: "Shows bot stats",
	options: {
		aliases: ["bs", "ss", "shardstats"],
	},
	run: (async (bot, { member, params }) => {
		const inline = true;
		return {
			embed: {
				title: ":heartbeat: Shard Statistics",
				// description: 
				fields: [
					{ name: "Thread Uptime", value: moment.duration(process.uptime() * 1000).humanize(), inline},
					{ name: "Heartbeat Uptime", value: moment.duration(bot.uptime).humanize() ,inline},
					{ name: "Servers/Guilds", value: bot.guilds.size, inline },
					{ name: "CPU", value: `${os.cpus().length} ${os.cpus()[0].model} CPUS`, inline },
					{ name: "Ping(ms)", value: member?.guild?.shard?.latency || bot.shards.random().latency , inline },
					{ name: "Shard ID", value: member ? member.guild.shard.id : "DM Channel/Unknown", inline },
					
					{ name: "Streaming Music to", value: `${Array.from(MusicHandler.guildData.values()).filter(x => x.playing).length} Servers/Guilds`, inline },
					{ name: "Version", value: "Running Dazai V2.0", inline },
					{ name: "Owner", value: "[Tet](https://card.tet.moe)", inline },
				]
			}
		};
	})
});