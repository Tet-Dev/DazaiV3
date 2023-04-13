import {
  EmbedOptions,
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
// import translate from 'google-translate-api-x';
const uwuifier = new Uwuifier();
// seeded random number generator
const random = (seed: number) => {
  var x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
};
function isASCII(str: string, extended: boolean) {
  return (extended ? /^[\x00-\xFF]*$/ : /^[\x00-\x7F]*$/).test(str);
}
export const kittenCacheMap = new Map<string, boolean>();
export const kittenedMessageIDs = new Set<string>();
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
    //@ts-ignore
    if (env.devmode) return;
    if (!msg.guildID) return;

    let perf = Date.now();
    if (!kittenCacheMap.get(`${msg.guildID}-${msg.author.id}`)) {
      const userxpdata = await XPManager.getInstance().getGuildMemberXP(
        msg.guildID,
        msg.author.id
      );
      const isKitten = !!userxpdata?.kitten ?? false;
      if (!isKitten)
        return kittenCacheMap.set(`${msg.guildID}-${msg.author.id}`, false);
      kittenCacheMap.set(`${msg.guildID}-${msg.author.id}`, true);
    }
    if (msg.components?.length) return;
    if (msg.attachments.length) return;
    kittenedMessageIDs.add(msg.id);
    setTimeout(() => {
      kittenedMessageIDs.delete(msg.id);
    }, 10000);
    msg.delete();

    const channel = (msg.channel as TextableChannel).client
      ? (msg.channel as TextableChannel)
      : ((await bot.getRESTChannel(msg.channel.id)) as TextableChannel);
    if (channel.type !== 0) return;
    const textChannel = channel as TextChannel;
    perf = Date.now();
    const webhooks = await getChannelWebhooks(channel);
    perf = Date.now();
    const webhook =
      webhooks[
        Math.floor(
          random(parseInt(msg.author.id.substring(msg.author.id.length - 8))) *
            webhooks.length
        )
      ];
    const content =
      // isASCII(msg.content, true)
      //   ?
      uwuifier.uwuifySentence(msg.content).substring(0, 2000);
    // : uwuifier
    //     .uwuifySentence(
    //       (
    //         await translate(msg.content, {
    //           from: 'auto',
    //           to: 'en',
    //         })
    //       ).text
    //     )
    //     .substring(0, 2000);
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
    perf = Date.now();
    const embeds = [...msg.embeds] as EmbedOptions[];
    if (msg.referencedMessage) {
      embeds.push({
        author: {
          name: `${msg.referencedMessage?.author.username}#${msg.referencedMessage.author.discriminator}`,
          icon_url: msg.referencedMessage?.author.avatar?.startsWith('a_')
            ? msg.referencedMessage?.author.dynamicAvatarURL('gif')
            : msg.referencedMessage?.author.dynamicAvatarURL('png'),
        },
        description: `
        ${msg.referencedMessage.content} [[Jump]](${msg.referencedMessage.jumpLink})`,
      });
    }

    const hookMsg = await bot.executeWebhook(webhook.id, webhook.token!, {
      content,
      username: msg.author.username,
      avatarURL: msg.author.avatar?.startsWith('a_')
        ? msg.author.dynamicAvatarURL('gif')
        : msg.author.dynamicAvatarURL('png'),
      embeds: embeds,
      allowedMentions: {
        everyone: false,
        repliedUser: true,
        roles: false,
        users: false,
      },
      wait: true,
    });
    // only edit if there was a ping

    hookMsg.editWebhook(webhook.token!, {
      content,
      embeds,
      allowedMentions: {
        everyone: true,
        repliedUser: true,
        roles: true,
        users: true,
      },
    });

    console.log(`Took ${Date.now() - perf}ms to send webhook`);
    perf = Date.now();
    const userxpdata = await XPManager.getInstance().getGuildMemberXP(
      msg.guildID,
      msg.author.id
    );
    const isKitten = !!userxpdata?.kitten ?? false;
    if (!isKitten)
      return kittenCacheMap.set(`${msg.guildID}-${msg.author.id}`, false);
    kittenCacheMap.set(`${msg.guildID}-${msg.author.id}`, true);
    // get channel bot webhooks
  },
} as EventHandler<'messageCreate'>;
export default KittenifyMessages;
