const { GuildCommand } = require("eris-boiler/lib");
const autoclean = require("./autoclean");

//------------------------------------------------ BASIC CONSTS
const sleep = (delay) => new Promise((resolve) => setTimeout(resolve, delay));
//------------------------------------------------
function text_truncate(str,len){
	let array = str.split("");
	array.length = len-3;
	return array.join("") + "...";
}
const create = require("./create");
const list = require("./list");
const delet = require("./delete");
module.exports = new GuildCommand({
	name: "reactionrole", // name of command
	description: "Main Reaction Role Command!",
	options: {
		subCommands: [
			list,
			create,
			autoclean,
			delet,
			// extraRole,
			// extraRole2,
			// keeproleswhenlevel,
		],
		aliases: ["rero"]
	},
	run: async function (bot, context) {
		let f = await Promise.all(this.subCommands.map(async (sub) => ({
			name: sub.displayName,
			value: await sub.getValue(bot, context)+"\n*Subcommand: `"+sub.name+"`*",
			inline: true
		})));
		return {
			embed: {
				title: "Reaction Roles :test_tube:",
				description: "The Parent of all Reaction Role Commands",
				thumbnail: { url: "https://i.imgur.com/KskcqKg.png" },
				timestamp: require("dateformat")(Date.now(), "isoDateTime"),
				color: 0x3498db,
				fields: f
			}
		};

	},
	// functionality of command
	// list of things in object passed to run: bot (DataClient), msg (Message), params (String[])
});