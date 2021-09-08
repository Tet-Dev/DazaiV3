import { MongoClient } from 'mongodb';
import env from '../env';
import tetGlobal from '../tetGlobal';
export const createGuildData = async (guildId: string, guildData?: any) => {
  let result = await tetGlobal.MongoDB?.db('Guilds').collection('GuildData').insertOne({
    guildId,
    ...guildData
  });
  if (result?.acknowledged)
    return {
      guildId,
      ...guildData
    }
  else
    return null;
}
export const getGuild = async (guildId: string, createIfNull: boolean) => {
  let getGuild = await tetGlobal.MongoDB?.db('GuildData').collection('guilds').findOne({
    guildId,
  });
  if (getGuild)
    return getGuild;
  else if (createIfNull)
    return await createGuildData(guildId);
  else
    return null;
}

export const init = () => {

  const MongoConnection = new MongoClient(env.MongoURL);
  MongoConnection.connect().then(client => {
    tetGlobal.MongoDB = client;
    tetGlobal.Logger.info('MongoDB connected');
  })
};

export type UserData = {
  userid: string,
  personalbg?: string,
  personalcolor?: string,
  design?: string,
  ColorUnlocks?: string[],
  CardUnlocks?: string[],
  redeems?: string,
  lastdaily?: string,
  streak?: number,
  autoSelectSongs?: number
}
export const createUser = async (userid: string, userData?: any) => {
  let result = await tetGlobal.MongoDB?.db('Users').collection('Users').insertOne({
    userid,
    ...userData
  });
  if (result?.acknowledged)
    return {
      userid,
      ...userData
    } as UserData;
  else
    return null;
}
export const getUser = async (userid: string, createIfNull?: boolean) => {
  let getUser = await tetGlobal.MongoDB?.db('Users').collection('UserData').findOne({
    userid,
  });
  if (getUser)
    return getUser as UserData;
  else if (createIfNull)
    return await createUser(userid) as UserData;
  else
    return null;
}
export const updateUser = async (userid: string, userData?: any) => {
  let result = await tetGlobal.MongoDB?.db('Users').collection('UserData').updateOne({
    userid
  }, {
    $set: userData
  }, {
    upsert: true
  });
  if (result?.acknowledged)
    return {
      userid,
      ...userData
    } as UserData;
  else
    return null;
}
export const getAllUsers = async () => {
  let getUsers = await tetGlobal.MongoDB?.db('Users').collection('Users').find().toArray();
  if (getUsers)
    return getUsers as UserData[];
  else
    return null;
}
