import { ComponentInteraction, Message } from 'eris';
import { ComponentInteractionHandler } from '../types/misc';

export class InteractionCollector {
  static instance: InteractionCollector;
  static getInstance(): InteractionCollector {
    if (!InteractionCollector.instance)
      InteractionCollector.instance = new InteractionCollector();
    return InteractionCollector.instance;
  }
  interactions: Map<string, ComponentInteractionHandler> = new Map();
  private constructor() {
    bot.on('interactionCreate', this.handleInteraction.bind(this));
  }
  async handleInteraction(interaction: ComponentInteraction) {
    if (!(interaction instanceof ComponentInteraction)) return;
    const handler = this.interactions.get(
      `${interaction.message.id} ${interaction.data.custom_id}`
    );
    const userID = interaction.member
      ? interaction.member.user.id
      : interaction.user!.id;
    // console.log(handler, interaction);

    if (!handler) return;
    if (handler.blacklistUsers?.includes(userID))
      return interaction.createMessage({
        content: 'You cannot use this button.',
        flags: 64,
      });
    if (!handler.whitelistUsers?.includes(userID) && handler.whitelistUsers)
      return interaction.createMessage({
        content: 'You cannot use this button.',
        flags: 64,
      });
    if (typeof handler.limit !== 'undefined') {
      if (handler.limit <= 0) {
        interaction.message.edit({
          components: [],
        });
        return interaction.createMessage({
          content: 'You cannot use this button anymore.',
          flags: 64,
        });
      }
      handler.limit--;
    }
    await interaction.acknowledge();
    handler.run(bot, interaction);
    return;
  }
  collectInteraction(
    handler: ComponentInteractionHandler,
    message: Message,
    timeout: number
  ) {
    this.interactions.set(`${message.id} ${handler.interactionid}`, handler);
    setTimeout(() => {
      this.interactions.delete(`${message.id} ${handler.interactionid}`);
      message.edit({
        components: [],
      }).catch(() => {});
    }, timeout);
  }
  deleteInteraction(messageID: string, interactionID: string) {
    this.interactions.delete(`${messageID} ${interactionID}`);
  }
}
