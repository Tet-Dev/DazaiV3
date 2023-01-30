import { APIUser } from 'discord-api-types/v10';
import nfetch from '../../Handlers/FixedNodeFetch';
const userMap = new Map<
  string,
  {
    user: APIUser;
    expires: number;
  }
>();
export const getDiscordUser = async (
  token?: string,
  fresh: boolean = false
) => {
  if (!token) return undefined;
  if (userMap.has(token) && !fresh) {
    const { user, expires } = userMap.get(token)!;
    const botUser = bot.users.get(user.id);

    if (expires > Date.now()) {
      if (botUser) {
        userMap.set(token, {
          user: botUser,
          expires,
        });
        return botUser;
      }
      return user;
    }
  }
  const res = await nfetch('https://discord.com/api/v10/users/@me', {
    headers: {
      Authorization: token,
    },
  });
  if (!res.ok) return undefined;
  const user = (await res.json()) as APIUser;
  userMap.set(token, {
    user: user,
    expires: Date.now() + 1000 * 60 * 15,
  });
  return user;
};
