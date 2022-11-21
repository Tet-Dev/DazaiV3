import { Client, Emoji, Member, Message } from 'eris';
import { EventEmitter } from 'events';

export interface dataType {
  msg: Message,
  emoji: { name: string, id: string | null, animated?: boolean },
  userID: string
}

export default class ReactionCollector extends EventEmitter {
  constructor(message: Message, filter: (reactorID: string) => boolean, options?: { maxMatches?: number, time?: number }) {
    super();

    this.client = message.channel.client;
    this.filter = filter;
    this.message = message;
    this.options = options ? options : {};
    this.ended = false;
    this.collected = [];
    this.listener = (msg, emoji, reactor) => this.checkPreConditions(msg, emoji, reactor);

    this.client.on('messageReactionAdd', this.listener);
    if (this.options.time) setTimeout(() => this.stopListening('timeout'), options?.time || 60 * 1000 * 5);

    new Promise((resolve) => {
      this.on('end', resolve);
    });
  }

  private client: Client; filter: (reactorID: string) => boolean; message: Message; ended: boolean;
  private options: { maxMatches?: number, time?: number };
  private collected: dataType[];
  private listener: (msg: Message, emoji: Emoji, reactor: Member) => boolean;


  private checkPreConditions(msg: Message, emoji: Emoji, reactor: Member): boolean {
    if (this.message.id !== msg.id) {
      return false;
    }

    if (this.filter(reactor.id)) {
      this.collected.push({ msg, emoji, userID: reactor.id });
      this.emit('collected', { msg, emoji, userID: reactor.id } as dataType);

      if (this.options.maxMatches && this.collected.length >= this.options.maxMatches) {
        this.stopListening('maxMatches');
        return true;
      }
    }
    return false;
  }

  private stopListening(reason: 'timeout' | 'maxMatches') {
    if (this.ended) return;
    this.ended = true;
    this.client.removeListener('messageReactionAdd', this.listener);
    this.emit('end', this.collected, reason);
  }
}
