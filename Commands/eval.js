const { GuildCommand } = require("eris-boiler/lib");
const fs = require("fs");
const util  = require("util");
const MusicDrawer = require("../Handlers/MusicDrawer");
const MusicHandler = require("../Handlers/MusicV5");
const SQLHandler = require("../Handlers/SQLHandler");
const TetLib = require("../Handlers/TetLib");
const axios = require("axios");
//------------------------------------------------ BASIC CONSTS
const sleep = (delay) => new Promise((resolve) => setTimeout(resolve, delay));
//------------------------------------------------
function text_truncate(str, len) {
	let array = str.split("");
	array.length = len - 3;
	return array.join("") + "...";
}
// const StreamToArray = require("stream-to-array");
// const rank = require("./rank");
module.exports = new GuildCommand({
	name: "eval", // name of command
	description: "",
	run: (async (client, { msg, params }) => {
		if (client.botMasters.includes(msg.author.id)){
			let result = await eval(
				`(async ()=> {
					return ${msg.content.substring(msg.content.match(/.+eval /g)[0].length)}
				})()`
			);

			if (!result) return "Evaluation done!";
			if (typeof result === "object"){
				result = util.inspect(result, { depth: 3 });
			}
			if (result?.length > 2000){
				await msg.channel.createMessage("",{
					name: "result.js",
					file: Buffer.from(result)
				});
			}else
				return `\`\`\`${result}\`\`\``;
		}
		
	}),
	options: {
		hidden:true,
	}
});
