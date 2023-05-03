import Eris from 'eris';
import {
  DazaiPermissions,
  DazaiPermissionsText,
  DazaiPermissionsType,
} from '../types/permissions';

export type Permission = {
  _id?: any;
  guildID: string;
  roleID: string;
  permissions: DazaiPermissionsType[];
};
export class PermissionManager {
  static instance: PermissionManager;
  static getInstance(): PermissionManager {
    if (!PermissionManager.instance)
      PermissionManager.instance = new PermissionManager();
    return PermissionManager.instance;
  }
  private constructor() {}
  async hasPermission(
    guildID: string,
    roles: string[],
    permission: DazaiPermissionsType
  ): Promise<boolean> {
    const guildPerms = await this.getPerms(guildID);
    // for every role the user has, check if it has the permission
    for (const role of [...roles, guildID]) {
      const rolePerms = guildPerms.find((perm) => perm.roleID === role);
      if (rolePerms?.permissions.includes(permission)) return true;
    }
    return false;
  }
  async hasMultiplePermissions(
    guildID: string,
    roles: string[],
    permissions: DazaiPermissionsType[]
  ): Promise<
    | boolean
    | {
        missing: DazaiPermissionsType[];
      }
  > {
    const guildPerms = await this.getPerms(guildID);
    // for every role the user has, check if it has the permission
    let permissionsNeeded = new Set(permissions);
    for (const role of [...roles, guildID]) {
      const rolePerms = guildPerms.find((perm) => perm.roleID === role);
      // match role perms with permissions needed
      for (const perm of rolePerms?.permissions ?? []) {
        if (permissionsNeeded.has(perm)) {
          permissionsNeeded.delete(perm);
        }
      }
      if (permissionsNeeded.size === 0) return true;
    }

    return {
      missing: Array.from(permissionsNeeded),
    };
  }

  hasPermissionFast(
    role: string,
    permission: DazaiPermissionsType,
    guildPermissions: Permission[]
  ): boolean {
    const rolePerms = guildPermissions.find((perm) => perm.roleID === role);
    if (rolePerms?.permissions.includes(permission)) return true;
    return false;
  }
  async getPerms(guildID: string): Promise<Permission[]> {
    const perms = (await MongoDB.db('Guilds')
      .collection('permissions')
      .find({ guildID })
      .toArray()) as Permission[];
    if (!perms.find((perm) => perm.roleID === guildID)) {
      perms.push(await this.setupDefaultPerms(guildID));
    }
    return perms;
  }
  async getPermsForRole(guildID: string, roleID: string): Promise<Permission> {
    const perms = (await MongoDB.db('Guilds')
      .collection('permissions')
      .findOne({ guildID, roleID })) as Permission;
    return perms;
  }
  async addPermToRole(
    guildID: string,
    roleID: string,
    permission: DazaiPermissionsType
  ): Promise<void> {
    const currentPerm = (await this.getPermsForRole(guildID, roleID)) ?? {
      guildID,
      roleID,
      permissions: [],
    };
    currentPerm.permissions.push(permission);
    await this.updatePerm(guildID, roleID, currentPerm.permissions);
  }
  async removePermFromRole(
    guildID: string,
    roleID: string,
    permission: DazaiPermissionsType
  ): Promise<void> {
    const currentPerm = (await this.getPermsForRole(guildID, roleID)) ?? {
      guildID,
      roleID,
      permissions: [],
    };
    currentPerm.permissions = currentPerm.permissions.filter(
      (perm) => perm !== permission
    );
    await this.updatePerm(guildID, roleID, currentPerm.permissions);
  }

  async updatePerm(
    guildID: string,
    roleID: string,
    permissions: DazaiPermissionsType[],
    upsert: boolean = true
  ): Promise<void> {
    await MongoDB.db('Guilds').collection('permissions').updateOne(
      { guildID, roleID },
      { $set: { permissions } },
      {
        upsert,
      }
    );
  }
  async setupDefaultPerms(guildID: string) {
    const newPerms = [
      'playSong',
      'skipSong',
      'shuffleQueue',
      'disconnect',
      'connect',
      'snipe',
      'editSnipe',
      'rank',
      'rankOther',
      'slander',
      'kitten',
    ];
    await this.updatePerm(guildID, guildID, [
      'playSong',
      'skipSong',
      'shuffleQueue',
      'disconnect',
      'connect',
      'snipe',
      'editSnipe',
      'rank',
      'rankOther',
      'slander',
      'kitten',
    ]);

    return await this.getPermsForRole(guildID, guildID);
  }
  async rejectInteraction(
    missingPerms: DazaiPermissionsType[],
    user: Eris.User
  ) {
    return {
      title: 'Missing Permissions',
      description: `You are missing the following permissions: ${missingPerms.map(
        (perm) => `\`${DazaiPermissionsText[perm]}\``
      )}`,
      color: 0xff0000,
      thumbnail: {
        url: 'https://cdn.discordapp.com/attachments/757863990129852509/1102726514426003537/00042.png',
      },
      footer: {
        text: `Requested by ${user.username}#${user.discriminator}`,
        icon_url: user.avatarURL,
      },
    } as Eris.EmbedOptions;
  }
}
