import {
  Member,
  Message,
  PartialEmoji,
  PossiblyUncachedMessage,
  Uncached,
} from 'eris';

export const listenForReactions = (
  message: Message | null = null,
  run: (
    message: PossiblyUncachedMessage,
    reaction: PartialEmoji,
    user: Member | Uncached,
    eventType: 'messageReactionAdd' | 'messageReactionRemove'
  ) => void,
  options: {
    time?: number;
    listenType?: 'add' | 'remove' | 'both';
  } = { listenType: 'both' }
) => {
  const filterReactions = async (
    msg: PossiblyUncachedMessage,
    reaction: PartialEmoji,
    user: Member | Uncached,
    type: 'messageReactionAdd' | 'messageReactionRemove'
  ) => {
    if ((message && message.id === msg.id) || !message) {
      run(msg, reaction, user, type);
    }
  };
  const filterAdds = filterReactions.bind({ type: 'messageReactionAdd' });
  const filterRemovals = filterReactions.bind({
    type: 'messageReactionRemove',
  });
  if (options.listenType === 'both' || options.listenType === 'add')
    globalThis.bot.on('messageReactionAdd', filterAdds);
  if (options.listenType === 'both' || options.listenType === 'remove')
    globalThis.bot.on('messageReactionRemove', filterRemovals);
  if (options.time)
    setTimeout(() => {
      globalThis.bot.off('messageReactionAdd', filterAdds);
      globalThis.bot.off('messageReactionRemove', filterRemovals);
    }, options.time);
  return {
    stop: () => {
      globalThis.bot.off('messageReactionAdd', filterAdds);
      globalThis.bot.off('messageReactionRemove', filterRemovals);
    },
  };
};
export const findNextReaction = (
  message: Message | null = null,
  filter: (
    message: PossiblyUncachedMessage,
    reaction: PartialEmoji,
    user: Member | Uncached,
    eventType: 'messageReactionAdd' | 'messageReactionRemove'
  ) => boolean,
  options: {
    time?: number;
    listenType?: 'add' | 'remove' | 'both';
  } = { listenType: 'both' }
) => {
  return new Promise<{
    message: PossiblyUncachedMessage;
    reaction: PartialEmoji;
    user: Member | Uncached;
    eventType: 'messageReactionAdd' | 'messageReactionRemove';
  }>((resolve, reject) => {
    const listener = listenForReactions(
      message,
      (msg, reaction, user, type) => {
        if (filter(msg, reaction, user, type)) {
          listener.stop();
          resolve({ message: msg, reaction, user, eventType: type });
        }
      },
      options
    );
  });
};
export default listenForReactions;
