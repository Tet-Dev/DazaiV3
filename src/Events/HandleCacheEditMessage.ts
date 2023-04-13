import { Message } from 'eris';
import { SniperManager } from '../Handlers/Fun/MessageReader/SniperManager';
import { EventHandler } from '../types/misc';
import { kittenedMessageIDs } from './HandleKittenTalk';

export const HandleCacheEditMessage = {
  event: 'messageUpdate',
  run: async (bot, msg, oldMsg) => {
    if (msg.guildID === undefined) return;
    if (kittenedMessageIDs.has(msg.id)) return;
    console.log("Edited message: ", msg.content, "Old message: ", oldMsg?.content);
    SniperManager.getInstance().logEditedMessage({
      ...msg,
      content: oldMsg?.content || `Old message content not avalible.`,
    } as Message);
  },
} as EventHandler<'messageUpdate'>;
export default HandleCacheEditMessage;