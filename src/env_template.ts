import { NodeOptions } from 'erela.js';

export const env = {
  token: '',
  LavalinkNodes: [
    {
      host: '',
      port: 0,
      password: '',
    },
  ] as NodeOptions[],
  google: {
    type: 'service_account',
    project_id: '',
    private_key_id: '',
    private_key: '',
    client_email: '',
    client_id: '',
    auth_uri: '',
    token_uri: '',
    auth_provider_x509_cert_url: '',
    client_x509_cert_url: '',
  },
  MongoURL: 'mongodb+srv://YOUR MONGO URL',
  MusicDrawers: 1, //How many threads should be used to generate music cards
  SlanderDrawers: 1, //How many threads should be used to generate slander cards
  RankCardDrawers: 2, //How many threads should be used to generate rank cards
  webserver: null,
  port: 888,
  website: 'http://localhost:3000',
  devmode: true,
  sql: null,
  voteKey: '',
  adminID: ``,
  errorLogChannel: '',
  purchaseLogChannel: '',
};
export const envDevOptions = {
  guildsWithSlashCommands: [''],
  eventRunnerServers: [''], // Servers where events will still run even if devmode is true
};
export default env;
export type EnvData = typeof env;
