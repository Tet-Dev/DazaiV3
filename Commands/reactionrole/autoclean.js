const { SettingCommand } = require("eris-boiler/lib");

//------------------------------------------------ BASIC CONSTS
const sleep = (delay) => new Promise((resolve) => setTimeout(resolve, delay));
//------------------------------------------------
function text_truncate(str, len) {
	let array = str.split("");
	array.length = len - 3;
	return array.join("") + "...";
}
const EmbedPaginator = require("eris-pagination");
// Object.defineProperty(Array.prototype, "chunk_inefficient", {
// 	value: function (chunkSize) {
// 		var array = this;
// 		return [].concat.apply([],
// 			array.map(function (elem, i) {
// 				return i % chunkSize ? [] : [array.slice(i, i + chunkSize)];
// 			})
// 		);
// 	}
// });
function isEmoji(str) {
	var ranges = [
		"(?:[\u2700-\u27bf]|(?:\ud83c[\udde6-\uddff]){2}|[\ud800-\udbff][\udc00-\udfff]|[\u0023-\u0039]\ufe0f?\u20e3|\u3299|\u3297|\u303d|\u3030|\u24c2|\ud83c[\udd70-\udd71]|\ud83c[\udd7e-\udd7f]|\ud83c\udd8e|\ud83c[\udd91-\udd9a]|\ud83c[\udde6-\uddff]|[\ud83c[\ude01-\ude02]|\ud83c\ude1a|\ud83c\ude2f|[\ud83c[\ude32-\ude3a]|[\ud83c[\ude50-\ude51]|\u203c|\u2049|[\u25aa-\u25ab]|\u25b6|\u25c0|[\u25fb-\u25fe]|\u00a9|\u00ae|\u2122|\u2139|\ud83c\udc04|[\u2600-\u26FF]|\u2b05|\u2b06|\u2b07|\u2b1b|\u2b1c|\u2b50|\u2b55|\u231a|\u231b|\u2328|\u23cf|[\u23e9-\u23f3]|[\u23f8-\u23fa]|\ud83c\udccf|\u2934|\u2935|[\u2190-\u21ff])" // U+1F680 to U+1F6FF
	];
	if (str.match(ranges.join("|"))) {
		return true;
	} else {
		return false;
	}
}
function parseEmotes(str) {
	let allEStr = str.split("|").filter(x => x);
	return allEStr.map(x => {
		let miniargs = x.split(",");
		let msgChannel = miniargs[0].split("§");
		let emoot = miniargs[1];
		if (miniargs[1].includes(":")) {
			emoot = miniargs[1].split(":");

			emoot = emoot[emoot.length - 1].replace(">", "");

		}
		return {
			channel: msgChannel[0],
			id: msgChannel[1],

			emote: emoot,
			roleID: miniargs[2]
		};
	});
}
function stringifyEmotes(arr) {
	if (arr.length == 0) return null;
	return arr.map(x => x.channel + "§" + x.id + "," + x.emote + "," + x.roleID).join("|");
}

function getEmoteByID(guild, id) {
	if (isEmoji(id)) return id;
	let emoji = guild.emojis.filter(x => x.id === id);
	if (emoji.length == 0) return "Unknown Emote!";
	emoji = emoji[0];
	return "<" + (emoji.animated ? "a" : "") + ":" + emoji.name + ":" + id + ">";

}
const asyncFilter = async (arr, predicate) => Promise.all(arr.map(predicate))
	.then((results) => arr.filter((_v, index) => results[index]));
// |769235184133603334§769246805304934491,<:D20:769245803226202203>,769235184125870080|769254904748572682§769259723831902219,🎟️,769238973951639582
//|739559911150583820§742171996661612565,✅,739559911096057920|739559911150583820§742171996661612565,📰,739559911096057918|739559911150583820§742171996661612565,🗳️,739559911096057919|739559911150583820§742171996661612565,🍿,739559911096057921|739559911150583820§742171996661612565,😳,739559911096057922|739559911150583820§742171996661612565,🖥️,742172387478470736|739559911150583820§742171996661612565,🧠,739559911033405598|739559911150583820§754826617406095491,<:KenjiThink:756613669990695094>,754825149307682922|739559911150583820§754826617406095491,<:NadThink:754826341219696800>,754825149307682922|739559911150583820§762106526135353354,🧠,762106028098584627|739559911150583820§775098884791205938,👀,775098015870091304
module.exports = new SettingCommand({
	name: "autoclean",
	description: "Cleans up your Reaction Roles that are attached to deleted messages",
	options: {
		permissionNode: "admin",
		// parameters: [],
		// permission
	},
	displayName: "Auto-Clean Reaction Roles",
	getValue: async (client, { msg }) => {
		return "`rero autoclean` to remove any Reros that belong to a deleted message!";
		// });
	},
	run: (async (client, { channel, params }) => {
		let guildData = await client.SQLHandler.getGuild(channel.guild.id);
		let emoteslist = guildData.reactionroles ? parseEmotes(guildData.reactionroles) : [];
		if (emoteslist.length == 0) return "No Reaction Roles to clean!";
		let count = 0;
		let failed = 0;
		let editMsg = await client.createMessage(channel.id,"Checking for Dead Messages");
		
		let inter = setInterval(async () => {
			await editMsg.edit({content: "Searched through "+count +" messages out of "+emoteslist.length+" messages. "+failed+" Dead ReRos Found."});
		}, 1000);
		
		let nel = await asyncFilter(emoteslist,(async (x)=>{
			try {
				let refMsg = await client.getMessage(x.channel,x.id);
				count ++;
				if (!refMsg) {failed ++;return false;}
				return true;
			} catch (error) {
				failed ++;
				return false;
			}
		}));
		
		await (client.SQLHandler.updateGuild(channel.guild.id,{reactionroles : stringifyEmotes(nel)}));
		clearInterval(inter);
		editMsg.delete();
		return "Removed "+(emoteslist.length - nel.length)+" Inactive Reaction Roles!";




	}),// functionality of command
	// list of things in object passed to run: bot (DataClient), msg (Message), params (String[])
});