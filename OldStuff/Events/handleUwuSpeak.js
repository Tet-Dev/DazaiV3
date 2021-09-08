const { DiscordEvent } = require("eris-boiler/lib");
const LevellingHandler = require("../Handlers/LevellingHandler");
const SQLHandler = require("../Handlers/SQLHandler");
const uwu = require('uwuifier');
const uwuifier = new uwu();
const sleep = (delay) => new Promise((resolve) => setTimeout(resolve, delay));
function getRandomInt(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min)) + min;
}
function parseLevelRewards(str) {
  return str.split("||").map(x => {
    if (!x) return null;
    let qd = x.split(",");
    return {
      level: qd[0],
      roleID: qd[1],
    };
  }).filter(x => x);
}
const uwuspeak = new Set();

//

/** 
 * @param {import('eris').Member} member
 * @returns {Boolean}
 */
const memberIsUwuSpeaked = (member) => {
  //Get the member's role ids and check against its guild's role ids
  const memberRoles = member.roles.map(x => member.guild.roles.get(x));
  //Checks if any member roles have the uwuspeak role
  return memberRoles.some(x => x.name.toLowerCase() === "uwuspeak");
}
/**
 * @param {import('eris').TextChannel} channel
 */
const getWebhooks = async (channel) => {
  const webhooks = await channel.getWebhooks().catch(_ => {
    channel.createMessage("I cannot get webhooks for this channel! This will not allow me to put a user into UwUspeak! Please give me the neccesary permissions!")
  });
  if (!webhooks || !webhooks.length) return null;
  for (let i = webhooks.length; i < 8; i++) {
    let webhook = await channel.createWebhook({ name: "Dazai Messages Hook", reason: "For any dazai related stuffs." }).catch(_ => {
      channel.createMessage("I am missing the permissions to manage webhooks for this channel! This permission is neccesary for uwuspeak to work!");
    });
    if (!webhook) return
    webhooks.push(webhook);
  }
  return webhooks;
};
/** 
 * @param {import('eris').Message} message 
*/

const parseLinks = async (message) => {
  //Store all links in message content to an array
  const links = message.content.match(/(https?:\/\/(?:www\.|(?!www))[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|www\.[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|https?:\/\/(?:www\.|(?!www))[a-zA-Z0-9]+\.[^\s]{2,}|www\.[a-zA-Z0-9]+\.[^\s]{2,})/gi);
  //remove those links from the message content and replace with a placeholder
  if (links) for (let i = 0; i < links.length; i++) message.content = message.content.replace(links[i], "||{$$}||");
  return {
    content: message.content,
    links: links,
  };
}

/**
 * @param {import('eris').Message} message
 */
const formatMessageIntoEmbed = async (message) => {
  
}

module.exports = new DiscordEvent({
  name: "messageCreate",
  run: async (bot, msg) => {
    /** @type {import("eris").Message} */
    let m = msg;
    if (!bot.uwuspeak) bot.uwuspeak = uwuspeak;
    if (!uwuspeak.has(m.channel.id)) {
      await (async () => {
        let data = await bot.SQLHandler.getChannel(msg.channel.id);
        if (data.uwuspeak)
          uwuspeak.add(msg.channel.id, data.uwuspeak ? true : false);
      })();
    }
    if (!uwuspeak.has(m.channel.id) || (m.member && !memberIsUwuSpeaked(m.member))) return;
    if (m.attachments.length) return;
    let webhooks = await getWebhooks(m.channel);
    let parseLinks = await parseLinks(m);
    let uwuified = uwuifier.uwuify(parseLinks.content);
    //Scan link array for any link with a domain of discord.com and move it to another array, removing it from the original array
    let discordLinks = parseLinks.links.filter(x=>x.match(/https:\/\/(((canary|ptb)).d|d)iscord.com\/channels\/\d+\/\d+\/\d+/));
    parseLinks.links = parseLinks.links.filter(x=>!x.match(/https:\/\/(((canary|ptb)).d|d)iscord.com\/channels\/\d+\/\d+\/\d+/));
    //Parse discordLinks array into objects containing the channel id and the message id
    let discordLinksObjects = discordLinks.map(x=>{
      //Match all number strings
      let match = x.match(/\d+/g);
      //Return an object containing the channel id and the message id
      return {
        channelID: match[1],
        messageID: match[2],
      };
    });



    //Get link array and replace the placeholders in uwuified message
    if (parseLinks.links) for (let i = 0; i < parseLinks.links.length; i++) uwuified = uwuified.replace("||{$$}||", parseLinks.links[i]);
    
  }
});

