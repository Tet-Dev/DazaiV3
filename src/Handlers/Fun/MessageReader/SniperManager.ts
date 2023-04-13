import Eris, { Message } from 'eris';
import { accessSync, lstatSync, mkdirSync, writeFileSync } from 'fs';
import { access, lstat, readFile, unlink } from 'fs/promises';
import { join } from 'path';
import TetLib from '../../TetLib';
import { AuditLogManager } from '../../Auditor/AuditLogManager';

interface CachedMessageMap {
  version: number;
}

interface Version1CacheMessageMap extends CachedMessageMap {
  version: 1;
  messageMap: {
    [key: string]: ReducedMessage[];
  };
  editMap: {
    [key: string]: ReducedMessage[];
  };
}
export type ReducedMessage = {
  id: string;
  content?: string;
  embeds?: Eris.Embed[];
  author: {
    id: string;
    username: string;
    discriminator: string;
    avatar?: string;
    member?: {
      nick?: string;
      roles: string[];
      guildID: string;
    };
  };
  timestamp: number;
  editedTimestamp: number;
  channelID: string;
};
export class SniperManager {
  static instance: SniperManager;
  static getInstance(): SniperManager {
    if (!SniperManager.instance) SniperManager.instance = new SniperManager();
    return SniperManager.instance;
  }
  messageMap: Map<string, ReducedMessage[]> = new Map(); // Map of channelID to array of messages
  editMap: Map<string, ReducedMessage[]> = new Map(); // Map of channelID to array of messages
  private constructor() {
    this.init();

    //do something when app is closing
    // process.once('exit', this.writeToCache.bind(this));

    //catches ctrl+c event
    process.once('SIGINT', this.writeToCache.bind(this));

    // catches "kill pid" (for example: nodemon restart)
    // process.on('SIGUSR1', this.writeToCache.bind(this));
    // process.on('SIGUSR2', this.writeToCache.bind(this));

    //catches uncaught exceptions
    // process.on('uncaughtException', this.writeToCache.bind(this));
  }
  latestVersion = 1;
  async init() {
    // check if cache exists
    // if it does, load it
    // check if ./cachedstate/ exists via promises
    if (
      !(await access(join(__dirname, 'cachedstate'))
        .catch(() => false)
        .then(() => true))
    ) {
      // load cache
      const rawCache = await readFile(
        join(__dirname, 'cachedstate', 'cachedMessages.json'),
        'utf-8'
      );
      try {
        const cache = JSON.parse(rawCache) as Version1CacheMessageMap;
        //   ensure cache is valid
        if (cache.version !== this.latestVersion) {
          //   throw new Error('Invalid cache, version mismatch');
          console.log('Invalid cache, version mismatch');
          return;
        }
        //   load cache by iterating through the messageMap and adding it to the messageMap and sort by timeStamp,
        for (const [channelID, messages] of Object.entries(cache.messageMap)) {
          this.messageMap.set(
            channelID,
            [...(this.messageMap.get(channelID) || []), ...messages].sort(
              (a, b) => a.timestamp - b.timestamp
            )
          );
        }
        for (const [channelID, messages] of Object.entries(cache.editMap)) {
          this.editMap.set(
            channelID,
            [...(this.editMap.get(channelID) || []), ...messages].sort(
              (a, b) => a.timestamp - b.timestamp
            )
          );
        }
        console.log('Loaded cache');
      } catch (error) {
        // cache is invalid
        // delete it
        unlink(join(__dirname, 'cachedstate', 'cachedMessages.json'));
        console.log('Deleted invalid cache');
      }
    }
  }
  writeToCache() {
    // write the messageMap to a file
    // create ./cachedstate/ if it doesn't exist
    // write the messageMap to a file
    const cache = {
      version: this.latestVersion,
      messageMap: {},
      editMap: {},
    } as Version1CacheMessageMap;
    for (const [channelID, messages] of this.messageMap.entries()) {
      cache.messageMap[channelID] = messages;
    }
    for (const [channelID, messages] of this.editMap.entries()) {
      cache.editMap[channelID] = messages;
    }
    console.log('Writing snipe cache to file', cache);
    try {
      accessSync(join('./', 'cachedstate'));
    } catch (error) {
      mkdirSync(join('./', 'cachedstate'));
      console.log('Created cachedstate directory');
    }
    // write the cache to a file
    writeFileSync(
      join('./', 'cachedstate', 'cachedMessages.json'),
      JSON.stringify(cache)
    );
    console.log(
      'Wrote snipe cache to file',
      cache,
      join('./', 'cachedstate', 'cachedMessages.json')
    );
    process.exit(0);
    return;
  }
  async logSnipedMessage(message: Message) {
    if (!message.guildID) return;
    const channelID = message.channel.id;
    const messages = this.messageMap.get(channelID) || [];
    const reducedMessage = TetLib.reduceMessage(message);
    messages.push(reducedMessage);
    this.messageMap.set(channelID, messages);
    if (
      (await AuditLogManager.getInstance().shouldLogAction(
        message.guildID,
        'logMessageDeletes'
      )) &&
      message.author.id !== bot.user.id
    ) {
      const auditLogEmbed =
        await AuditLogManager.getInstance().generateAuditLogEmbed(
          message.guildID,
          message.member || message.author.id
        );
      auditLogEmbed.title = 'Message Deleted';
      auditLogEmbed.description = `${message.content}`;
      auditLogEmbed.fields = [
        {
          name: 'Author',
          value: message?.author?.id ? `<@!${message?.author?.id}>` : 'Unknown',
          inline: true,
        },
        {
          name: 'Channel',
          value: `<#${message.channel.id}>`,
          inline: true,
        },
        {
          name: 'Message ID',
          value: `${message.id}`,
          inline: true,
        },
      ];
      await AuditLogManager.getInstance().logAuditMessage(
        message.guildID,
        auditLogEmbed
      );
      if (message.embeds.length) {
        for (let i = 0; i < message.embeds.length; i++) {
          await AuditLogManager.getInstance().logAuditMessage(
            message.guildID,
            message.embeds[i]
          );
        }
      }
    }
  }
  async logEditedMessage(message: Message) {
    if (!message.guildID) return;
    const channelID = message.channel.id;
    const messages = this.editMap.get(channelID) || [];
    const reducedMessage = TetLib.reduceMessage(message);
    messages.push(reducedMessage);
    console.log('Logging edited message', reducedMessage);
    this.editMap.set(channelID, messages);
    console.log('Logged edited message', this.editMap.get(channelID));
    if (
      (await AuditLogManager.getInstance().shouldLogAction(
        message.guildID,
        'logMessageEdits'
      )) &&
      message.author.id !== bot.user.id
    ) {
      const auditLogEmbed =
        await AuditLogManager.getInstance().generateAuditLogEmbed(
          message.guildID,
          message.member || message.author.id
        );
      auditLogEmbed.title = 'Message Edited';
      auditLogEmbed.description = `${message.content}`;
      auditLogEmbed.fields = [
        {
          name: 'Author',
          value: message?.author?.id ? `<@!${message?.author?.id}>` : 'Unknown',
          inline: true,
        },
        {
          name: 'Channel',
          value: `<#${message.channel.id}>`,
          inline: true,
        },
        {
          name: 'Original Message',
          value: `[[Jump to original message]](https://discord.com/channels/${message.guildID}/${message.channel.id}/${message.id})`,
          inline: true,
        },
      ];
      await AuditLogManager.getInstance().logAuditMessage(
        message.guildID,
        auditLogEmbed
      );
    }
  }
  async getSnipedMessages(channelID: string) {
    const messages = this.messageMap.get(channelID) || [];
    return messages;
  }
  async snipeLastMessage(channelID: string) {
    const messages = this.messageMap.get(channelID) || [];
    let lastMsg = messages.pop();
    if (!lastMsg) return null;
    // remove the last message from the array
    this.messageMap.set(channelID, messages);
    return lastMsg;
  }
  async snipeLastEditedMessage(channelID: string) {
    const messages = this.editMap.get(channelID) || [];
    let lastMsg = messages.pop();
    if (!lastMsg) return null;
    // remove the last message from the array
    this.editMap.set(channelID, messages);
    return lastMsg;
  }
}
