import { CardType } from '../../../../constants/cardNames';
import { getCard } from '../../../../Handlers/Crates/CardManager';
import { CrateManager } from '../../../../Handlers/Crates/CrateManager';
import { InventoryManager } from '../../../../Handlers/Crates/InventoryManager';
import { RESTMethods, RESTHandler } from '../../../../types/misc';

export const getUserCrates = {
  method: RESTMethods.GET,
  path: '/inventory/crates',
  sendUser: true,
  run: async (req, res, next, user) => {
    if (!user) return res.status(401).json({ error: 'Unauthorized' });
    const guildID = req.params.guildID;
    const crates = await CrateManager.getInstance().getUserCrates(
      user.id,
      guildID,
      false,
      true
    );
    return res.json(crates);
  },
} as RESTHandler;
export default getUserCrates;
