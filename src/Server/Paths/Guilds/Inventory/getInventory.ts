import { CardType } from '../../../../constants/cardNames';
import { getCard } from '../../../../Handlers/Crates/CardManager';
import { InventoryManager } from '../../../../Handlers/Crates/InventoryManager';
import { RESTMethods, RESTHandler } from '../../../../types/misc';

export const getInventory = {
  method: RESTMethods.GET,
  path: '/guilds/:guildID/inventory',
  sendUser: true,
  run: async (req, res, next, user) => {
    if (!user) return res.status(401).json({ error: 'Unauthorized' });
    const guildID = req.params.guildID;
    const inventory = await InventoryManager.getInstance().getUserInventory(
      user.id,
      guildID
    );
    const globalInventory =
      await InventoryManager.getInstance().getUserInventory(user.id, '@global');
    inventory.cards = inventory.cards.concat(globalInventory.cards);
    let cardIds = new Set(inventory.cards.map((x) => x.cardID));
    const cardMap = new Map<string, CardType>();
    await Promise.all(Array.from(cardIds.keys()).map(getCard)).then((x) => {
      x.forEach((y) => {
        if (y) cardMap.set(y._id.toString(), y);
      });
    });
    console.log(cardIds, inventory.cards);
    let cards = await Promise.all(
      inventory.cards.map(async (x) => {
        let card = cardMap.get(x.cardID);
        return {
          ...x,
          card,
        };
      })
    );
    delete inventory._id;
    return res.json({
      ...inventory,
      cards,
    });
  },
} as RESTHandler;
export default getInventory;
