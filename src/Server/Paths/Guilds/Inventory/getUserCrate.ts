import { CardType } from '../../../../constants/cardNames';
import { getCard } from '../../../../Handlers/Crates/CardManager';
import { CrateManager } from '../../../../Handlers/Crates/CrateManager';
import { InventoryManager } from '../../../../Handlers/Crates/InventoryManager';
import { RESTMethods, RESTHandler } from '../../../../types/misc';

export const getUserCrates = {
  method: RESTMethods.GET,
  path: '/inventory/crates/:crateID',
  sendUser: false,
  run: async (req, res, next, user) => {
    const { guildID, crateID } = req.params;
    const crate = await CrateManager.getInstance().getUserCrate(crateID);
    if (!crate) return res.status(404).json({ error: 'Crate not found' });
    res.set('Cache-Control', 'public, max-age=15');
    return res.json(crate);
  },
} as RESTHandler;
export default getUserCrates;
