import { XPManager } from '../Handlers/Levelling/XPManager';
import { EventHandler } from '../types/misc';
const lastEXP = new Map<string, number>();
export const GrantEXPOnChat = {
  event: 'messageCreate',
  run: async (bot, msg) => {
    if (env.devmode) return;
    if (!msg.guildID) return;
    if (msg.author.bot) return;
    // grant exp
    const XPPrefs = await XPManager.getInstance().getGuildXPPreference(
      msg.guildID
    );
    if (!XPPrefs.enabled) return;
    if (
      XPPrefs.useChannelWhitelist &&
      !XPPrefs.channelIDs.includes(msg.channel.id)
    )
      return;
    let lastEXPEvent = lastEXP.get(`${msg.author.id}-${msg.channel.id}`) ?? 0;
    if (Date.now() < lastEXPEvent + XPPrefs.cooldown) return;
    lastEXP.set(`${msg.author.id}-${msg.channel.id}`, Date.now());
    const newXP = await XPManager.getInstance().messageXP(
      msg.guildID,
      msg.author.id,
      XPPrefs
    );
    console.log(
      `Granted XP to ${msg.author.username}#${msg.author.discriminator} in ${msg.guildID}`
    );
    // if (lastEXPEvent
  },
} as EventHandler<'messageCreate'>;
export default GrantEXPOnChat;
