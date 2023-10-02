import Eris, { CommandInteraction, Interaction } from 'eris';
import { Command } from '../types/misc';
import { PermissionManager } from './PermissionHandler';
import { envDevOptions } from '../env';
const guildsWithSlashCommands = envDevOptions.guildsWithSlashCommands;
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
    for (const guild of guildsWithSlashCommands) {
      const cmds = await bot.getGuildCommands(guild);
      console.log('purging dev commands', cmds);
      await Promise.all(
        cmds.map((cmd) =>
          bot
            .deleteGuildCommand(guild, cmd.id)
            .then((x) => console.log(`deleted ${cmd.name}`))
        )
      );
    }
  }
  commandExists(
    command: Command,
    commandList: Eris.ApplicationCommand<Eris.ApplicationCommandTypes>[]
  ) {
    const commandInList = commandList.find((x) => x.name === command.name);
    // console.log({
    //   commandInList,
    //   command,
    // });
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
    this.devMode = env.devmode
    const create = this.devMode ? this.createDevCommand : this.createCommand;

    const cmdsList = this.devMode
      ? await Promise.all(
          (envDevOptions as any).guildsWithSlashCommands.map(
            async (guildID:string) => await bot.getGuildCommands(guildID)
          )
        )
      : [await bot.getCommands()];

    const cmdArr = Array.from(this.commands.values());

    for (const cmds of cmdsList) {
      const commands = cmdArr.filter((x) => !this.commandExists(x, cmds));

      console.log('registering commands, skipping over existing ones');
      // for every command in this.commands, check if it's already registered
      for (let i = 0; i < commands.length; i++) {
        const command = commands[i];
        await create(command);
        console.log(`registered ${command.name}, ${i + 1}/${commands.length}`);
      }
    }
    console.log('registered all commands');
  }

  async registerCommand(command: Command) {
    const create = this.devMode ? this.createDevCommand : this.createCommand;
    console.log('registering command', command);
    await create(command);
    if (command.aliases) {
      console.log('registering aliases', command.aliases);
      for (const alias of command.aliases) {
        await create({
          ...command,
          name: alias,
        });
      }
    }
  }

  loadCommand(command: Command) {
    this.commands.set(command.name, command);
    if (command.aliases) {
      command.aliases.forEach((alias) => {
        this.commands.set(alias, command);
        // if (bot.ready) this.registerCommand(command);
      });
    }
    if (bot.ready) {
      this.registerCommand(command);
    }
  }
  getCommand(name: string): Command | undefined {
    return this.commands.get(name);
  }
  async handleInteraction(interaction: Interaction) {
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
      // calculate if user has permission to run command
      if (command.permissions?.length && interaction.member) {
        const hasPermission =
          await PermissionManager.getInstance().hasMultiplePermissions(
            interaction.guildID!,
            interaction.member.roles,
            command.permissions
          );
        if (typeof hasPermission === 'object') {
          interaction.createMessage({
            embeds: [
              await PermissionManager.getInstance().rejectInteraction(
                hasPermission.missing,
                interaction.member?.user || interaction.user
              ),
            ],
          });
          return;
        }
      }
      command.execute(bot, {
        interaction,
        // args: interaction.data.options.map(option => option.value),
      });
    }
  }
}
