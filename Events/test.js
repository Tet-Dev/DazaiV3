const { DiscordEvent } = require("eris-boiler/lib");
const MusicHandler = require("../Handlers/MusicV5");
const { sleep } = require("../Handlers/TetLib");
const TetLib = require("../Handlers/TetLib");
module.exports = new DiscordEvent({
	name: "interactionCreate",
	run: async (bot, obj1,obj2 ) => {
        console.log("slash got!",obj1.data,obj1.id, obj1);

	}
});
// let allCommands = await axios.get(`https://discord.com/api/v8/applications/${client.user.id}/commands`, {
//     headers: {
//         Authorization: client.token
//     }
// });
// allCommands = allCommands.data;
// let allIds = allCommands.map(x=>x.id);
// for (let i = 0 ; i < allIds.length; i++){
//     await sleep(3000);
//     let allCommands = await axios.delete(`https://discord.com/api/v8/applications/${client.user.id}/commands/${allIds[i]}`, {
//         headers: {
//             Authorization: client.token
//         }
//     }).catch(er=>console.trace(er));
//     // applications/<my_application_id>/commands/<command_id>
// }