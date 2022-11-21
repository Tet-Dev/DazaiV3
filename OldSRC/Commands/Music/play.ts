import { StringArgument, GuildCommand } from "eris-boiler";
import ReactionCollector, { dataType } from "../../Handlers/ReactionsCollector";
import MusicHandler from "../../Handlers/Music/MusicMain";
import { Message, VoiceChannel } from "eris";
import { getGuildData, getUser, GuildData } from "../../Handlers/DatabaseHandler";
import TetLib from "../../Helpers/TetLib";
const { parseTime, text_truncate } = TetLib;
//------------------------------------------------ BASIC CONSTS
// const sleep = (delay: number) => new Promise((resolve) => setTimeout(resolve, delay));
//------------------------------------------------



function getChoice(msg: Message, userid: string) {
  return new Promise(async (res) => {
    let filter = (userID: string) => userID === userid;
    let collector = new ReactionCollector(msg, filter, {
      maxMatches: 1,
      time: 1000 * 60,
    });
    collector.once("end", (collected: dataType[]) => {
      if (collected[0]?.emoji.name) {
        res(collected[0].emoji);
      }
      else {
        msg.delete().catch(() => { });
        res(null);
      }
    })
  });
}
module.exports = new GuildCommand({
  name: "play", // name of command
  description: "Plays music.",
  run: (async (bot, { channel, member, params }) => {
    let channelID = member!.voiceState?.channelID;
    let search = params.join(" ");
    if (channelID) {

      console.log((bot?.getChannel(channelID) as VoiceChannel).permissionsOf(bot?.user.id!), bot?.user.id)
      if (!(bot?.getChannel(channelID) as VoiceChannel).permissionsOf(bot?.user.id!).has("voiceConnect"))
        return "I don't have permission to connect to the voice channel.";
      if (!search) return "Please provide a search term."
      const searchResults = await MusicHandler.self.Manager.search(search, member?.user);
      if (searchResults.exception) return `There was an error loading your track!\`Severity : ${searchResults.exception.severity}\` \`\`\`${searchResults.exception.message}\`\`\``
      if (searchResults.tracks.length === 0) return "No results found.";
      let tracks = searchResults.tracks;
      tracks.length = Math.min(tracks.length, 8);
      const choices = ["1️⃣", "2️⃣", "3️⃣", "4️⃣", "5️⃣", "6️⃣", "7️⃣", "8️⃣"];
      console.log((await getUser(member?.user.id || ""))?.autoSelectSongs)
      if (tracks.length !== 1 && !(await getUser(member?.user.id || ""))?.autoSelectSongs) {
        const fields = tracks.map((track, i) => {
          let title = track.title;
          let length = parseTime(track.duration / 1000);
          let author = track.author;
          return {
            name: `${choices[i]} ) ${text_truncate(title, 30)}`,
            value: `**Length:** ${length}\n**Author:** ${author}\n`,
            inline: false
          }
        });

        let promptMSG = await bot!.createMessage(channel.id, {
          embed: {
            title: "Search Results",
            description: `Select which one you would like to play! (To turn this off do \`${(await getGuildData(member!.guild.id).catch(() => { }) as GuildData)?.prefix || "daz "}prefs autoselectmusic on\``,
            color: 0,
            fields: fields,
          },
        });
        promptMSG.addReaction("❌");
        (async () => {

          for (var i = 0; i < fields.length; i++) {

            try {
              let failed = false;
              await promptMSG.addReaction(choices[i]).catch(() => {
                failed = true;
              });
              if (failed) break;
            } catch (er) {
              break;
            }
          }
        })();

        let choice = await getChoice(promptMSG, member!.id) as { name: string };
        if (!choice) return "";
        if (choice.name === "❌") promptMSG.delete();
        for (var i = 0; i < choices.length; i++) {
          if (choice.name === choices[i]) {
            let track = tracks[i];
            MusicHandler.addSongToQueue(member?.guild.id!, channelID, channel.id, track);
            promptMSG.delete();
            break;
          }
        }
      } else {
        let track = tracks[0];
        MusicHandler.addSongToQueue(member?.guild.id!, channelID, channel.id, track);
      }



    } else {
      return "You are not in a vc!";
    }
    return "";
  }),
  options: {
    // permissionNode: "playSong",
    aliases: ["p"],
    parameters: [new StringArgument("song", "Provide a search term. Accepts Spotify & Youtube URLs", false, undefined)]
  }
  // list of things in object passed to run: bot (Databot), msg (Message), params (String[])
});