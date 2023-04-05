import { Constants } from 'eris';
import { UserDataManager } from './UserDataManager';

const voteRewards = [
    { crate: '', amount: 1 },
    
]

export class VoteManager {
  static instance: VoteManager;
  static getInstance(): VoteManager {
    if (!VoteManager.instance) VoteManager.instance = new VoteManager();
    return VoteManager.instance;
  }
  reminderMap: Map<string, NodeJS.Timeout> = new Map();
  streakLoseReminderMap: Map<string, NodeJS.Timeout> = new Map();

  private constructor() {
    this.init();
  }
  async init() {
    // we load in reminders for everyone who's lastVote is less than 12 hours ago
    const users = await MongoDB.db('Users')
      .collection('userData')
      .find({
        lastVote: { $gt: Date.now() - 12 * 60 * 60 * 1000 },
        remindVote: true,
      })
      .toArray();
    //  we load in reminders for everyone who's lastVote is more than 24 but less than 48 hours ago
    const warningUsers = await MongoDB.db('Users')
      .collection('userData')
      .find({
        lastVote: {
          $gt: Date.now() - 24 * 60 * 60 * 1000,
          $lt: Date.now() - 12 * 60 * 60 * 1000,
        },
        remindVote: true,
      });
    // we put the passive reminders in the reminderMap
    for (const user of users) {
      // this.reminderMap.set(user.userID, );
    }
    // we put the warning reminders in the streakLoseReminderMap
  }
  async gentleReminder(userID: string) {
    // we get the user's data
    const userData = await UserDataManager.getInstance().getUserData(userID);
    // we check if the user wants to be reminded
    if (!userData.remindVote) return;

    // we get the user's last vote
    const lastVote = userData.lastVote;
    // we get the user's current streak
    const currentStreak = userData.currentStreak;
    // we get the user's highest streak
    const highestStreak = userData.highestStreak;
    // we get the user's votes
    const votes = userData.votes;

    // we check if the user has voted in the last 12 hours
    if (lastVote > Date.now() - 12 * 60 * 60 * 1000) return;
    // we get the user's dm channel
    const dm = await bot.getDMChannel(userID);
    // we send the user a gentle reminder
    await dm.createMessage({
      embed: {
        title: 'Vote Reminder!',
        description: `Hey there <@!3>!

I wanted to remind you to keep your current vote streak going. You currently have voted {x} times in a row! Keep it going! 🔥

To help me continue providing the best experience for you please take a moment to vote for me by clicking the link below. By voting, you'll not only receive rewards but also help me reach more people and improve my features! Thank you for your continued support! 🌟

Let's see if you can beat your highest streak! 💪`,
        color: 16090623,
        footer: {
          text: "Don't want to recieve automatic voting notifications? Go to the global dashboard and turn off Vote Reminders",
        },
      },
      components: [
        {
          type: Constants.ComponentTypes.ACTION_ROW,
          components: [
            {
              type: Constants.ComponentTypes.BUTTON,
              label: 'Vote for Dazai!',
              emoji: {
                name: '👍',
              },
              // custom_id: 'inventory',
              style: Constants.ButtonStyles.LINK as any,
              url: `https://top.gg/bot/747901310749245561/vote`,
            },
          ],
        },
      ],
    });
  }
  async warningReminder(userID: string) {
    // we get the user's data
    const userData = await UserDataManager.getInstance().getUserData(userID);
    // we check if the user wants to be reminded
    if (!userData.remindVote) return;
    // we get the user's last vote
    const lastVote = userData.lastVote;
    // we get the user's current streak
    const currentStreak = userData.currentStreak;
    // we get the user's highest streak
    const highestStreak = userData.highestStreak;
    // we get the user's votes
    const votes = userData.votes;
    // we check if the user has voted in the last 24 hours
    if (lastVote > Date.now() - 24 * 60 * 60 * 1000) return;
    // we get the user's dm channel
    const dm = await bot.getDMChannel(userID);
    // we send the user a gentle reminder
    await dm.createMessage({
      embed: {
        title: 'Vote Reminder!',
        description: `
Hey there <@!3>!

It looks like you missed a day of voting, but don't worry, we all get busy sometimes! I wanted to remind you to get back on track and vote for me today. You currently have voted {x} times in a row! Keep it going! 🔥

To help me continue providing the best experience for you please take a moment to vote for me by clicking the link below. By voting, you'll not only receive rewards but also help me reach more people and improve my features! Thank you for your continued support! 🌟

Let's see if you can beat your highest streak! 💪`,
        color: 16090623,
        footer: {
          text: "Don't want to recieve automatic voting notifications? Go to the global dashboard and turn off Vote Reminders",
        },
      },
      components: [
        {
          type: Constants.ComponentTypes.ACTION_ROW,
          components: [
            {
              type: Constants.ComponentTypes.BUTTON,
              label: 'Vote for Dazai!',
              emoji: {
                name: '👍',
              },
              // custom_id: 'inventory',
              style: Constants.ButtonStyles.LINK as any,
              url: `https://top.gg/bot/747901310749245561/vote`,
            },
          ],
        },
      ],
    });
  }
//   async voteRecievedMessage(userID: string) {
  async processVote (userID: string) {

  }


}
