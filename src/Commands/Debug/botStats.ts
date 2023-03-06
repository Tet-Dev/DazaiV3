import Eris, { Constants } from 'eris';
import { Command } from '../../types/misc';
import { InteractionCollector } from '../../Handlers/InteractionCollector';
import { MusicManager } from '../../Handlers/Music/MusicPlayer';
export const ping = {
  name: 'botstats',
  description: 'Gets Bot Statistics',
  args: [],
  type: Constants.ApplicationCommandTypes.CHAT_INPUT,
  execute: async (bot, { interaction }) => {
    if (!interaction.guildID)
      return interaction.createMessage(
        'This command can only be used in a server!'
      );
    // const start = Date.now();
    // await interaction.createMessage('Pinging...');
    // const end = Date.now();
    // let clicks = 0;
    // check the shard id of the bot
    const guild =
      bot.guilds.get(interaction.guildID) ??
      (await bot.getRESTGuild(interaction.guildID));
    const shard = guild.shard;
    const fields = [
      {
        name: 'Discord Ping',
        value: `${shard.latency}ms`,
        inline: true,
      },
      {
        name: 'Server Count (per Instance)',
        value: `${bot.guilds.size}`,
        inline: true,
      },
      {
        name: 'Shard ID',
        value: `${shard.id}`,
        inline: true,
      },
      {
        name: 'Shard Count',
        value: `${bot.shards.size}`,
        inline: true,
      },
      {
        name: 'Memory Usage',
        value: `${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB`,
        inline: true,
      },
      {
        name: 'Uptime',
        value: `${Math.floor(bot.uptime / 1000 / 60 / 60)}h ${
          Math.floor(bot.uptime / 1000 / 60) % 60
        }m ${Math.floor(bot.uptime / 1000) % 60}s`,
        inline: true,
      },
      {
        name: 'Node.js Version',
        value: `${process.version}`,
        inline: true,
      },
      {
        name: 'Music servers',
        value: `${MusicManager.getInstance().guildMap.size}`,
        inline: true,
      },
      {
        name: 'Developer',
        value: `<@!295391243318591490>`,
      },
    ] as Eris.EmbedField[];
    const msg = await interaction.createMessage({
      embeds: [
        {
          title: 'Bot Statistics :heartbeat:',
          color: 11629370,
          fields,
          thumbnail: {
            url: bot.user.dynamicAvatarURL('png', 1024),
          },
        },
      ],
      // components: [
      //   {
      //     type: Constants.ComponentTypes.ACTION_ROW,
      //     components: [
      //       {
      //         type: Constants.ComponentTypes.BUTTON,
      //         label: 'Try again',
      //         style: Constants.ButtonStyles.PRIMARY,
      //         emoji: {
      //           name: '🔁',
      //           // id: '787190767105867776',
      //           animated: true,
      //         },
      //         custom_id: 'tryagain',
      //       },
      //     ],
      //   },
      // ],
    });
    // InteractionCollector.getInstance().collectInteraction(
    //   {
    //     interactionid: 'tryagain',
    //     run: async (bot, interaction) => {
    //       // clicks++;
    //       await msg.edit(
    //         `Interaction took ${Date.now() - interaction.createdAt}ms`
    //       );
    //     },
    //     limit: 5,
    //   },
    //   msg,
    //   1000*20
    // );
    // (bot as  ErisComponents.Client);
    return;
  },
} as Command;

export default ping;
