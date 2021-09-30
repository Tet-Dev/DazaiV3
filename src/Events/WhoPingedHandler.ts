import { Message } from "eris";
import { DiscordEvent } from "eris-boiler";
import { getGuild } from "../Handlers/DatabaseHandler";

export const WhoPingedHandler = new DiscordEvent({
  name: "messageCreate",
  run: async (bot, msg: Message) => {
    if (!msg.content.match(/(who.+ping)|(whoping)/i)) return;
    let serverData = await getGuild(msg.guildID!, true)
    if (serverData.whoPinged) {
        let response = await msg.channel.createMessage(`${msg.author.mention} let me check for you! `);
        msg.channel.sendTyping();
        let msgs = await msg.channel.getMessages({
            limit: 1000,
            before: msg.id
        });
        msgs.filter(x=>x.mentions.map(y=>y.id).includes(msg.author.id)).forEach(x=>{
          
    }
  }
});