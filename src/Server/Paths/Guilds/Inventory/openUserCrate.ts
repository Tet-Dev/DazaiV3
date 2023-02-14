import { CardType } from '../../../../constants/cardNames';
import { getCard } from '../../../../Handlers/Crates/CardManager';
import { CrateManager } from '../../../../Handlers/Crates/CrateManager';
import { InventoryManager } from '../../../../Handlers/Crates/InventoryManager';
import { RESTMethods, RESTHandler } from '../../../../types/misc';

export const getUserCrates = {
  method: RESTMethods.POST,
  path: '/inventory/crates/:crateID/open',
  sendUser: true,
  run: async (req, res, next, user) => {
    if (!user) return res.status(401).json({ error: 'Unauthorized' });
    const { guildID, crateID } = req.params;
    const crate = await CrateManager.getInstance().getUserCrate(crateID);
    if (!crate) return res.status(404).json({ error: 'Crate not found' });
    if (crate.userID !== user.id)
      return res.status(403).json({ error: 'Forbidden, not your crate' });
    if (crate.opened)
      return res.status(403).json({ error: 'Crate already opened' });
    const result = await CrateManager.getInstance().openCrate(crateID);
    if (!result) return res.status(500).json({ error: 'Failed to open crate' });
    return res.json(result);
  },
} as RESTHandler;
export default getUserCrates;
