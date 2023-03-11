import { CardType } from '../../../../constants/cardNames';
import { getCard } from '../../../../Handlers/Crates/CardManager';
import { InventoryManager } from '../../../../Handlers/Crates/InventoryManager';
import { RESTMethods, RESTHandler } from '../../../../types/misc';

export const getInventory = {
  method: RESTMethods.GET,
  path: '/guilds/:guildID/inventory/sell/:cardID',
  sendUser: true,
  run: async (req, res, next, user) => {
    if (!user) return res.status(401).json({ error: 'Unauthorized' });
    const guildID = req.params.guildID;
    const cardID = req.params.cardID;
    const inventory = await InventoryManager.getInstance().getUserInventory(
      user.id,
      guildID
    );
    const globalInventory =
      await InventoryManager.getInstance().getUserInventory(user.id, '@global');
    inventory.cards = inventory.cards.concat(globalInventory.cards);
    const sellCard = inventory.cards.find((x) => x.cardID === cardID);

    if (!sellCard) return res.status(404).json({ error: 'Card not found' });
    const card = await getCard(sellCard?.cardID);
    if (!card?.sellPrice || card.sellPrice <= 0)
      return res.status(400).json({ error: 'Card cannot be sold' });
    await InventoryManager.getInstance().removeCardFromInventory(
      user.id,
      guildID,
      cardID
    );
    await InventoryManager.getInstance().addMoneyToInventory(
      user.id,
      guildID,
      card.sellPrice
    );
    return res.json({
      success: true,
      money: card.sellPrice,
    });
  },
} as RESTHandler;
export default getInventory;
