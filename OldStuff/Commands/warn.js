const { GuildCommand, UserArgument, StringArgument } = require("eris-boiler/lib");
const PunishmentsHandler = require("../Handlers/PunishmentsHandler");
const RankCardDrawer = require("../Handlers/RankCardDrawer");
const SQLHandler = require("../Handlers/SQLHandler");

module.exports = new GuildCommand({
  name: "warn", // name of command
  description: "Warn another user!",
  run: (async (client, { params, channel, user, member }) => {


    channel.sendTyping();
    let mentionedUser = params.length ? params[0].match(/\d+/) : null;
    /** @type  {Member} */
    let mem;
    [mentionedUser, mem] = [mentionedUser[0], await client.getRESTGuildMember(member.guild.id, mentionedUser[0]).catch(() => {})];
    if (!mem) return channel.send(`${mem.user.username} is not a valid user!`);
    PunishmentsHandler.warnUser(member,mem,params.splice(1,1000000).join(" "));
    channel.createMessage(`${mem.user.username} has been warned.`);

  }),
  options: {
    permissionNode: "warnUser",
    parameters: [new UserArgument("user", "User to warn", false), new StringArgument("reason", "Reason for warning", true)],
    // aliases: ["q"]
    // parameters: ["The index of the item or \"all\" to purge the queue"]
  }
});