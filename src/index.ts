import { join } from 'path';
import Eris, { CommandClient, Message } from 'eris';
// import * as DatabaseHandler from './Handlers/DatabaseHandler';
// import SQLHandler from './Handlers/SQLHandler';
import * as fs from 'fs/promises';
import { EnvData, env } from './env';
import { BotClient, Command, EventHandler } from './types/misc';
import { SlashCommandHandler } from './Handlers/SlashCommandHandler';
import { MusicManager } from './Handlers/Music/MusicPlayer';
import { MongoClient } from 'mongodb';
import server from './Server/server';
import { writeFileSync } from 'fs';
import process from 'node:process';
// import { VoteManager } from './Handlers/Globals/VoteManager';
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
process.env = Object.assign(process.env, env);
globalThis.bot = new CommandClient(env.token, options);
declare global {
  var bot: BotClient;
  var env: EnvData;
  var MongoDB: MongoClient;
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
      console.log(command.name, `loaded`);
    }
  }
};
//@ts-ignore
SlashCommandHandler.getInstance().devMode = !!env.devmode;
recursivelyAddCommands(join(__dirname, 'Commands')).then();
const recursivelyAddEvents = async (dir: string) => {
  const files = await fs.readdir(dir);
  // recursively add folders
  for (const file of files) {
    console.log(file);
    const path = join(dir, file);
    if ((await fs.lstat(path)).isDirectory()) {
      recursivelyAddEvents(path);
      continue;
    }
    // add commands
    if (file.endsWith('.js') || file.endsWith('.ts')) {
      const event = (await import(join(dir, file)))
        .default as EventHandler<any>;
      bot.on(event.event, event.run.bind(null, bot));
      console.log(event);
    }
  }
};
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
globalThis.MongoDB = new MongoClient(env.MongoURL);
MongoDB.connect();
// on mongo connect

bot.connect();
console.log('Connecting...');
// DatabaseHandler.init();
bot.once('ready', () => {
  console.log('Ready!');
  server();
  MusicManager.getInstance().musicManager.init(bot.user.id);
  import(`./Handlers/Globals/VoteManager`).then((vm) => {
    vm.VoteManager.getInstance();
  });
  import('./Handlers/Fun/MessageReader/SniperManager').then((sm) => {
    sm.SniperManager.getInstance();
  });
  recursivelyAddEvents(join(__dirname, 'Events')).then();
});

bot.on('error', (err) => {
  console.error(err);
});

process.on('unhandledRejection', async (err) => {
  console.error(err);
  if (env.errorLogChannel)
    bot.createMessage(
      env.errorLogChannel,
      `An error occured: \`\`\`${err}\`\`\``
    );
  // if logs folder doesn't exist, create it
  if (
    !(await fs
      .access('logs')
      .then(() => true)
      .catch(() => null))
  ) {
    await fs.mkdir('logs');
  }
  await fs.appendFile(`logs/log.txt`, `---\n${err}\n---\n\n`, {
    mode: 0o777,
  });
});
console.log('Done!');
