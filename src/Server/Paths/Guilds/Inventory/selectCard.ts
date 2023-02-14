import { InventoryManager } from '../../../../Handlers/Crates/InventoryManager';
import { RESTMethods, RESTHandler } from '../../../../types/misc';

export const selectCard = {
  method: RESTMethods.POST,
  path: '/guilds/:guildID/inventory/selectCard',
  sendUser: true,
  run: async (req, res, next, user) => {
    if (!user) return res.status(401).json({ error: 'Unauthorized' });
    const guildID = req.params.guildID;
    const cardID = req.body.cardID;
    const inventory = await InventoryManager.getInstance().getUserInventory(
      user.id,
      guildID
    );
    const globalInventory =
      await InventoryManager.getInstance().getUserInventory(user.id, `@global`);

    // chec if card is in inventory
    if (
      !inventory.cards.find((x) => x.id === cardID) &&
      !globalInventory.cards.find((x) => x.id === cardID)
    ) {
      return res.status(400).json({ error: 'Card not in inventory' });
    }
    // check if card is already selected
    if (inventory.selectedCard === cardID) {
      return res.status(400).json({ error: 'Card already selected' });
    }
    await InventoryManager.getInstance().selectCard(user.id, guildID, cardID);
    return res.json({ success: true });
  },
} as RESTHandler;
export default selectCard;
