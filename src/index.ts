import * as ErisBoiler from 'eris-boiler';
import { join } from 'path';
import * as DatabaseHandler from './Handlers/DatabaseHandler';
import SQLHandler from './Handlers/SQLHandler';
import tetGlobal from './tetGlobal';
import * as fs from 'fs';
import MusicHandler from './Handlers/Music/MusicMain';
import RankCardDrawer from './Handlers/Levelling/RankCardDrawer';
const options: ErisBoiler.DataClientOptions = {
  oratorOptions: {
    defaultPrefix: 'daz' // sets the default prefix to !!
  },
  statusManagerOptions: {
    defaultStatus: { // sets default discord activity
      type: 0,
      name: 'daz help | Rewrite???'
    },
    mode: 'random' // sets activity mode to random, the bot will change status on an interval
  },
  erisOptions: {
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
    ]
  },
};
const bot = new ErisBoiler.DataClient(tetGlobal.Env.token, options);
SQLHandler.init();
const commandFolders = fs.readdirSync(join(__dirname, 'Commands'));
for (const folder of commandFolders) {
  if (folder.startsWith('_')) continue;
  bot.addCommands(join(__dirname, 'Commands', folder));
}
const eventFolders = fs.readdirSync(join(__dirname, 'Events'));
for (const folder of eventFolders) {
  if (folder.startsWith('_')) continue;
  bot.addEvents(join(__dirname, 'Events', folder));
}
bot.connect();
DatabaseHandler.init();
let called = false;
const onceCall = () => {
  if (called) return;
  called = true;
  MusicHandler.init();
  RankCardDrawer.init();
};
bot.on('ready', () => {
  tetGlobal.Bot = bot;
  onceCall();
});

// bot.