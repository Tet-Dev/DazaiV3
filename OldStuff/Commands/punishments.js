const { GuildCommand, UserArgument, StringArgument } = require("eris-boiler/lib");
const moment = require("moment");
const Pagination = require("../../Handlers/Pagination");
const PunishmentsHandler = require("../../Handlers/PunishmentsHandler");
const RankCardDrawer = require("../../Handlers/RankCardDrawer");
const SQLHandler = require("../../Handlers/SQLHandler");
const TetLib = require("../../Handlers/TetLib");

module.exports = new GuildCommand({
  name: "punishments", // name of command
  description: "View a list of a user's punishments!",
  run: (async (client, { params, channel, user, member }) => {


    channel.sendTyping();
    let mentionedUser = params.length ? params[0].match(/\d+/) : null;
    /** @type  {Member} */
    let mem;
    if (mentionedUser === null) {
      mem = member;
      mentionedUser = mem.user.id;
    } else
      [mentionedUser, mem] = [mentionedUser[0], await client.getRESTGuildMember(member.guild.id, mentionedUser[0]).catch(() => { })];
    if (!mem) return channel.send(`${mem.user.username} is not a valid user!`);
    /** @type {Array<PunishmentsHandler.SQLPunishment>} */
    let data = await PunishmentsHandler.getPunishments(mem.guild.id, mem.id, params.splice(1, 1000000).join(" "));
    if (data.length === 0) return (`${mem.user.username} has no punishments!`);
    let queuePages = TetLib.splitArrayIntoChunks(data.concat([]), 3).map((page, pageIndex) => {
      let mappedInfo = page.map((x, i) => {
        /** @type {PunishmentsHandler.SQLPunishment} */
        let item = x;
        return {
          name: `${PunishmentsHandler.getEnums().punishmentTitles[item.punishmentType-1]}`,
          value: `Responsible Moderator: <@!${item.punisher}>\nModeration action issued **${moment(parseInt(item.timestamp)).fromNow()}**${!!(item.punishmentType-1) && `\nModeration action expires in **${moment(item.endsAt).fromNow()}**` || ""}\n\n__Reason__\`\`\`${item.reason}\`\`\`\n `,
          inline: false,

        };
      });
      return {
        title: "Moderation History",
        description: `All the sussy baka things <@!${mem.id}> has done!`,
        fields: mappedInfo,
      };
    });
    new Pagination(queuePages, channel.id, (m, emoji, userID) => ((userID.id ? userID.id : userID) === member.id))
    
  }),
  options: {
    // permissionNode: "warnUser",
    parameters: [new UserArgument("user", "User to check", true)],
    aliases: ["warns","mhist",]
    // parameters: ["The index of the item or \"all\" to purge the queue"]
  }
});