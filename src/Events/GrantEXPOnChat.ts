import { Message, PossiblyUncachedTextableChannel } from 'eris';
import { XPManager } from '../Handlers/Levelling/XPManager';
import { EventHandler } from '../types/misc';
import levenshtein from 'fast-levenshtein';
const lastEXP = new Map<string, number>();
const lastUserMessages = new Map<string, Message[]>();
const determineMultiplier = (
  messages: Message[],
  msg: Message<PossiblyUncachedTextableChannel>
) => {
  // conditions for a spam reducer:
  // 1. the message is similar to at least 3 of the last 50 messages (similarity is determined by the levenshtein distance)
  // 2. the message is a link, and the last 50 messages contain at least 3 links
  // 3. if there are more than 2 large messages (messages with more than 500 characters) in the last 50 messages
  // 4. if the user has sent more than 3 messages in the last 5 seconds
  let multiplier = 1;
  let similarMessages = 0;
  let largeCount = 0;
  let links = 0;
  let fastMsgs = messages
    .slice(-5)
    .filter((m) => m.timestamp > msg.timestamp - 5000).length;
  messages.forEach((m) => {
    if (
      m.content.match(
        /https?:\/\/(?:www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b(?:[-a-zA-Z0-9()@:%_\+.~#?&\/=]*)/
      )
    )
      links++;
    if (m.content.length > 500) {
      largeCount++;
      return;
    }
    // the similarity is the levenshtein distance; make the shorter message equal in length to the longer message by repeating it
    let oldMsg = m.content;
    let newMsg = msg.content;
    let ratio =
      Math.max(oldMsg.length, newMsg.length) /
      Math.min(oldMsg.length, newMsg.length);
    // if the ratio is > 3, do not use levenshtein distance
    if (ratio > 3) return;
    // otherwise repeat the shorter message until it's the same length as the longer message
    if (oldMsg.length < newMsg.length) {
      oldMsg = oldMsg
        .repeat(Math.ceil(newMsg.length / oldMsg.length))
        .substring(0, newMsg.length);
    } else {
      newMsg = newMsg
        .repeat(Math.ceil(oldMsg.length / newMsg.length))
        .substring(0, oldMsg.length);
    }
    const levidist = levenshtein.get(m.content, msg.content);
    const similarity =
      levidist / Math.max(m.content.length, msg.content.length);
    if (similarity < 0.5) similarMessages++;
  });
  if (similarMessages >= 3) {
    multiplier *= 1 / (similarMessages / 2.3);
    if (similarMessages >= 10) multiplier *= 5 / similarMessages;
  }
  if (
    links >= 3 &&
    msg.content.match(
      /https?:\/\/(?:www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b(?:[-a-zA-Z0-9()@:%_\+.~#?&\/=]*)/
    )
  ) {
    if (links >= 10) multiplier *= 0.5;
    multiplier *= 1 / (links / 2.2);
  }
  if (largeCount >= 2 && msg.content.length > 500) {
    if (largeCount >= 10) multiplier *= 0.5;
    multiplier *= 1 / (largeCount / 2.2);
  }
  if (fastMsgs >= 3) {
    multiplier *= 0.75;
    if (fastMsgs >= 5) multiplier *= 0.8;
  }
  return multiplier;
};
export const GrantEXPOnChat = {
  event: 'messageCreate',
  run: async (bot, msg) => {
    //@ts-ignore
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
    // check if the user is spamming
    let multiplier = 1;
    const lastMessages = lastUserMessages.get(msg.author.id) ?? [];
    if (lastMessages?.length >= 5) {
      multiplier = determineMultiplier(lastMessages, msg);
      if (multiplier < 1) {
        console.log(
          `Reduced XP for ${msg.author.username}#${msg.author.discriminator} in ${msg.guildID} by ${multiplier}`
        );
      }
    }
    if (lastMessages.length >= 50) lastMessages.shift();
    lastUserMessages.set(msg.author.id, [
      ...(lastMessages ?? []),
      msg as Message,
    ]);

    let lastEXPEvent = lastEXP.get(`${msg.author.id}-${msg.channel.id}`) ?? 0;
    if (Date.now() < lastEXPEvent + XPPrefs.cooldown) return;
    lastEXP.set(`${msg.author.id}-${msg.channel.id}`, Date.now());
    if (multiplier <= 0.04) {
      msg.addReaction('🚫');
      
    }
    const newXP = await XPManager.getInstance().messageXP(
      msg.guildID,
      msg.author.id,
      XPPrefs,
      multiplier
    );

    console.log(
      `Granted XP to ${msg.author.username}#${msg.author.discriminator} in ${msg.guildID}`
    );
    // if (lastEXPEvent
  },
} as EventHandler<'messageCreate'>;
export default GrantEXPOnChat;
