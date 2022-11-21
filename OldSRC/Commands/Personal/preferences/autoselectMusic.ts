import { Command, StringArgument, StringArgumentChoice } from "eris-boiler";
import { getUser, updateUser } from "../../../Handlers/DatabaseHandler";
export const autoselectMusic = new Command({
	name: "autoselectmusic",
	displayName: "Auto Select Music",
	description: "Auto-select the top result from the list of songs",
	options: {
		parameters: [new StringArgument("autoselect", "if autoselect is on or not", false, [new StringArgumentChoice("Turn Autoselect on", "on"), new StringArgumentChoice("Turn Autoselect off", "off")])],

	},
	getValue: ({ member}) => {
		return getUser(member!.id).then(user => {
			if (user?.autoSelectSongs === 1) {
				return "On";
			} else {
				return "Off";
			}
		});
	},
	run: (_, { member, params }) => {
		let toggle = params[0];
		if (toggle === "on") {
			updateUser(member!.id, { autoSelectSongs: 1 });
			return ("Auto-select songs is now on");
		} else if (toggle === "off") {
			updateUser(member!.id, { autoSelectSongs: 0 });
			return ("Auto-select songs is now off");
		} else {
			return ("Invalid option, valid options are `on` and `off`");
		}
	},
});
export default autoselectMusic;