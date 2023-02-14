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
  devMode: boolean = false;
  private constructor() {
    if (bot.ready) this.onReady();
    else bot.on('ready', this.onReady.bind(this));
    bot.on('interactionCreate', this.handleInteraction.bind(this));
  }
  createDevCommand(command: Command) {
    bot
      .createGuildCommand('1061108960268124210', {
        ...command,
        options: command.args,
      })
      .catch((e) => {
        console.error(e);
        console.log(command);
      });
    bot
      .createGuildCommand('739559911033405592', {
        ...command,
        options: command.args,
      })
      .catch((e) => {
        console.error(e);
        console.log(command);
      });
  }
  createCommand(command: Command) {
    bot.createCommand({
      ...command,
      options: command.args,
    });
  }
  async purgeCommands() {
    await bot
      .getCommands()
      .then((commands) =>
        Promise.all(commands.map((cmd) => bot.deleteCommand(cmd.id)))
      );
  }
  async purgeDevCommands() {
    await bot.getGuildCommands('1061108960268124210').then((commands) =>
      Promise.all(
        commands.map((cmd) => {
          cmd.application_id === bot.user.id &&
            bot
              .deleteGuildCommand(cmd.id, '1061108960268124210')
              .catch((e) => console.error({ e, cmd }));
        })
      )
    );
    await bot
      .getGuildCommands('739559911033405592')
      .then((commands) =>
        Promise.all(
          commands.map(
            (cmd) =>
              cmd.application_id === bot.user.id &&
              bot.deleteGuildCommand(cmd.id, '739559911033405592')
          )
        )
      );
  }

  async onReady() {
    if (this.devMode) {
      await this.purgeDevCommands();
    }
    const create = this.devMode ? this.createDevCommand : this.createCommand;
    this.commands.forEach(async (command) => {
      await create(command);
    });
  }
  async registerCommand(command: Command) {
    const create = this.devMode ? this.createDevCommand : this.createCommand;
    await create(command);
  }

  loadCommand(command: Command) {
    this.commands.set(command.name, command);
    if (command.aliases) {
      command.aliases.forEach((alias) => {
        this.commands.set(alias, command);
        if (bot.ready) this.registerCommand(command);
      });
    }
    if (bot.ready) {
      this.registerCommand(command);
    }
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
