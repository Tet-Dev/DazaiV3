import Eris, { Embed, Guild, Member } from 'eris';

export type GuildAuditLogPreference = {
  guildID: string;
  channelID: string;
  enabled: boolean;
  preferences: Partial<AuditLogPreferences>;
};
export enum AuditLogPreferenceKey {
  logMessageEdits = 'logMessageEdits',
  logMessageDeletes = 'logMessageDeletes',
  logMessageBulkDeletes = 'logMessageBulkDeletes',
  logRankCardEdits = 'logRankCardEdits',
  logCrateEdits = 'logCrateEdits',
  logLevelRewardsEdits = 'logLevelRewardsEdits',
  logShopEdits = 'logShopEdits',
  logShopPurchase = 'logShopPurchase',
  logImpactfulCommands = 'logImpactfulCommands',
  logReactionRoleEdits = 'logReactionRoleEdits',
  logMemberJoins = 'logMemberJoins',
  logMemberLeaves = 'logMemberLeaves',
}
type AuditLogPreferenceKeyString = keyof typeof AuditLogPreferenceKey;
export type AuditLogPreferences = {
  [key in AuditLogPreferenceKey]: boolean;
};
const defaultAuditLogPreferences = (guildID: string) =>
  ({
    guildID,
    channelID: '',
    enabled: false,
    preferences: {
      logAuditLogEdits: false,
      logMessageEdits: false,
      logMessageDeletes: false,
      logMessageBulkDeletes: false,
      logRankCardEdits: false,
      logCrateEdits: false,
      logLevelRewardsEdits: false,
      logShopEdits: false,
      logShopPurchase: false,
      logImpactfulCommands: false,
      logMemberJoins: false,
      logMemberLeaves: true,
    },
  } as GuildAuditLogPreference);

export class AuditLogManager {
  static instance: AuditLogManager;
  static getInstance(): AuditLogManager {
    if (!AuditLogManager.instance)
      AuditLogManager.instance = new AuditLogManager();
    return AuditLogManager.instance;
  }
  private constructor() {}
  async getAuditLogPreference(guildID: string) {
    const auditLogPreference = (await MongoDB.db('Guilds')
      .collection('auditLogPrefs')
      .findOne({ guildID })) as GuildAuditLogPreference | null;
    if (!auditLogPreference) {
      await MongoDB.db('Guilds')
        .collection('auditLogPrefs')
        .insertOne(defaultAuditLogPreferences(guildID));
      return defaultAuditLogPreferences(guildID);
    }
    return auditLogPreference;
  }
  async updateAuditLogPreference(
    guildID: string,
    auditLogPreference: GuildAuditLogPreference
  ) {
    await MongoDB.db('Guilds')
      .collection('auditLogPrefs')
      .updateOne({ guildID }, { $set: auditLogPreference }, { upsert: true });
    return auditLogPreference;
  }
  async logAuditMessage(guildID: string, embed: Eris.Embed) {
    await this.getAuditLogPreference(guildID).then(
      async (auditLogPreference) => {
        if (!auditLogPreference.enabled) return;
        const channel = await bot.getChannel(auditLogPreference.channelID);
        if (!channel) return;
        await (channel as Eris.TextChannel).createMessage({ embed });
      }
    );
  }
  async shouldLogAction(guildID: string, action: AuditLogPreferenceKeyString) {
    const auditLogPreference = await this.getAuditLogPreference(guildID);
    if (!auditLogPreference.enabled || !auditLogPreference.channelID)
      return false;
    return auditLogPreference.preferences[action];
  }
  async generateAuditLogEmbed(guild: string | Guild, member: string | Member) {
    const guildObj =
      typeof guild === 'string'
        ? bot.guilds.get(guild) || (await bot.getRESTGuild(guild))
        : guild;
    const memberObj =
      typeof member === 'string'
        ? guildObj.members.get(member) || (await guildObj.getRESTMember(member))
        : member;

    return {
      color: 16758360,
      footer: {
        icon_url: `${
          memberObj.avatar?.startsWith('a_')
            ? memberObj.dynamicAvatarURL('gif', 1024)
            : memberObj.avatarURL
        }`,
        text: `${memberObj.nick || memberObj.username}#${
          memberObj.discriminator
        } (${memberObj.id})`,
      },
      timestamp: new Date().toISOString(),
    } as Embed;
  }
}
