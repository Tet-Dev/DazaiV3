import { join } from 'path';
import Eris, { CommandClient } from 'eris';
// import * as DatabaseHandler from './Handlers/DatabaseHandler';
// import SQLHandler from './Handlers/SQLHandler';
import * as fs from 'fs/promises';
import { EnvData, env } from './env';
import { BotClient, Command } from './types/misc';
import { SlashCommandHandler } from './Handlers/SlashCommandHandler';
import { MusicManager } from './Handlers/Music/MusicPlayer';
// import MusicHandler from './Handlers/Music/MusicMain';
// import RankCardDrawer from './Handlers/Levelling/RankCardDrawer';
const options: Eris.CommandClientOptions & Eris.ClientOptions = {
  prefix: 'daz',
  restMode: true,
  defaultImageSize: 256,
  intents: [
    'guilds',
    'guildMembers',
    'guildBans',
    'guildEmojis',
    'guildIntegrations',
    'guildWebhooks',
    'guildInvites',
    'guildVoiceStates',
    'guildMessages',
    'guildMessageReactions',
    // 'guildMessageTyping',
    'directMessages',
    'directMessageReactions',
    // 'directMessageTyping',
  ],
  owner: 'Tet#6000',
  name: 'Dazai',
};
globalThis.env = env;
globalThis.bot = new CommandClient(env.token, options);
declare global {
  var bot: BotClient;
  var env: EnvData;
}

// SQLHandler.init();
const recursivelyAddCommands = async (dir: string) => {
  const files = await fs.readdir(dir);
  // recursively add folders
  for (const file of files) {
    console.log(file);
    const path = join(dir, file);
    if ((await fs.lstat(path)).isDirectory()) {
      recursivelyAddCommands(path);
      continue;
    }
    // add commands
    if (file.endsWith('.js') || file.endsWith('.ts')) {
      const command = (await import(join(dir, file))).default as Command;
      SlashCommandHandler.getInstance().loadCommand(command);
      console.log(command);
    }
  }
};
recursivelyAddCommands(join(__dirname, 'Commands'));
// add commands

// const commandFolders = fs.readdir(join(__dirname, 'Commands'));
// for (const folder of commandFolders) {
//   if (folder.startsWith('_')) continue;
//   // import all commands from the folder
//   join(__dirname, 'Commands', folder);
// }
// const eventFolders = fs.readdirSync(join(__dirname, 'Events'));
// for (const folder of eventFolders) {
//   if (folder.startsWith('_')) continue;
//   bot.addEvents(join(__dirname, 'Events', folder));
// }
bot.connect();
// DatabaseHandler.init();
bot.on('ready', () => {
  console.log('Ready!');

  MusicManager.getInstance().musicManager.init(bot.user.id);
});

// bot.
