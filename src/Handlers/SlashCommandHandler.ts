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
  async createDevCommand(command: Command) {
    await bot
      .createGuildCommand('1061108960268124210', {
        ...command,
        options: command.args,
      })
      .catch((e) => {
        console.error(e);
        console.log(command);
      });
    await bot
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
    return bot.createCommand({
      ...command,
      options: command.args,
    });
  }
  async purgeCommands() {
    const cmds = await bot.getCommands();
    console.log('purging commands', cmds);
    await Promise.all(
      cmds.map((cmd) =>
        bot
          .deleteCommand(cmd.id)
          .then((x) => console.log(`deleted ${cmd.name}`))
      )
    );
  }
  async purgeDevCommands() {
    console.log('purging dev commands');
    const gcmds1 = await bot.getGuildCommands('1061108960268124210');
    const gcmds2 = await bot.getGuildCommands('739559911033405592');
    console.log('purging dev commands', gcmds1, gcmds2);
    await Promise.all(
      gcmds1.map((cmd) =>
        bot
          .deleteGuildCommand('1061108960268124210', cmd.id)
          .then((x) => console.log(`deleted gcmd ${cmd.name}`))
      )
    );
    await Promise.all(
      gcmds2.map((cmd) =>
        bot
          .deleteGuildCommand('739559911033405592', cmd.id)
          .then((x) => console.log(`deleted gcmd ${cmd.name}`))
      )
    );
  }

  async onReady() {
    const create = this.devMode ? this.createDevCommand : this.createCommand;
    const commands = Array.from(this.commands.values());

    for (let i = 0; i < commands.length; i++) {
      const command = commands[i];
      await create(command);
      console.log(`registered ${command.name}, ${i + 1}/${commands.length}`);
    }
    console.log('registered all commands');
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
