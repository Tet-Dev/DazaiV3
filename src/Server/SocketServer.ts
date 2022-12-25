import { lstat, readdir } from 'fs/promises';
import { join } from 'path';
import { Server } from 'socket.io';
import { SocketHandler } from 'types/misc';
import { getDiscordUser } from './Utils/getDiscordUser';

const eventMap = new Map<string, SocketHandler>();
const importAllHandlers = async (path: string, failedImports: string[]) => {
  await Promise.all(
    (
      await readdir(path)
    ).map(async (file) => {
      console.log(`Importing ${file}`);
      if ((await lstat(`${path}/${file}`)).isDirectory()) {
        console.log(`Importing Folder ${path}/${file}`);
        return await importAllHandlers(`${path}/${file}`, failedImports);
      }
      if (!file.endsWith('.ts') && !file.endsWith('.js')) {
        return;
      }
      import(`${path}/${file}`)
        .then((module) => {
          console.log(`${file} imported`);
          const handler = module.default as SocketHandler;
          if (!handler) {
            return failedImports.push(`${file} is not a REST handler`);
          }
          eventMap.set(handler.event, handler);
        })
        .catch((err) => {
          console.error(`Failed to import ${file}`);
          console.error(err);
          failedImports.push(`${file} failed to import`);
        });
    })
  );
};
export function initSocketServer(server: Express.Application) {
  const io = new Server(server, {});
  importAllHandlers(join(__dirname, 'Paths'), []);
  io.on('connection', async (socket) => {
    const user = await getDiscordUser(socket.handshake.headers.authorization);
    if (!user) return socket.disconnect(true);
    socket.onAny(async (event, ...args) => {
      console.log(event, args);
      if (eventMap.has(event)) {
        const handler = eventMap.get(event);
        handler!.run(
          socket,
          handler?.sendUser
            ? await getDiscordUser(socket.handshake.headers.authorization)
            : undefined,
          ...args
        );
      }
    });
    socket.on('disconnect', () => {
      console.log('User disconnected');
    });
  });
}
