import { Message } from 'eris';
import { SniperManager } from '../Handlers/Fun/MessageReader/SniperManager';
import { EventHandler } from '../types/misc';
import { kittenedMessageIDs } from './HandleKittenTalk';

export const HandleCacheDeleteMessage = {
  event: 'messageDelete',
  run: async (bot, msg) => {
    if (msg.guildID === undefined) return;
    if (kittenedMessageIDs.has(msg.id)) return;
    SniperManager.getInstance().logSnipedMessage(msg as Message);
  },
} as EventHandler<'messageDelete'>;
export default HandleCacheDeleteMessage;
