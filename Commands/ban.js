const { GuildCommand, UserArgument, StringArgument, NumberArgument, IntArgument } = require("eris-boiler/lib");
const PunishmentsHandler = require("../Handlers/PunishmentsHandler");
const RankCardDrawer = require("../Handlers/RankCardDrawer");
const SQLHandler = require("../Handlers/SQLHandler");
const moment = require("moment");
module.exports = new GuildCommand({
  name: "ban", // name of command
  description: "Ban another user!",
  run: (async (client, { params, channel, user, member }) => {

    console.log(params);
    let mentionedUser = params.length ? params[0].match(/\d+/) : null;
    /** @type  {Member} */
    let mem;
    [mentionedUser, mem] = [mentionedUser[0], await client.getRESTGuildMember(channel.guild.id, mentionedUser[0]).catch((er) => {console.trace(er) })];
    if (!mem) return channel.send(`${mem.user.username} is not a valid user!`);
    const reason = (params.filter(x=>!!parseInt(x)).length <= 1) ? params.splice(1, 10000).join(" ") : params.splice(5, 10000).join(" ");
    params.shift();
    let days,hours,mins,secs;
      [days = 1496064,hours = 0,mins = 0,secs = 0] = params.map(x=>parseInt(x)).filter(x=>!isNaN(x));
    const time = days*24*60*60 + hours*60*60 + mins*60 + secs;
    if ( time >  129259929600) time = 129259929600;
    if (time < 0) return channel.createMessage("You can't ban someone for negative time!");
    PunishmentsHandler.banUser(member, mem, reason, days,hours,mins,secs);
    channel.createMessage(`${mem.user.username} has been banned for ${moment.duration(time*1000).humanize()}.`);

  }),
  options: {
    permissionNode: "banUser",
    parameters: [
      new UserArgument("user", "User to ban", false),
      new IntArgument("days", "Days for the user to be banned allows 0 as an argument", true),
      new IntArgument("hours", "Hour for the user to be banned allows 0 as an argument", true),
      new IntArgument("minutes", "Minutes for the user to be banned allows 0 as an argument", true),
      new IntArgument("seconds", "Seconds for the user to be banned allows 0 as an argument", true),
      new StringArgument("reason", "Reason for warning", true),
    ],
    // aliases: ["q"]
    // parameters: ["The index of the item or \"all\" to purge the queue"]
  }
});