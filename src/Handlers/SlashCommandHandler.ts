import Eris, { CommandInteraction, Interaction } from 'eris';
import { Command } from '../types/misc';
const guildsWithSlashCommands = [
  '1061108960268124210',
  '739559911033405592',
  '1089977920023449783',
];
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
    console.log('slash command handler ready');
    bot.on('interactionCreate', this.handleInteraction.bind(this));
  }
  async createDevCommand(command: Command) {
    for (const guild of guildsWithSlashCommands) {
      await bot
        .createGuildCommand(guild, {
          ...command,
          options: command.args,
        })
        .catch((e) => {
          console.error(e);
          console.log(command);
        });
    }
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
  commandExists(
    command: Command,
    commandList: Eris.ApplicationCommand<Eris.ApplicationCommandTypes>[]
  ) {
    const commandInList = commandList.find((x) => x.name === command.name);
    console.log({
      commandInList,
      command,
    });
    if (!commandInList) return false;
    if (!commandInList.options?.length && !command.args.length) return true;
    if (commandInList.options?.length !== command.args.length) return false;

    const diffArgs = commandInList.options.some((x, i) => {
      if (x.name !== command.args[i].name) return true;
      if (x.type !== command.args[i].type) return true;
      if (x.description !== command.args[i].description) return true;
      return false;
    });
    if (diffArgs) return false;
    // check name and description
    if (commandInList.name !== command.name) return false;
    if (commandInList.description !== command.description) return false;
    return true;
  }
  async onReady() {
    const create = this.devMode ? this.createDevCommand : this.createCommand;
    const cmds = await (this.devMode
      ? bot.getGuildCommands('1089977920023449783')
      : bot.getCommands());
    const cmdArr = Array.from(this.commands.values());
    const commands = cmdArr.filter((x) => !this.commandExists(x, cmds));

    console.log('registering commands, skipping over existing ones', cmds);
    // for every command in this.commands, check if it's already registered
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
      console.log('executing command', {
        command: interaction.data.name,
        args: interaction.data.options,
        user:
          interaction.member?.user.username +
          '#' +
          interaction.member?.user.discriminator,
      });
      command.execute(bot, {
        interaction,
        // args: interaction.data.options.map(option => option.value),
      });
    }
  }
}
