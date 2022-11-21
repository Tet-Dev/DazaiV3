import { CommandInteraction, Interaction } from 'eris';
import { Command } from '../types/misc';

export class SlashCommandHandler {
  static instance: SlashCommandHandler;
  static getInstance(): SlashCommandHandler {
    if (!SlashCommandHandler.instance)
      SlashCommandHandler.instance = new SlashCommandHandler();
    return SlashCommandHandler.instance;
  }
  commands: Map<string, Command> = new Map();
  devMode: boolean = true;
  private constructor() {
    if (bot.ready) this.onReady();
    else bot.on('ready', this.onReady.bind(this));
    bot.on('interactionCreate', this.handleInteraction.bind(this));
  }
  createDevCommand(command: Command) {
    bot.createGuildCommand('739559911033405592', command);
  }
  async onReady() {
    const create = this.devMode ? this.createDevCommand : bot.createCommand;
    this.commands.forEach(async command => {
      await create(command);
    });
  }
  async registerCommand(command: Command) {
    const create = this.devMode ? this.createDevCommand : bot.createCommand;
    await create(command);
  }

  loadCommand(command: Command) {
    this.commands.set(command.name, command);
    if (bot.ready) this.registerCommand(command);
  }
  getCommand(name: string): Command | undefined {
    return this.commands.get(name);
  }
  handleInteraction(interaction: Interaction) {
    if (interaction instanceof CommandInteraction) {
      const command = this.getCommand(interaction.data.name);
      if (!command) return;
      command.execute(bot, {
        interaction,
        // args: interaction.data.options.map(option => option.value),
      });
    }
  }
}
