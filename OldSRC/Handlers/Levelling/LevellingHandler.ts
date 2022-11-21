import tetGlobal from "../../tetGlobal";

export type LevelData = {
  level: number;
  exp: number;
  userid: string;
};
export class LevellingHandler {
  static async getGuildLeaderboard(guildId: string) {
    if (!(await tetGlobal.MongoDB?.db("GuildLeaderboards").collections())?.some((c) => c.collectionName === guildId)) {
      await tetGlobal.MongoDB?.db("GuildLeaderboards").createCollection(guildId);
      await tetGlobal.MongoDB?.db("GuildLeaderboards").collection(guildId).createIndex({
        level: -1,
        xp: -1,
      });
      await tetGlobal.MongoDB?.db("GuildLeaderboards").collection(guildId).createIndex({
        userid: 1,
      });
    }
    let leaderboard = tetGlobal.MongoDB?.db("GuildLeaderboards").collection(guildId).find({}).sort({
      level: -1,
      xp: -1,
    });
    return await leaderboard?.toArray() as LevelData[];



  }
  static async getUser(guildID: string, userid: string) {
    let user = await tetGlobal.MongoDB?.db("GuildLeaderboards").collection(guildID).findOne({ userid: userid });
    return user as LevelData;
  }
  static async updateUser(guildID: string, userid: string, level: number, exp: number) {
    await tetGlobal.MongoDB?.db("GuildLeaderboards").collection(guildID).updateOne({ userid: userid }, { $set: { level: level, exp: exp } }, { upsert: true });
  }
  static async getUserPositionData(guildID: string, userid: string) {
    //get leaderboard array
    let leaderboard = (await this.getGuildLeaderboard(guildID))!;
    //get user data
    let user = (await this.getUser(guildID, userid))!;
    //perform a binary search to find the user's position
    let userApprox = 100 * user.level ** 1.5 + user.exp;
    let approxLeaderboard = leaderboard.map(x => 100 * x.level ** 1.5 + x.exp);
    let position = this.binarySearchDesc(approxLeaderboard, userApprox, 0, approxLeaderboard.length - 1);


    //search both forwards and backwards to find the user's position

    return {
      position: position,
      user: user,
      leaderboard: leaderboard,
    }
    //return the position data


  }

  //a binary search function that works on a descedning array
  static binarySearchDesc(array: any[], value: any, start: number, end: number): number {
    if (start > end) {
      return -1;
    }
    let mid = Math.floor((start + end) / 2);
    if (array[mid] === value) {
      return mid;
    } else if (array[mid] < value) {
      return this.binarySearchDesc(array, value, start, mid - 1);
    } else {
      return this.binarySearchDesc(array, value, mid + 1, end);
    }
  }

}
