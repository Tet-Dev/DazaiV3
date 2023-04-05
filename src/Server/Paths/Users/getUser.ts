import { APIRole } from 'discord-api-types/v10';
import { UserDataManager } from '../../../Handlers/Globals/UserDataManager';
import { DiscordGuildData } from '../../../types/dashboardtypes';
import { RESTHandler, RESTMethods } from '../../../types/misc';

export const getUser = {
  method: RESTMethods.GET,
  path: '/user/@me',
  sendUser: true,
  run: async (req, res, next, user) => {
    if (!user) return res.status(401).send({ error: 'Unauthorized' });
    const botUserData = await UserDataManager.getInstance().getUserData(
      user.id,
      true,
      false
    );
    const data = {
      ...botUserData,
      user,
    };
    return res.json(data);

    //
  },
} as RESTHandler;

export default getUser;
