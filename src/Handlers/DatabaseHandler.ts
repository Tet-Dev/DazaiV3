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
export type GuildData = {
  guildId: string,
  prefix: string,
  auditLogChannel: string,
  inviter: string,
  levelrewards: { level: number, roleID: string }[],
  keepRolesWhenLevel: number,
  giveRolesWhenJoin: string,
  reactionroles: { emoji: string, roleID: string }[],
  joinmsg: string,
  joinDMMessage: string,
  leavemsg: string,
  levelmsg: string,
  levelmsgChannel: string,
  joinChannel: string,
  leaveChannel: string,
  xpCurve: string,
  beta: number,
  blacklistedChannels: string[],
  xp: boolean
}
export const getGuildData = async (guildId: string, disableCreateIfNull?: boolean) => {
  let result = await tetGlobal.MongoDB?.db('Guilds').collection('GuildData').findOne({
    guildId
  });
  if (result)
    return result as GuildData;
  else
    if (!disableCreateIfNull)
      return await createGuildData(guildId) as GuildData;
    else
      return null;
}
export const updateGuildData = async (guildId: string, guildData: GuildData) => {
  let result = await tetGlobal.MongoDB?.db('Guilds').collection('GuildData').updateOne({
    guildId
  }, {
    $set: guildData
  }, {
    upsert: true
  });
  if (result?.acknowledged)
    return true;
  else
    return false;
}
export const deleteGuildData = async (guildId: string) => {
  let result = await tetGlobal.MongoDB?.db('Guilds').collection('GuildData').deleteOne({
    guildId
  });
  if (result?.acknowledged)
    return true;
  else
    return false;
}
export const createUserData = async (userId: string, userData?: any) => {
  let result = await tetGlobal.MongoDB?.db('Users').collection('UserData').insertOne({
    userId,
    ...userData
  });
  if (result?.acknowledged)
    return {
      userId,
      ...userData
    }
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
