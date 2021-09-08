import { DataClient } from 'eris-boiler';
import { MongoClient } from 'mongodb';
import { EnvData, env } from './env';
import { Logger } from './Helpers/Logger';

export type TetGlobal = {
  MongoDB?: MongoClient,
  Logger: Logger,
  Env: EnvData,
  Bot?: DataClient,
}
export const tetGlobal: TetGlobal = {
  Logger: Logger,
  Env: env,
};
export default tetGlobal;