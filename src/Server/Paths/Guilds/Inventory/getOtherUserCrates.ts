import { CardType } from '../../../../constants/cardNames';
import { getCard } from '../../../../Handlers/Crates/CardManager';
import { CrateManager } from '../../../../Handlers/Crates/CrateManager';
import { InventoryManager } from '../../../../Handlers/Crates/InventoryManager';
import { RESTMethods, RESTHandler } from '../../../../types/misc';

export const getUserCrates = {
  method: RESTMethods.GET,
  path: '/inventory/crates/user/:userID',
  sendUser: false,
  run: async (req, res, next, user) => {
    const { userID } = req.params;
    if (!userID) return res.status(400).json({ error: 'Bad Request' });
    const crates = await CrateManager.getInstance().getUserCrates(userID);
    return res.json(crates);
  },
} as RESTHandler;
export default getUserCrates;
