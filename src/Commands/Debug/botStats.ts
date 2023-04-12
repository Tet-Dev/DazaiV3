/**
 * Command to get bot statistics.
 *
 * @type {Command}
 */
import Eris, { Constants } from 'eris';
import { Command } from '../../types/misc';
import { MusicManager } from '../../Handlers/Music/MusicPlayer';

export const botstats = {
  name: 'botstats',
  description: 'Gets Bot Statistics',
  args: [],
  type: Constants.ApplicationCommandTypes.CHAT_INPUT,

  /**
   * Executes the botstats command.
   * @param {Eris.Client} bot The Eris client.
   * @param {Eris.CommandInteractionOption} interaction The interaction object.
   * @returns {Promise<void>}
   */
  execute: async (bot, { interaction }) => {
    if (!interaction.guildID) {
      // If the command is used in a DM or Group DM, return an error message.
      return interaction.createMessage(
        'This command can only be used in a server!'
      );
    }

    // Get the guild object.
    const guild =
      bot.guilds.get(interaction.guildID) ??
      (await bot.getRESTGuild(interaction.guildID));
    // Get the shard ID.
    const shard = guild.shard;
    // Create an array of fields to display in the embed.
    const fields = [
      {
        name: 'Message Latency',
        value: `${Date.now() - interaction.createdAt}ms`,
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
        name: 'Shards',
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
        value: `<@!${env.adminID}>`,
      },
    ] as Eris.EmbedField[];

    // Send the embed message.
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
    });

    return;
  },
} as Command;

export default botstats;
