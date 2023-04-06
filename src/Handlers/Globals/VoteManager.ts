import { resolve } from 'dns';
import { Constants, EmbedField } from 'eris';
import { rarityEmojiMap, rarityNameMap } from '../../constants/cardNames';
import { LevellingRewards } from '../Levelling/LevelRewards';
import { UserDataManager, UserData } from './UserDataManager';

const voteRewards = [{ crate: '', amount: 1 }];

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
    const users = (await MongoDB.db('Users')
      .collection('userData')
      .find({
        lastVote: { $gt: Date.now() - 12 * 60 * 60 * 1000 },
        remindVote: true,
      })
      .toArray()) as UserData[];
    //  we load in reminders for everyone who's lastVote is more than 24 but less than 48 hours ago
    const warningUsers = (await MongoDB.db('Users')
      .collection('userData')
      .find({
        lastVote: {
          $lt: Date.now() - 24 * 60 * 60 * 1000,
          $gt: Date.now() - 48 * 60 * 60 * 1000,
        },
        remindVote: true,
      })
      .toArray()) as UserData[];
    // we put the passive reminders in the reminderMap
    console.log(
      `Warning ${warningUsers.length} users of voting`,
      warningUsers.map((u) => u.userID)
    );
    for (const user of users) {
      this.reminderMap.set(
        user.userID,
        setTimeout(
          (() => this.gentleReminder(user.userID)).bind(this),
          user.lastVote + 12 * 60 * 60 * 1000 - Date.now()
        )
      );
      // this.reminderMap.set(user.userID, );
    }
    for (const user of warningUsers) {
      this.streakLoseReminderMap.set(
        user.userID,
        setTimeout(
          (() => this.warningReminder(user.userID)).bind(this),
          Math.max(user.lastVote + 24 * 60 * 60 * 1000 - Date.now(), 0)
        )
      );
    }
    // we put the warning reminders in the streakLoseReminderMap
  }
  async gentleReminder(userID: string) {
    // we get the user's data
    const userData = await UserDataManager.getInstance().getUserData(userID);
    if (!userData) return;
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
        description: `Hey there <@!${userID}>!

I wanted to remind you to keep your current vote streak going. You currently have voted **${currentStreak} times** in a row! Keep it going! 🔥

To help me continue providing the best experience for you please take a moment to vote for me by clicking the link below. By voting, you'll not only receive rewards but also help me reach more people and improve my features! Thank you for your continued support! 🌟

Let's see if you can ${
          currentStreak === highestStreak
            ? `keep your current streak going`
            : `beat your highest streak of **${highestStreak} votes**`
        }! 💪`,
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
    if (!userData) return;
    // we check if the user wants to be reminded
    if (!userData.remindVote || userData.warned) return;
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
    await UserDataManager.getInstance().updateUserData(userID, {
      warned: true,
    });
    // we send the user a gentle reminder
    await dm.createMessage({
      embed: {
        title: 'Vote Reminder!',
        description: `
Hey there <@!${userID}>!

It looks like you missed a day of voting, but don't worry, we all get busy sometimes! I wanted to remind you to get back on track and vote for me today. You currently have voted **${currentStreak} times** in a row! Keep it going! 🔥

To help me continue providing the best experience for you please take a moment to vote for me by clicking the link below. By voting, you'll not only receive rewards but also help me reach more people and improve my features! Thank you for your continued support! 🌟

Let's see if you can ${
          currentStreak === highestStreak
            ? `keep your current streak going`
            : `beat your highest streak of **${highestStreak} votes**`
        }! 💪`,
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
  async processVote(userID: string) {
    // we get the user's data
    const userData = await UserDataManager.getInstance().getUserData(userID);
    if (!userData) return;
    // we remove the user from all reminder maps
    this.reminderMap.delete(userID);
    this.streakLoseReminderMap.delete(userID);
    // we increment the user's vote count
    userData.votes++;
    // we check last vote and determine if the user has voted in the last 48 hours, if not we reset their streak
    if (userData.lastVote < Date.now() - 48 * 60 * 60 * 1000) {
      userData.currentStreak = 0;
    }
    // we increment the user's current streak
    userData.currentStreak++;
    // we check if the user's current streak is higher than their highest streak
    if (userData.currentStreak > userData.highestStreak) {
      // if so we set their highest streak to their current streak
      userData.highestStreak = userData.currentStreak;
    }
    // we set the user's last vote to now
    userData.lastVote = Date.now();
    // we save the user's data
    await UserDataManager.getInstance().updateUserData(userID, {
      votes: userData.votes,
      currentStreak: userData.currentStreak,
      highestStreak: userData.highestStreak,
      lastVote: userData.lastVote,
      warned: false,
    });
    // we add the user to the reminder map
    this.reminderMap.set(
      userID,
      setTimeout(() => this.gentleReminder(userID), 12 * 60 * 60 * 1000)
    );
    this.streakLoseReminderMap.set(
      userID,
      setTimeout(() => this.warningReminder(userID), 24 * 60 * 60 * 1000)
    );
    // we determine rewards
    const rewards =
      await LevellingRewards.getInstance().processGuildRewardsForMember(
        `@global`,
        userID,
        userData.currentStreak
      );
    // we get the user's dm channel
    const dm = await bot.getDMChannel(userID);
    //we send the user a thank you message
    const awardFields = [] as EmbedField[];
    console.log(rewards);
    if (rewards?.cards.length) {
      awardFields.push({
        name: '__New Background Cards__',
        value: `\`\`\`${rewards.cards
          .map((r) => {
            return `- x${r[1]} 「 ${r[0].name} 」  ${
              rarityEmojiMap[r[0].rarity]
            } — ${rarityNameMap[r[0].rarity]}`;
          })
          .join('\n')}\`\`\``,
      });
    }
    if (rewards?.crates.length) {
      awardFields.push({
        name: '__New Crates__',
        value: `\`\`\`${rewards.crates
          .map((r) => {
            return `- x${r[1]} 「 ${r[0].name} 」`;
          })
          .join('\n')}\`\`\``,
      });
    }
    awardFields.push({
      name: 'Voting Streak',
      value: `You have voted for me **${userData.currentStreak} times** in a row! Keep it up! 🔥`,
      inline: true,
    });
    awardFields.push({
      name: 'Total Votes',
      value: `You have voted for me **${userData.votes} times**! Thank you so much! 🌟`,
      inline: true,
    });

    dm.createMessage({
      embed: {
        title: 'Thank you for Voting!',
        description: `Thank you for voting for me! I really appreciate it, and I hope you continue to enjoy using me!\n
${
  awardFields.length > 0
    ? 'In addition, I felt like rewarding you for your support! Here, take these!'
    : ''
}`,
        thumbnail: {
          url: 'https://images-wixmp-ed30a86b8c4ca887773594c2.wixmp.com/f/15e13870-8518-4f22-92c4-faa2555110e4/dej1xz0-79ff858a-d77f-439d-9cab-76e25ba7f8e9.png/v1/fill/w_1280,h_1280,q_80,strp/wan__dazai_by_gummysnail_dej1xz0-fullview.jpg?token=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ1cm46YXBwOjdlMGQxODg5ODIyNjQzNzNhNWYwZDQxNWVhMGQyNmUwIiwiaXNzIjoidXJuOmFwcDo3ZTBkMTg4OTgyMjY0MzczYTVmMGQ0MTVlYTBkMjZlMCIsIm9iaiI6W1t7ImhlaWdodCI6Ijw9MTI4MCIsInBhdGgiOiJcL2ZcLzE1ZTEzODcwLTg1MTgtNGYyMi05MmM0LWZhYTI1NTUxMTBlNFwvZGVqMXh6MC03OWZmODU4YS1kNzdmLTQzOWQtOWNhYi03NmUyNWJhN2Y4ZTkucG5nIiwid2lkdGgiOiI8PTEyODAifV1dLCJhdWQiOlsidXJuOnNlcnZpY2U6aW1hZ2Uub3BlcmF0aW9ucyJdfQ.ObDVGDRlq0hjQNhpECT930IVlNlYMtZ7Vffe4zwXdvk',
        },
        fields: awardFields,
        // footer: {
        //   text: `Sent from ${guild?.name}`,
        //   icon_url: guild?.dynamicIconURL('png', 64) ?? undefined,
        // },
      },
    });
    return rewards;
  }
}
