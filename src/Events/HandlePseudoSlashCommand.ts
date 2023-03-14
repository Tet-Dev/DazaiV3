import {
  ApplicationCommandOptionsWithValue,
  Constants,
  FileContent,
  InteractionDataOptions,
  InteractionDataOptionsBoolean,
  InteractionDataOptionsChannel,
  InteractionDataOptionsInteger,
  InteractionDataOptionsMentionable,
  InteractionDataOptionsNumber,
  InteractionDataOptionsRole,
  InteractionDataOptionsString,
  InteractionDataOptionsUser,
  Message,
  MessageContent,
  PossiblyUncachedTextableChannel,
  TextableChannel,
  TextChannel,
} from 'eris';
import { XPManager } from '../Handlers/Levelling/XPManager';
import { SlashCommandHandler } from '../Handlers/SlashCommandHandler';
import { EventHandler } from '../types/misc';
export const HandlePseudoSlashCommands = {
  event: 'messageCreate',
  run: async (bot, msg) => {
    const prefix = '/';
    if (!msg.content.startsWith(prefix)) return;
    const args = msg.content.slice(prefix.length).split(/ +/);
    const commandName = args.shift()?.toLowerCase();
    if (!commandName) return;
    const command = SlashCommandHandler.getInstance().getCommand(commandName);
    if (!command) return;
    const channel = bot.getChannel(msg.channel.id) as TextChannel;
    const guild = msg.guildID ? bot.guilds.get(msg.guildID) : undefined;
    const member = guild ? guild.members.get(msg.author.id) : undefined;
    const cmdArgs = command.args;
    const minArgs = cmdArgs.filter(
      (arg) => (arg as ApplicationCommandOptionsWithValue).required
    ).length;
    const maxArgs = cmdArgs.length;
    if (args.length < minArgs || args.length > maxArgs) {
      channel.createMessage(
        `Invalid number of arguments. Proper usage: \`\`\`${prefix}${commandName} ${cmdArgs
          .map((arg) =>
            (arg as ApplicationCommandOptionsWithValue).required
              ? `<${arg.name}>`
              : `[${arg.name}]`
          )
          .join(' ')}\`\`\`
          Required parameters are surrounded by \`<>\`
          Optional parameters are surrounded by \`[]\``
      );
      return;
    }
    // InteractionDataOptionsString | InteractionDataOptionsInteger | InteractionDataOptionsBoolean | InteractionDataOptionsUser | InteractionDataOptionsChannel | InteractionDataOptionsRole | InteractionDataOptionsMentionable | InteractionDataOptionsNumber
    let parsedArgs = [] as InteractionDataOptions[];
    for (let i = 0; i < cmdArgs.length; i++) {
      const arg = cmdArgs[i];
      const argName = arg.name;
      const argValue = args[i];
      if (arg.type === Constants.ApplicationCommandOptionTypes.STRING)
        parsedArgs.push({
          name: argName,
          value: argValue,
        } as InteractionDataOptionsString);
      else if (arg.type === Constants.ApplicationCommandOptionTypes.INTEGER)
        parsedArgs.push({
          name: argName,
          value: parseInt(argValue),
        } as InteractionDataOptionsInteger);
      else if (arg.type === Constants.ApplicationCommandOptionTypes.BOOLEAN)
        parsedArgs.push({
          name: argName,
          value: argValue.toLowerCase() === 'true',
        } as InteractionDataOptionsBoolean);
      else if (arg.type === Constants.ApplicationCommandOptionTypes.USER)
        parsedArgs.push({
          name: argName,
          value: argValue,
        } as InteractionDataOptionsUser);
      else if (arg.type === Constants.ApplicationCommandOptionTypes.CHANNEL)
        parsedArgs.push({
          name: argName,
          value: argValue,
        } as InteractionDataOptionsChannel);
      else if (arg.type === Constants.ApplicationCommandOptionTypes.ROLE)
        parsedArgs.push({
          name: argName,
          value: argValue,
        } as InteractionDataOptionsRole);
      else if (arg.type === Constants.ApplicationCommandOptionTypes.MENTIONABLE)
        parsedArgs.push({
          name: argName,
          value: argValue,
        } as InteractionDataOptionsMentionable);
      else if (arg.type === Constants.ApplicationCommandOptionTypes.NUMBER)
        parsedArgs.push({
          name: argName,
          value: parseFloat(argValue),
        } as InteractionDataOptionsNumber);
    }
    command.execute(bot, {
      interaction: {
        type: 2,
        acknowledged: false,
        applicationID: bot.user.id,
        id: '0',
        token: '',
        version: 1,
        createdAt: msg.createdAt,
        inspect: () => null as any,
        toJSON: () => null as any,
        acknowledge: async (_: any) => {
          channel.sendTyping();
        },
        createFollowup: async (content: MessageContent, file?: FileContent) => {
          console.log({ channel });
          const newmsg = channel.createMessage(content, file);
          console.log(newmsg);
          return newmsg;
        },
        createMessage: async (
          content: MessageContent,
          file?: FileContent | FileContent[]
        ) => {
          channel.createMessage(content, file);
        },
        defer: async (_: any) => {},
        deleteMessage: async (messageID: string) => {
          channel.deleteMessage(messageID);
        },
        deleteOriginalMessage: async () => {
          channel.deleteMessage(msg.id);
        },
        editMessage: async (
          messageID: string,
          content: MessageContent,
          file?: FileContent | FileContent[]
        ) => {
          if (typeof content === 'string')
            return channel.editMessage(messageID, {
              content,
              file,
            });
          return channel.editMessage(messageID, content);
        },
        editOriginalMessage: async (
          content: MessageContent,
          file?: FileContent | FileContent[]
        ) => {
          if (typeof content === 'string')
            return channel.editMessage(msg.id, {
              content,
              file,
            });
          return channel.editMessage(msg.id, content);
        },
        getOriginalMessage: async () => {
          return msg as Message<TextableChannel>;
        },

        channel,
        guildID: msg.guildID,
        member,
        data: {
          id: command.name,
          name: command.name,
          type: 1,
          options: parsedArgs,
        },
      },
    });
  },
} as EventHandler<'messageCreate'>;
export default HandlePseudoSlashCommands;
