// Importing required modules and files
import {
  ComponentInteraction,
  ComponentInteractionSelectMenuData,
  Constants,
  EmbedField,
  EmbedOptions,
  InteractionDataOptionsString,
  Member,
  Role,
} from 'eris';
import { Command } from '../../types/misc';
import TetLib from '../../Handlers/TetLib';
import { migrateXP } from '../../Scripts/migrateXP';
import { sellAllButOneScript } from '../../Scripts/sellAllButOne';
import { giveCrates } from '../../Scripts/giveGlobalCrate';
import {
  Permission,
  PermissionManager,
} from '../../Handlers/PermissionHandler';
import {
  DazaiPermissionsText,
  DazaiPermissionsType,
} from '../../types/permissions';
import { InteractionCollector } from '../../Handlers/InteractionCollector';

const formatPermissionEntry = (
  permission: DazaiPermissionsType,
  role: string,
  adminOverride?: boolean
) =>
  ({
    name: `✅ - ${DazaiPermissionsText[permission]}`,
    value: adminOverride
      ? `Member has Discord Permission \`Administrator\`, overriding Dazai Permissions.`
      : `Permission from role <@&${role}>`,
  } as EmbedField);

// Defining the scriptRun command as a constant
export const scriptRun = {
  // Command name and description
  name: 'permissions',
  description: 'View what a user can/cannot do',
  // Command arguments
  args: [
    {
      name: 'user',
      description: 'The user to view permissions for (you if blank)',
      type: Constants.ApplicationCommandOptionTypes.USER,
      required: false,
    },
    {
      name: 'role',
      description: 'The role to view permissions for (optional)',
      type: Constants.ApplicationCommandOptionTypes.ROLE,
      required: false,
    },
  ],
  // Command type
  type: Constants.ApplicationCommandTypes.CHAT_INPUT,
  // Command execution function
  execute: async (bot, { interaction }) => {
    // Finding the command argument passed by the user
    const userID = TetLib.findCommandParam(
      interaction.data.options,
      'user'
    ) as InteractionDataOptionsString;
    const roleID = TetLib.findCommandParam(
      interaction.data.options,
      'role'
    ) as InteractionDataOptionsString;
    if (userID && roleID) {
      return interaction.createMessage({
        embeds: [
          {
            title: `Cannot view permissions`,
            description: `Please provide either a user or a role, not both!`,
            color: 16728385,
          },
        ],
      });
    }
    if (!interaction.guildID) {
      return interaction.createMessage({
        embeds: [
          {
            title: `Cannot view permissions`,
            description: `This command can only be used in a server!`,
            color: 16728385,
          },
        ],
      });
    }
    const totalPermissions = new Map<string, string>(); // Map of permission names to roleID that has them
    const user =
      !roleID?.value &&
      (userID?.value ?? (interaction.member?.user || interaction.user!).id);
    const member =
      !roleID?.value &&
      (bot.guilds.get(interaction.guildID)?.members.get(user as string) ||
        (await bot.getRESTGuildMember(interaction.guildID!, user as string)));
    if (!member && !roleID?.value) {
      return interaction.createMessage({
        embeds: [
          {
            title: `Cannot view permissions`,
            description: `That user/role does not exist!`,
            color: 16728385,
          },
        ],
      });
    }
    const guildRoles = (
      bot.guilds.get(interaction.guildID) ||
      (await bot.getRESTGuild(interaction.guildID))
    )?.roles;
    // sort user's roles by position
    const memberRoles = !roleID?.value && [
      ...((
        (member as Member).roles
          .map((roleID) => guildRoles?.get(roleID))
          .filter((x) => x) as Role[]
      ).sort((a, b) => (b?.position || 0) - (a?.position || 0)) || []),
      interaction.guildID,
    ];
    // get all permissions
    const allServerPermissions = await PermissionManager.getInstance().getPerms(
      interaction.guildID
    );
    const allServerPermissionsMap = new Map<string, Permission>();
    allServerPermissions.map((perm) => {
      allServerPermissionsMap.set(perm.roleID, perm);
    });
    if (memberRoles)
      for (const role of memberRoles) {
        const rolePerms = allServerPermissionsMap.get(role.id);
        if (!rolePerms) continue;
        for (const perm of rolePerms.permissions) {
          if (!totalPermissions.has(perm)) {
            totalPermissions.set(perm, role.id);
          }
        }
      }
    if (roleID) {
      const rolePerms = allServerPermissionsMap.get(roleID?.value);
      if (!rolePerms || !rolePerms.permissions.length) {
        return interaction.createMessage({
          embeds: [
            {
              title: `No permissions found`,
              description: `This role has no permissions!`,
              color: 16728385,
            },
          ],
        });
      }
      for (const perm of rolePerms.permissions) {
        if (!totalPermissions.has(perm)) {
          totalPermissions.set(perm, roleID?.value);
        }
      }
    }

    const embedFields: EmbedField[] = [];
    for (const perm of Object.keys(DazaiPermissionsText)) {
      if (totalPermissions.has(perm)) {
        embedFields.push(
          formatPermissionEntry(
            perm as DazaiPermissionsType,
            totalPermissions.get(perm)!
          )
        );
      } else if (
        (member && member.permissions.has('administrator')) ||
        (roleID?.value &&
          guildRoles.get(roleID?.value)?.permissions.has('administrator'))
      ) {
        embedFields.push(
          formatPermissionEntry(
            perm as DazaiPermissionsType,
            'Administrator',
            true
          )
        );
      }
    }
    if (!embedFields.length) {
      return interaction.createMessage({
        embeds: [
          {
            title: `No permissions found`,
            description: `This user has no permissions!`,
            color: 16728385,
          },
        ],
      });
    }
    const baseEmbed = (fields: EmbedField[], page: number, max: number) =>
      ({
        title: `Permissions for ${
          roleID
            ? `Role __guildRoles.get(roleID?.value)?.name__`
            : `__${(member as Member).user.username}#${
                (member as Member).user.discriminator
              }__`
        }`,
        description: `Showing page ${page}/${max}`,
        color: 16777215,
        fields,
      } as EmbedOptions);
    const embeds = [] as EmbedOptions[];
    const embedsPerPage = 10;
    let page = 1;
    for (let i = 0; i < embedFields.length; i += embedsPerPage) {
      embeds.push(
        baseEmbed(
          embedFields.slice(i, i + embedsPerPage),
          Math.floor(i / embedsPerPage) + 1,
          Math.ceil(embedFields.length / embedsPerPage)
        )
      );
    }
    await interaction.acknowledge();
    const msg = await interaction.createFollowup({
      embeds: [embeds[page - 1]],
      components: [
        {
          type: Constants.ComponentTypes.ACTION_ROW,
          components: [
            {
              type: Constants.ComponentTypes.BUTTON,
              label: 'View Online',
              emoji: {
                name: '🌐',
              },
              style: 5,
              url: `${env.website}/app/guild/${interaction.guildID}/music?`,
            },
          ],
        },
        {
          type: Constants.ComponentTypes.ACTION_ROW,
          components: [
            {
              type: Constants.ComponentTypes.SELECT_MENU,
              custom_id: 'pageSelect',
              placeholder: 'Jump to page',
              options: embeds
                .map((_, index) => ({
                  label: `Page ${index + 1}`,
                  value: `${index + 1}`,
                }))
                .slice(0, 25),
            },
          ],
        },
        {
          type: Constants.ComponentTypes.ACTION_ROW,
          components: [
            {
              type: Constants.ComponentTypes.BUTTON,
              custom_id: 'pageLeft',
              label: 'Previous page',
              emoji: {
                name: '⬅️',
              },
              style: 1,
              disabled: page === 1,
            },
            {
              type: Constants.ComponentTypes.BUTTON,
              custom_id: 'pageRight',
              label: 'Next page',
              emoji: {
                name: '➡️',
              },
              style: 1,
              disabled: page === embeds.length,
            },
          ],
        },
      ],
    });
    const editPage = async (pg: number, interaction: ComponentInteraction) => {
      page = pg;
      await msg.edit({
        embeds: [embeds[page - 1]],
        components: [
          {
            type: Constants.ComponentTypes.ACTION_ROW,
            components: [
              {
                type: Constants.ComponentTypes.SELECT_MENU,
                custom_id: 'pageSelect',
                placeholder: 'Jump to page',
                options: embeds
                  .map((_, index) => ({
                    label: `Page ${index + 1}`,
                    value: `${index + 1}`,
                  }))
                  .slice(0, 25),
              },
            ],
          },
          {
            type: Constants.ComponentTypes.ACTION_ROW,
            components: [
              {
                type: Constants.ComponentTypes.BUTTON,
                custom_id: 'pageLeft',
                label: 'Previous page',
                emoji: {
                  name: '⬅️',
                },
                style: 1,
                disabled: Number(page) === 1,
              },
              {
                type: Constants.ComponentTypes.BUTTON,
                custom_id: 'pageRight',
                label: 'Next page',
                emoji: {
                  name: '➡️',
                },
                style: 1,
                disabled: Number(page) === embeds.length,
              },
            ],
          },
        ],
      });
      await interaction.acknowledge();
    };

    InteractionCollector.getInstance().collectInteraction(
      {
        interactionid: 'pageSelect',
        run: async (bot, interaction) => {
          let pg = ~~(interaction.data as ComponentInteractionSelectMenuData)
            .values[0];
          await editPage(pg, interaction);
          // interaction.acknowledge()
        },
        limit: 100000,
        whitelistUsers: [(interaction.user || interaction.member?.user!).id],
        doNotAcknowledge: true,
      },
      msg,
      1000 * 120
    );
    InteractionCollector.getInstance().collectInteraction(
      {
        interactionid: 'pageLeft',
        run: async (bot, interaction) => {
          await editPage(page - 1, interaction);
          // interaction.acknowledge()
        },
        doNotAcknowledge: true,
        whitelistUsers: [(interaction.user || interaction.member?.user!).id],
      },
      msg,
      1000 * 120
    );
    InteractionCollector.getInstance().collectInteraction(
      {
        interactionid: 'pageRight',
        run: async (bot, interaction) => {
          await editPage(page + 1, interaction);
          // interaction.acknowledge()
        },
        doNotAcknowledge: true,
        whitelistUsers: [(interaction.user || interaction.member?.user!).id],
      },
      msg,
      1000 * 120
    );
  },
} as Command;

// Exporting the scriptRun command as the default export
export default scriptRun;
