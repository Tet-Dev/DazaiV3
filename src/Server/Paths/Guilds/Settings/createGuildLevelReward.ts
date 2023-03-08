import { getGuildCards } from '../../../../Handlers/Crates/CardManager';
import { CrateManager } from '../../../../Handlers/Crates/CrateManager';
import {
  LevellingRewards,
  LevelUpRewardType,
} from '../../../../Handlers/Levelling/LevelRewards';
import { XPManager } from '../../../../Handlers/Levelling/XPManager';
import { RESTMethods, RESTHandler } from '../../../../types/misc';

export const updateGuildReward = {
  method: RESTMethods.POST,
  path: '/guilds/:guildID/settings/levelrewards/',
  sendUser: true,
  run: async (req, res, next, user) => {
    const { rewardID, guildID } = req.params;
    const rewardData = req.body as Partial<LevelUpRewardType>;
    if (!user) return res.status(401).json({ error: 'Unauthorized' });
    if (!rewardData) {
      return res.status(400).json({ error: 'Missing reward data' });
    }
    delete rewardData._id;
    delete rewardData.guildID;
    if (rewardData.type === 'atLevel') {
      if (!rewardData.level) {
        return res
          .status(400)
          .json({ error: 'Missing `level` field for `atLevel` option' });
      }
    } else if (rewardData.type === 'everyNLevels') {
      if (!rewardData.everyNLevel || !rewardData.offset) {
        return res.status(400).json({
          error:
            'Missing `everyNLevel` or `offset` field for `everyNLevels` option',
        });
      }
    } else {
      return res.status(400).json({ error: 'Invalid reward type' });
    }
    if (!rewardData.rewards) {
      return res.status(400).json({ error: 'Missing `rewards` field' });
    }

    // validate rewards here
    // check if there are any role rewards, crate rewards, or rank card rewards
    let roleReward = false;
    let crateReward = false;
    let cardReward = false;
    for (const reward of rewardData.rewards) {
      if (reward.type === 'role') {
        roleReward = true;
      } else if (reward.type === 'crate') {
        crateReward = true;
      } else if (reward.type === 'card') {
        cardReward = true;
      }
      // if all 3 are true, break
      if (roleReward && crateReward && cardReward) break;
    }
    let guildData = roleReward
      ? bot.guilds.get(guildID) || (await bot.getRESTGuild(guildID))
      : null;
    let roleData = roleReward ? guildData!.roles : null;
    let crateData = crateReward
      ? await CrateManager.getInstance().getGuildCrateTemplates(guildID)
      : null;
    let cardData = cardReward ? await getGuildCards(guildID) : null;
    for (const reward of rewardData.rewards) {
      if (reward.type === 'role' && roleData) {
        const role = roleData.get(reward.roleID);
        if (!role) {
          return res
            .status(400)
            .json({ error: 'Invalid role ID in reward data' });
        }
        // check if the role is higher than the bot's highest role
        const botHighestRole = roleData.get(
          (
            guildData!.members.get(bot.user.id) ||
            (await guildData!.getRESTMember(bot.user.id))
          )?.roles.sort(
            (a, b) => roleData!.get(b)!.position - roleData!.get(a)!.position
          )[0]
        );
        if (botHighestRole && role.position >= botHighestRole.position) {
          return res.status(400).json({
            error:
              "Invalid role selected in reward data, role is higher than Dazai's highest role.",
          });
        }
      } else if (reward.type === 'crate' && crateData) {
        const crate = crateData.find(
          (x) => x._id.toString() === reward.crateID
        );
        if (!crate) {
          return res
            .status(400)
            .json({ error: 'Invalid crate in reward action' });
        }
        // check if crate is a guild crate
        if (crate.guild !== guildID) {
          return res.status(400).json({
            error:
              'Invalid crate in reward action; only server-wide crates are allowed',
          });
        }
        if (reward.count <= 0 || reward.count > 100 || reward.count % 1 !== 0) {
          return res.status(400).json({
            error:
              'Invalid card count in reward data; must be between 1 and 100 and a whole number',
          });
        }
      } else if (reward.type === 'card' && cardData) {
        const card = cardData.find((x) => x._id.toString() === reward.cardID);
        if (!card) {
          return res
            .status(400)
            .json({ error: 'Invalid card ID in reward data' });
        }
        // check if card is a guild card
        if (card.guild !== guildID) {
          return res.status(400).json({
            error:
              'Invalid card ID in reward data; only server-wide cards are allowed',
          });
        }
        if (reward.count <= 0 || reward.count > 100 || reward.count % 1 !== 0) {
          return res.status(400).json({
            error:
              'Invalid card count in reward data; must be between 1 and 100 and a whole number',
          });
        }
      } else {
        return res.status(400).json({ error: 'Invalid reward type in data' });
      }
      if (reward.action !== 'add' && reward.action !== 'remove') {
        return res.status(400).json({ error: 'Invalid reward action' });
      }
    }

    const member =
      bot.guilds.get(guildID)?.members.get(user.id) ??
      (await bot.getRESTGuildMember(guildID, user.id));
    if (!member) {
      return res.status(400).json({ error: 'Not a member of this guild' });
    }
    const perms =
      member.permissions.has('administrator') ||
      member.permissions.has('manageGuild');
    if (!perms) {
      return res
        .status(400)
        .json({ error: 'Missing permissions, need manage guild or admin' });
    }
    const update = await LevellingRewards.getInstance().addGuildReward(
      guildID,
      rewardData as LevelUpRewardType
    );
    return res.json(update);
  },
} as RESTHandler;
export default updateGuildReward;
