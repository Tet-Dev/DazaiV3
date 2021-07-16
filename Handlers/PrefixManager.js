const Eris = require("eris");
const SQLHandler = require("./SQLHandler");

const prefixMap = new Map();
/**
 * @param {Eris.Client} client
 * @param {Eris.Message} message
 * @returns {Promise<String>} serverPrefix
 */
module.exports = async (bot,msg) => {
    /** @type {Eris.Message} */
    const message = msg;
    if (message.channel.type == 1){
        return "daz";
    }
    let prefix = prefixMap.get(message.guildID);
    if (prefix == null){
        prefix = (await SQLHandler.getGuild(message.guildID))?.prefix;
        prefixMap.set(message.guildID,prefix);
    }
    return prefix || "daz";
}