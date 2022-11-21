import {
  ApplicationCommandOptions,
  CommandClient,
  Constants,
  Message,
  Interaction,
  CommandInteraction,
  ComponentInteraction,
} from 'eris';
export type Command = {
  name: string;
  description: string;
  args: ApplicationCommandOptions[];
  // type any part of Constants.CommandOptionTypes
  type: typeof Constants.ApplicationCommandTypes[keyof typeof Constants.ApplicationCommandTypes];
  execute: (
    bot: BotClient,
    context: {
      // args: string[];
      // message: Message;
      interaction: CommandInteraction;
    }
  ) => Promise<void> | void;
};
export type ComponentInteractionHandler = {
  run: (
    bot: BotClient,
    interaction: ComponentInteraction
  ) => Promise<void> | void;
  limit?: number;
  whitelistUsers?: string[];
  blacklistUsers?: string[];
  interactionid: string;
};
export type BotClient = CommandClient;
