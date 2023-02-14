import { CardRarity } from '../../../../constants/cardNames';
import {
  createCard,
  getGuildCards,
} from '../../../../Handlers/Crates/CardManager';
import { RESTHandler, RESTMethods } from '../../../../types/misc';

export const createRankCard = {
  method: RESTMethods.POST,
  path: '/guilds/:guildID/settings/cards',
  sendUser: true,
  run: async (req, res, next, user) => {
    const guildID = req.params.guildID;
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const { name, description, rarity, base64 } = req.body as {
      name: string;
      description: string;
      rarity: string;
      base64: string;
    };
    if (!name || !description || !rarity || !base64) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    // check if card rarity is within enum
    if (!Object.values(CardRarity).includes(rarity as CardRarity)) {
      return res.status(400).json({ error: 'Invalid card rarity' });
    }
    // check user persm
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

    // if (rarity === CardRarity.EVENT_RARE || rarity === CardRarity.SECRET_RARE) {
    //   return res.status(400).json({
    //     error: 'Invalid card rarity, cannot create event or secret rare cards',
    //   });
    // }
    // check if permissions are valid
    // res.status(400).json({
    //   error: 'Cannot create a card at this time',
    // });
    // return;
    const currentCardCount = await getGuildCards(guildID);
    if (currentCardCount.length >= 10) {
      return res.status(400).json({
        error: 'Cannot create more than 10 cards per guild',
      });
    }
    let split = base64.indexOf('base64,');
    console.log(
      'Creating card',
      base64.substring(0, 50),
      Buffer.from(base64.substring(split + 7), 'base64').length
    );
    const result = await createCard(
      { name, description, rarity: rarity as CardRarity },
      guildID,
      //   base64 to buffer
      Buffer.from(base64.substring(split + 7), 'base64')
    ).catch((e) => {
      console.log('Card Error', `${e}`);
      return {
        error: true,
        message: `${e}`,
      };
    });
    if (result.error) {
      return res.status(500).json({
        error: (
          result as {
            message: string;
          }
        ).message,
      });
    }
    return res.json(result);
  },
} as RESTHandler;
export default createRankCard;
