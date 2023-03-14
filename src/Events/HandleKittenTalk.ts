import {
  Message,
  PossiblyUncachedTextableChannel,
  Textable,
  TextableChannel,
  TextChannel,
  Webhook,
} from 'eris';
import { XPManager } from '../Handlers/Levelling/XPManager';
import { EventHandler } from '../types/misc';
import Uwuifier from 'uwuifier';
const uwuifier = new Uwuifier();
// seeded random number generator
const random = (seed: number) => {
  var x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
};
export const kittenCacheMap = new Map<string, boolean>();
const channelWebhookCache = new Map<string, Webhook[]>();
const getChannelWebhooks = (channel: TextChannel) =>
  new Promise(async (res, rej) => {
    const webhooks = channelWebhookCache.get(channel.id)
      ? channelWebhookCache.get(channel.id)!
      : (await channel.getWebhooks()).filter((x) => x.token);
    while (webhooks.length < 5) {
      const webhook = await channel.createWebhook({
        name: 'Kitten Talker',
      });
      webhooks.push(webhook);
    }
    res(webhooks);
    if (!channelWebhookCache.get(channel.id))
      return channelWebhookCache.set(channel.id, webhooks);
    channelWebhookCache.set(
      channel.id,
      (await channel.getWebhooks()).filter((x) => x.token)
    );
  }) as Promise<Webhook[]>;
export const KittenifyMessages = {
  event: 'messageCreate',
  run: async (bot, msg) => {
    if (!msg.guildID) return;
    let perf = Date.now();
    if (!kittenCacheMap.get(`${msg.guildID}-${msg.author.id}`)) {
      const userxpdata = await XPManager.getInstance().getGuildMemberXP(
        msg.guildID,
        msg.author.id
      );
      const isKitten = !!userxpdata?.kitten ?? false;
      if (!isKitten) return;
      kittenCacheMap.set(`${msg.guildID}-${msg.author.id}`, true);
    }
    if (msg.components?.length) return;
    console.log(`Took ${Date.now() - perf} to check kitten status`);
    msg.delete();

    const channel = (msg.channel as TextableChannel).client
      ? (msg.channel as TextableChannel)
      : ((await bot.getRESTChannel(msg.channel.id)) as TextableChannel);
    if (channel.type !== 0) return;
    const textChannel = channel as TextChannel;
    console.log(`Took ${Date.now() - perf}ms to get channel`);
    perf = Date.now();
    const webhooks = await getChannelWebhooks(channel);
    console.log(`Took ${Date.now() - perf}ms to get webhooks`);
    perf = Date.now();
    const webhook =
      webhooks[
        Math.floor(
          random(parseInt(msg.author.id.substring(msg.author.id.length - 8))) *
            webhooks.length
        )
      ];
    const content = uwuifier.uwuifySentence(msg.content).substring(0, 2000);
    // uwuify every embed
    for (const embed of msg.embeds) {
      if (embed.title)
        embed.title = uwuifier.uwuifySentence(embed.title).substring(0, 256);
      if (embed.description)
        embed.description = uwuifier
          .uwuifySentence(embed.description)
          .substring(0, 4096);
      if (embed.fields) {
        for (const field of embed.fields) {
          if (field.name)
            field.name = uwuifier.uwuifySentence(field.name).substring(0, 256);
          if (field.value)
            field.value = uwuifier
              .uwuifySentence(field.value)
              .substring(0, 1024);
        }
      }
      if (embed.footer)
        embed.footer.text = uwuifier
          .uwuifySentence(embed.footer.text)
          .substring(0, 2048);
    }
    console.log(`Took ${Date.now() - perf}ms to uwuify`);
    perf = Date.now();
    const hookMsg = await bot.executeWebhook(webhook.id, webhook.token!, {
      content,
      username: msg.author.username,
      avatarURL: msg.author.avatar?.startsWith('a_')
        ? msg.author.dynamicAvatarURL('gif')
        : msg.author.dynamicAvatarURL('png'),
      embeds: msg.embeds,
      allowedMentions: {
        everyone: false,
        repliedUser: true,
        roles: false,
        users: false,
      },
      wait: true,
    });
    hookMsg.edit({
      content,
      embeds: msg.embeds,
      allowedMentions: {
        everyone: true,
        repliedUser: true,
        roles: true,
        users: true,
      },
    });
    
    console.log(`Took ${Date.now() - perf}ms to send webhook`);
    perf = Date.now();
    // get channel bot webhooks
  },
} as EventHandler<'messageCreate'>;
export default KittenifyMessages;
