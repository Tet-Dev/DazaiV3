import { ObjectID } from 'bson';
import Eris, { CommandClient, EmbedField, Member, Role, Uncached } from 'eris';

export class ReactionRoleManager {
  static instance: ReactionRoleManager;
  static getInstance(): ReactionRoleManager {
    if (!ReactionRoleManager.instance)
      ReactionRoleManager.instance = new ReactionRoleManager();
    return ReactionRoleManager.instance;
  }
  async init(bot: CommandClient) {
    bot.on('messageReactionAdd', this.handleReactionAdd.bind(this));
    bot.on('messageReactionRemove', this.handleReactionRemove.bind(this));
  }
  async handleReactionAdd(
    msg: Eris.Message,
    emoji: Eris.PartialEmoji,
    user: Member | Uncached
  ) {
    console.log('reaction added', msg.id, emoji, user.id);
    const guild = msg.guildID;
    if (!guild) return;
    const channel = msg.channel.id;
    const message = msg.id;
    const reactionRoles = await this.getReactionRolesForMessage(
      guild,
      channel,
      message
    );
    const executableReactionRoles = reactionRoles.filter(
      (x) =>
        x.reaction.name === emoji.name &&
        (x.reaction.id ? x.reaction.id === emoji.id : true)
    );
    if (!executableReactionRoles.length) return;
    const member =
      bot.guilds.get(guild)?.members.get(user.id) ||
      (await bot.getRESTGuildMember(guild, user.id));
    if (!member) return;
    const dm = await member.user.getDMChannel();
    const guildRoles =
      (await member.guild.roles) ||
      (await member.guild
        .getRESTRoles()
        .then((x) => new Map(x.map((y) => [y.id, y]))));
    const actionMap = {
      added: [],
      removed: [],
    } as {
      added: Role[];
      removed: Role[];
    };
    for (const reactionRole of executableReactionRoles) {
      const role = guildRoles.get(reactionRole.roleID);
      if (!role) continue;
      const hasRole = member.roles.includes(role.id);
      switch (reactionRole.actionType) {
        case 'add':
          if (hasRole) break;
          await member.addRole(role.id, `Reaction Role`);
          actionMap.added.push(role);
          break;
        case 'remove':
          if (!hasRole) break;
          await member.removeRole(role.id, `Reaction Role`);
          actionMap.removed.push(role);
          break;
        case 'both':
          if (hasRole) break;
          await member.addRole(role.id, `Reaction Role`);
          actionMap.added.push(role);
          break;
        case 'oppositeBoth':
          if (!hasRole) break;
          await member.removeRole(role.id, `Reaction Role`);
          actionMap.removed.push(role);
      }
    }
    let fields = [] as EmbedField[];
    if (actionMap.removed.length) {
      fields.push({
        name: `Removed Roles`,
        value: `\`\`\`\n${actionMap.removed
          .map((x) => `${x.name}`)
          .join('\n')}\n\`\`\``,
      });
    }
    if (actionMap.added.length) {
      fields.push({
        name: `Added Roles`,
        value: `\`\`\`\n${actionMap.added
          .map((x) => `${x.name}`)
          .join('\n')}\n\`\`\``,
      });
    }
    if (!fields.length) return;
    await dm.createMessage({
      embeds: [
        {
          title: `Reaction Role Action`,
          description: `You reacted to a message in \n### ${member.guild.name}\n and were given the following roles:`,
          fields,
          thumbnail: {
            url: member.guild.iconURL || bot.user.avatarURL,
          },
        },
      ],
    });
  }
  async handleReactionRemove(
    msg: Eris.Message,
    emoji: Eris.PartialEmoji,
    userID: string
  ) {
    console.log('reaction removed', msg.id, emoji, userID);
    const guild = msg.guildID;
    if (!guild) return;
    const channel = msg.channel.id;
    const message = msg.id;
    const reactionRoles = await this.getReactionRolesForMessage(
      guild,
      channel,
      message
    );
    const executableReactionRoles = reactionRoles.filter(
      (x) =>
        x.reaction.name === emoji.name &&
        (x.reaction.id ? x.reaction.id === emoji.id : true)
    );
    if (!executableReactionRoles.length) return;
    const member =
      bot.guilds.get(guild)?.members.get(userID) ||
      (await bot.getRESTGuildMember(guild, userID));
    if (!member) return;
    const dm = await member.user.getDMChannel();
    const guildRoles =
      member.guild.roles ||
      (await member.guild
        .getRESTRoles()
        .then((x) => new Map(x.map((y) => [y.id, y]))));
    const actionMap = {
      added: [],
      removed: [],
    } as {
      added: Role[];
      removed: Role[];
    };
    for (const reactionRole of executableReactionRoles) {
      const role = guildRoles.get(reactionRole.roleID);
      if (!role) continue;
      const hasRole = member.roles.includes(role.id);
      switch (reactionRole.actionType) {
        case 'both':
          if (!hasRole) break;
          await member.removeRole(role.id, `Reaction Role`);
          actionMap.removed.push(role);
          break;
        case 'oppositeBoth':
          if (hasRole) break;
          await member.addRole(role.id, `Reaction Role`);
          actionMap.added.push(role);
          break;
      }
    }
    let fields = [] as EmbedField[];
    if (actionMap.removed.length) {
      fields.push({
        name: `Removed Roles`,
        value: `\`\`\`\n${actionMap.removed
          .map((x) => `${x.name}`)
          .join('\n')}\n\`\`\``,
      });
    }
    if (actionMap.added.length) {
      fields.push({
        name: `Added Roles`,
        value: `\`\`\`\n${actionMap.added
          .map((x) => `${x.name}`)
          .join('\n')}\n\`\`\``,
      });
    }
    if (!fields.length) return;
    await dm.createMessage({
      embeds: [
        {
          title: `Reaction Role Action`,
          description: `You unreacted to a message in \n### ${member.guild.name}\n and were given the following roles:`,
          fields,
          thumbnail: {
            url: member.guild.iconURL || bot.user.avatarURL,
          },
        },
      ],
    });
  }
  async getReactionRolesForMessage(
    guild: string,
    channel: string,
    message: string
  ) {
    const reactionRoles = (await MongoDB.db('Guilds')
      .collection('reactionRoles')
      .find({
        guild,
        channel,
        message,
      })
      .toArray()) as ReactionRoleRaw[];
    return reactionRoles.map((x) => ({
      ...x,
      _id: x._id.toString(),
    })) as ReactionRole[];
  }
  async getReationRolesForGuild(guild: string) {
    const reactionRoles = (await MongoDB.db('Guilds')
      .collection('reactionRoles')
      .find({
        guild,
      })
      .toArray()) as ReactionRoleRaw[];
    return reactionRoles.map((x) => ({
      ...x,
      _id: x._id.toString(),
    })) as ReactionRole[];
  }
  async getReactionRoleByID(id: string) {
    const reactionRole = await MongoDB.db('Guilds')
      .collection('reactionRoles')
      .findOne({
        _id: new ObjectID(id),
      });
    return reactionRole;
  }
  async createReactionRole(reactionRole: ReactionRole) {
    const result = await MongoDB.db('Guilds')
      .collection('reactionRoles')
      .insertOne({
        ...reactionRole,
        _id: new ObjectID(),
      });
    return result.insertedId;
  }
  async removeReactionRole(id: string) {
    const result = await MongoDB.db('Guilds')
      .collection('reactionRoles')
      .deleteOne({
        _id: new ObjectID(id),
      });
    return result.deletedCount;
  }
}

export type ReactionRoleRaw = {
  _id: ObjectID;
  guild: string;
  channel: string;
  message: string;
  reaction: {
    name: string;
    id?: string;
  };
  roleID: string;
  actionType: ReactionRoleActionType;
};

export type ReactionRole = Omit<ReactionRoleRaw, '_id'> & {
  _id?: string;
};
export type ReactionRoleActionType = 'add' | 'remove' | 'both' | 'oppositeBoth';
export enum ReactionRoleActionTypeExplanation {
  add = 'Adds the role when the reaction is added, does nothing when the reaction is removed',
  remove = 'Removes the role when the reaction is added, does nothing when the reaction is removed',
  both = 'Adds the role when the reaction is added, removes the role when the reaction is removed',
  oppositeBoth = 'Removes the role when the reaction is added, adds the role when the reaction is removed',
}
