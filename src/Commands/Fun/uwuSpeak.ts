import { Constants, Embed, InteractionDataOptionsUser } from 'eris';
import { XPManager } from '../../Handlers/Levelling/XPManager';
import TetLib from '../../Handlers/TetLib';
import { Command } from '../../types/misc';
import { kittenCacheMap } from '../../Events/HandleKittenTalk';
import { AuditLogManager } from '../../Handlers/Auditor/AuditLogManager';

// This object represents a command to make a user a Discord kitten.
export const uwuSpeak = {
  name: 'kitten', // The name of the command
  description: 'Become a discord kitten', // A brief description of the command
  args: [
    {
      name: 'user', // The name of the argument
      description: '(Admin) force someone else into being a discord kitten', // A brief description of the argument
      type: Constants.ApplicationCommandOptionTypes.USER, // The type of the argument
      required: false, // Whether the argument is required or optional
    },
  ],
  type: Constants.ApplicationCommandTypes.CHAT_INPUT, // The type of the command
  execute: async (bot, { interaction }) => {
    // Check if the command was used in a guild
    if (!interaction.guildID || !interaction.member)
      return interaction.createMessage('This is a guild only command!');

    // Find the selected user ID from the command options
    const selectedUserID = (
      TetLib.findCommandParam(
        interaction.data.options,
        'user'
      ) as InteractionDataOptionsUser
    )?.value;

    // Get the user object for the selected user ID or use the author of the interaction if no user is selected
    const user = selectedUserID
      ? bot.users.get(selectedUserID) || (await bot.getRESTUser(selectedUserID))
      : interaction.user || interaction.member?.user;

    // If the user is not found, send an error message
    if (!user) return interaction.createMessage('User not found!');

    // Check if the command user has permission to make another user a Discord kitten
    if (
      !interaction.member?.permissions.has('administrator') &&
      selectedUserID
    ) {
      // Send an error message if the command user doesn't have permission
      return interaction.createMessage({
        embeds: [
          {
            title: `Cannot make someone else a discord kitten`,
            description: `You do not have permission to do this! you need be a Discord Mod with the \`Administrator\` permission!`,
            color: 16728385,
          },
        ],
      });
    }

    // Get the XP data for the user
    const memData = await XPManager.getInstance().getGuildMemberXP(
      interaction.guildID,
      user.id
    );

    // If the user is already a Discord kitten, change their status to non-kitten
    if (memData.kitten) {
      // If the user is a kitten but not a forced kitten, send an error message if the command user doesn't have permission
      if (
        memData.kitten === 2 &&
        !interaction.member?.permissions.has('administrator')
      ) {
        return interaction.createMessage({
          embeds: [
            {
              title: `Cannot change ${
                selectedUserID ? `${user.username}'s` : `your`
              } kitten status`,
              description: `You do not have permission to do this! you need be a Discord Mod with the \`Administrator\` permission!`,
              color: 16728385,
            },
          ],
        });
      }

      // Update the user's XP data to remove their kitten status
      await XPManager.getInstance().updateGuildMemberXP(
        interaction.guildID,
        user.id,
        {
          kitten: 0,
        }
      );
      kittenCacheMap.delete(`${interaction.guildID}-${user.id}`);

      // Send a success message to
      if (
        selectedUserID &&
        (await AuditLogManager.getInstance().shouldLogAction(
          interaction.guildID,
          'logImpactfulCommands'
        ))
      ) {
        const auditLogEmbed =
          await AuditLogManager.getInstance().generateAuditLogEmbed(
            interaction.guildID,
            interaction.member.id || interaction.user?.id!
          );
        auditLogEmbed.title = `Kitten status removed`;
        auditLogEmbed.description = `**User:** ${user.username}#${
          user.discriminator
        } (${user.id})\n**Moderator:** ${
          interaction.member?.nick || interaction.member?.username
        }#${interaction.member?.discriminator} (<@${interaction.member?.id}>)`;
        await AuditLogManager.getInstance().logAuditMessage(
          interaction.guildID,
          auditLogEmbed as Embed
        );
      }
      return interaction.createMessage({
        embeds: [
          {
            title: `${
              selectedUserID ? `${user.username} is ` : `You're`
            } no longer a discord kitten`,
            description: `${
              selectedUserID ? `${user.username} is ` : `You're`
            } no longer a discord kitten and now can talk normally!`,
            color: 16728385,
          },
        ],
      });
    }

    // If the user is not a Discord kitten, make them a kitten
    await XPManager.getInstance().updateGuildMemberXP(
      interaction.guildID,
      user.id,
      {
        kitten:
          selectedUserID && interaction.member?.permissions.has('administrator')
            ? 2
            : 1,
      }
    );
    kittenCacheMap.set(`${interaction.guildID}-${user.id}`, true);
    if (
      selectedUserID &&
      (await AuditLogManager.getInstance().shouldLogAction(
        interaction.guildID,
        'logImpactfulCommands'
      ))
    ) {
      const auditLogEmbed =
        await AuditLogManager.getInstance().generateAuditLogEmbed(
          interaction.guildID,
          interaction.member.id || interaction.user?.id!
        );
      auditLogEmbed.title = `Kitten status added`;
      auditLogEmbed.description = `**User:** ${user.username}#${
        user.discriminator
      } (${user.id})\n**Moderator:** ${
        interaction.member?.nick || interaction.member?.username
      }#${interaction.member?.discriminator} (<@${interaction.member?.id}>)`;
      await AuditLogManager.getInstance().logAuditMessage(
        interaction.guildID,
        auditLogEmbed as Embed
      );
    }
    // Send a success message
    return interaction.createMessage({
      embeds: [
        {
          title: `${
            selectedUserID ? `${user.username} is ` : `You're`
          } now a discord kitten`,
          description: `${
            selectedUserID ? `${user.username} is ` : `You're`
          } now a discord kitten and now can only talk in uwu!`,
          color: 16728385,
        },
      ],
    });
  },
} as Command;

export default uwuSpeak;
