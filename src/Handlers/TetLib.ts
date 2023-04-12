import Eris, { Member, Message, User } from 'eris';
import { ReducedMessage } from './Fun/MessageReader/SniperManager';
export const TetLib = {
  sleep: (delay: number) =>
    new Promise((resolve) => setTimeout(resolve, delay)),
  text_truncate: (str: string, len: number) => {
    let array = str.split('');
    array.length = len - 3;
    return array.join('') + '...';
  },
  parseTime: (seconds: number) => {
    let hours = Math.floor(seconds / 3600);
    let minutes = Math.floor((seconds % 3600) / 60);
    seconds = seconds % 60;
    return `${hours < 10 ? `0${hours}` : hours}:${
      minutes < 10 ? `0${minutes}` : minutes
    }:${seconds < 10 ? `0${seconds}` : seconds}`;
  },
  SecsToFormat: (secs: string) => {
    let seconds = parseInt(secs);
    let hours = Math.floor(seconds / 3600);
    let minutes = Math.floor((seconds % 3600) / 60);
    seconds = seconds % 60;
    return `${hours}:${minutes}:${seconds}`;
  },
  genID: (length: number) => {
    var result = '';
    var characters =
      'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    var charactersLength = characters.length;
    for (var i = 0; i < length; i++) {
      result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
  },
  /**
   *
   * @param {Array<*>} array
   * @param {Number} length
   * @returns {Array<Array<*>>}
   */
  splitArrayIntoChunks: (array: any[], length: number) => {
    let res = [];
    while (array.length >= length) {
      res.push(array.splice(0, length));
    }
    if (array.length) res.push(array);
    return res;
  },
  /**
   * Shuffles array in-place;
   * @param {Array<*>} array
   * @returns {Array<*>}
   */
  shuffle: (array: any[]) => {
    let counter = array.length;
    while (counter > 0) {
      let index = Math.floor(Math.random() * counter);
      counter--;
      [array[counter], array[index]] = [array[index], array[counter]];
    }
    return array;
  },
  formatNumber(num: number) {
    if (num >= 1000000000) {
      return (num / 1000000000).toFixed(3).replace(/\.0$/, '') + 'b';
    }
    if (num >= 1000000) {
      return (num / 1000000).toFixed(3).replace(/\.0$/, '') + 'm';
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(3).replace(/\.0$/, '') + 'k';
    }
    return num;
  },
  /**
   * Gets a display string from a member (Teto#6942)
   * @param {Member} member
   * @param {Boolean} useNickname
   * @returns {String} formatted name
   */
  getMemberDisplayName(member: Member, useNickname: boolean) {
    return useNickname
      ? `${member.nick || member.user.username}#${member.user.discriminator}`
      : this.getUserDisplayName(member.user);
  },
  /**
   * Gets a display string from a user (Teto#6942)
   * @param {User} user
   * @returns {String} formatted name
   */
  getUserDisplayName(user: User) {
    return `${user.username}#${user.discriminator}`;
  },
  findCommandParam: (
    options?: Eris.InteractionDataOptions[],
    name?: string
  ) => {
    if (!options || !name) return;
    return options.find((option) => option.name === name);
  },
  /**
   * Reduces a message to a simple object that can be easily stringified
   * @param message {Message} Message to reduce
   */
  reduceMessage: (message: Message) => {
    const memObj = {
      id: message.id,
      content: message.content,
      embeds: message.embeds,
      author: {
        id: message.author.id,
        username: message.author.username,
        discriminator: message.author.discriminator,
        avatar: message.author.avatarURL,
      },
      timestamp: message.timestamp,
      editedTimestamp: message.editedTimestamp,
      channelID: message.channel.id,
    } as ReducedMessage;
    if (message.member) {
      return {
        ...memObj,
        author: {
          ...memObj.author,
          member: {
            nick: message.member.nick,
            guildID: message.member.guild.id,
          },
        },
      } as ReducedMessage;
    }
    return memObj as ReducedMessage;
  },
};
export default TetLib;
// create a type based on reduceMessage
