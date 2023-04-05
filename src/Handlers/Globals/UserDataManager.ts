import { ObjectID } from 'bson';

const defaultUser = (userID: string) =>
  ({
    _id: new ObjectID(),
    userID,
    votes: 0,
    highestStreak: 0,
    currentStreak: 0,
    lastVote: 0,
    premiumUntil: 0,
    remindVote: true,
    disableLevelUpMessages: false,
  } as UserData);
export type UserData = {
  _id: ObjectID;
  userID: string;
  votes: number;
  highestStreak: number;
  currentStreak: number;
  lastVote: number;
  premiumUntil: number;
  remindVote: boolean;
  disableLevelUpMessages: boolean;
};
export type UserDataWithUser = UserData & {
  user: {
    id: string;
    username: string;
    discriminator: string;
    avatar: string;
  };
};
export class UserDataManager {
  static instance: UserDataManager;
  static getInstance(): UserDataManager {
    if (!UserDataManager.instance)
      UserDataManager.instance = new UserDataManager();
    return UserDataManager.instance;
  }
  private constructor() {}
  async getUserData(
    userID: string,
    raw: boolean = false,
    onlyIfExists: boolean = false
  ) {
    let data = (await MongoDB.db('Users').collection('userData').findOne({
      userID,
    })) as UserData;

    if (!data) {
      if (onlyIfExists) return null;
      
      let newUser = defaultUser(userID);
      await MongoDB.db('Users').collection('userData').insertOne(newUser);
      data = newUser;
    }
    if (raw) return data;
    let user = (await bot.users.get(userID)) || (await bot.getRESTUser(userID));
    return {
      ...data,
      user: user
        ? {
            id: user.id,
            username: user.username,
            discriminator: user.discriminator,
            avatar: user.avatarURL,
          }
        : null,
    };
  }
  async getUserDataBulk(userIDs: string[]) {
    const data = await MongoDB.db('Users')
      .collection('userData')
      .find({
        userID: { $in: userIDs },
      })
      .toArray();
    const newData = userIDs
      .map((id) => data.find((d) => d.userID === id))
      .filter((d) => d);
    return newData;
  }
  async updateUserData(userID: string, data: Partial<UserData>) {
    delete data._id;
    delete data.userID;
    const userData = (await this.getUserData(userID)) ?? defaultUser(userID);
    await MongoDB.db('Users')
      .collection('userData')
      .updateOne(
        {
          userID,
        },
        {
          $set: {
            ...data,
          },
        }
      );
    return {
      ...userData,
      ...data,
    };
  }
}
