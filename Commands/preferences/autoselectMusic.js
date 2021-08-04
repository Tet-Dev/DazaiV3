const { Command, BooleanArgument, StringArgument } = require("eris-boiler/lib");
const { StringArgumentChoice } = require("eris-boiler/lib/arguments/choices");
const SQLHandler = require("../../Handlers/SQLHandler");
module.exports = new Command({
	name: "autoselectmusic",
	displayName: "Auto Select Music",
	description: "Auto-select the top result from the list of songs",
	options: {
		parameters: [new StringArgument("autoselect","if autoselect is on or not",false,[new StringArgumentChoice("Turn Autoselect on","on"),new StringArgumentChoice("Turn Autoselect off","off")])],
        
	},
	getValue: async (bot, {channel,member}) => {
		return SQLHandler.getUser(member.id).then(user => {
			if (user.autoSelectSongs === 1) {
				return "On";
			} else {
				return "Off";
			}
		});
	},
	run: (bot, {member,params }) => {
		let toggle = params[0] ;
		if (toggle === "on") {
			SQLHandler.setUser(member.id, {autoSelectSongs: 1});
			return ("Auto-select songs is now on");
		} else if (toggle === "off") {
			SQLHandler.setUser(member.id, {autoSelectSongs: 0});
			return ("Auto-select songs is now off");
		} else {
			return ("Invalid option, valid options are `on` and `off`");
		}
	},
});