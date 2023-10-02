import { Message } from 'eris';

export const collectNextMessage = (
  channelID: string,
  userID: string,

  options: {
    time?: number;
    filter?: (m: Message) => boolean;
  } = {}
) => {
  return new Promise<Message>((resolve, reject) => {
    const filterMessages = async (msg: Message) => {
        console.log(msg.channel.id, channelID, msg.author.id, userID);
      if (msg.channel.id === channelID && msg.author.id === userID) {
        if (options.filter && !(await options.filter(msg))) return;
        globalThis.bot.off('messageCreate', filterMessages);
        resolve(msg);
      }
    };
    globalThis.bot.on('messageCreate', filterMessages);
    if (options.time)
      setTimeout(() => {
        globalThis.bot.off('messageCreate', filterMessages);
        reject();
      }, options.time);
  });
};
