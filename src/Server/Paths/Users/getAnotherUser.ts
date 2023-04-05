import { APIRole } from 'discord-api-types/v10';
import { UserDataManager } from '../../../Handlers/Globals/UserDataManager';
import { DiscordGuildData } from '../../../types/dashboardtypes';
import { RESTHandler, RESTMethods } from '../../../types/misc';

export const getUser = {
  method: RESTMethods.GET,
  path: '/user/:id',
  sendUser: false,
  run: async (req, res, next, user) => {
    if (!req.params.id)
      return res.status(401).send({ error: 'User ID required' });
    const id = req.params.id;
    if (id === '@me') return next();
    const botUserData = await UserDataManager.getInstance().getUserData(
      id,
      false,
      true
    );
    if (!botUserData) return res.status(404).send({ error: 'User not found' });

    const data = {
      ...botUserData,
      user,
    };
    return res.json(data);

    //
  },
} as RESTHandler;

export default getUser;
