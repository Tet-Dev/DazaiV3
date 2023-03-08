import { Message } from 'eris';
import { DiscordEvent } from 'eris-boiler';
import { getGuildData } from '../../Handlers/DatabaseHandler';
import { LevellingHandler } from '../../Handlers/Levelling/LevellingHandler';
const XPCooldowns = new Map();
export const XPEvent = new DiscordEvent({
  name: 'messageCreate',
  run: async (bot, msg: Message) => {
    if (msg.author.bot) return;
    if (!msg.guildID) return;
    if (XPCooldowns.get(`${msg.author.id}${msg.guildID}`) > Date.now()) {
      return;
    }
    XPCooldowns.set(`${msg.author.id}${msg.guildID}`, Date.now() + 60 * 0);
    const GuildData = await getGuildData(msg.guildID, true);
    if (!GuildData) return;
    if (!GuildData.xp) return;
    if (GuildData.blacklistedChannels.includes(msg.channel.id)) return;
    let userXP = await LevellingHandler.getUser(msg.guildID, msg.author.id);
    userXP.exp += Math.floor(Math.random() * 10 + 15)
    if (!userXP) {
      await LevellingHandler.updateUser(msg.guildID, msg.author.id, 1, 0);
      return;
    }
    let levelUPs = 0;
    while (userXP.exp >= Math.floor(100 * Math.pow(userXP.level, 1.5))) {
      userXP.exp -= Math.floor(100 * Math.pow(userXP.level, 1.5));
      levelUPs++;
    }
    await LevellingHandler.updateUser(msg.guildID, msg.author.id, userXP.level + levelUPs, userXP.exp);
    if (levelUPs) {
      //Remove roles when leveling up if they are set to be removed
      if (!GuildData.keepRolesWhenLevel) {
        const previousLevelRewards = GuildData?.levelrewards?.filter(reward => reward.level < userXP.level);
        if (previousLevelRewards?.length) {
          const rolesToRemove = previousLevelRewards.map(reward => reward.roleID);
          let removeroles = msg.member?.roles.filter(role => rolesToRemove.includes(role));
          if (removeroles?.length) {
            while (removeroles.length) {
              await msg.member?.removeRole(removeroles.shift()!);
            }
          }
        }
      }
      //Give roles when leveling up if they are set to be given
      const levelRewards = GuildData?.levelrewards?.filter(reward => reward.level <= userXP.level);
      if (levelRewards?.length) {
        const rolesToGive = levelRewards.map(reward => reward.roleID).filter(role => !msg.member?.roles.includes(role));
        if (rolesToGive?.length) {
          while (rolesToGive.length) {
            await msg.member?.addRole(rolesToGive.shift()!);
          }
        }
      }
      //Send message when leveling up
      if (GuildData.levelmsg) {
        const levelMsg = GuildData.levelmsg
          .replace('{OLDLVL}', userXP.level.toString())
          .replace('{NEWLVL}', (userXP.level + levelUPs).toString())
          .replace('{USER}', msg.author.username)
          .replace('{USERID}', msg.author.id)
          .replace('{MENTION}', msg.author.mention)
          ;
        if (GuildData.levelmsgChannel && GuildData.levelmsgChannel !== 'any') {
          await bot.createMessage(GuildData.levelmsgChannel, levelMsg);
        }
      }

    }
  },
})
export default XPEvent;