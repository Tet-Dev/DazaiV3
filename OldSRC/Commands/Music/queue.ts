import { Embed, User } from "eris";
import { GuildCommand } from "eris-boiler";
import MusicHandler from "../../Handlers/Music/MusicMain";
import Pagination from "../../Helpers/Pagination";
import TetLib from "../../Helpers/TetLib";
export const queue = new GuildCommand({
  name: "queue", // name of command
  description: "Views the music queue.",
  run: async (bot, { channel, member }) => {
    const guildData = MusicHandler.getGuildMap(member!.guild.id);
    if (!guildData || !guildData.queue?.length) return "There isn't anything in the queue right now! Join a Voice Channel and play some music!";
    if (guildData.queue.length > 10) {
      let queuePages = TetLib.splitArrayIntoChunks(guildData.queue.concat([]), 10).map((page, pageIndex) => {
        let mappedInfo = page.map((x, i) => {
          /** @type {import("../Handlers/MusicV5").SongRequest} */
          let item = x;
          return {
            name: `[ ${pageIndex * 10 + i + 1} ] ${item.trackData.info.title}`,
            value: `${TetLib.parseTime(Math.round(item.trackData.info.length / 1000))} | Requested by ${item.requester.mention}| [[Link]](${item.trackData.info.uri})`,
            inline: false,

          };
        });
        return {
          title: "Queue",
          description: "What's up next?",
          fields: mappedInfo,
        };
      }) as Embed[];
      new Pagination(queuePages, channel.id, (userID) => userID === member!.id);
    }
    else {
      let mappedInfo = guildData.queue.map((x, i) => {
        let item = x;
        return {
          name: `${i + 1} ) ${item.title}`,
          value: `${TetLib.parseTime(Math.round(item.duration! || 1000 / 1000))} | Requested by ${(item.requester as User).mention} | [[Link]](${item.uri})`,
          inline: false,

        };
      });
      bot.createMessage(channel.id, {
        "embed":
        {
          title: "Queue",
          description: "What's up next?",
          fields: mappedInfo,
        }
      });
    }
    return "";
  },
  options: {
    // permissionNode: "playSong",
    aliases: ["q"],
    // parameters: [],
  } // functionality of command
});
export default queue;