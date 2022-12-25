import express, { NextFunction, Request, Response } from 'express';
import { readdir, lstat } from 'fs/promises';
import https from 'https';
import cors from 'cors';
import { RESTHandler } from '../types/misc';
import { getDiscordUser } from './Utils/getDiscordUser';
import { join } from 'path';
const server = express();
server.use(cors());
server.use(express.json());

export default function initServer() {
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
            const handler = module.default as RESTHandler;
            if (!handler) {
              return failedImports.push(`${file} is not a REST handler`);
            }
            console.log(handler);
            server[handler.method](handler.path, async (req, res, next) => {
              let userInfo = handler.sendUser
                ? await getDiscordUser(req.headers.authorization!)
                : null;
              handler.run(
                req as Request,
                res as Response,
                next,
                userInfo || undefined
              );
            });
            console.log(`Loaded ${file}`);
            return null;
          })
          .catch((err) => {
            console.error(`Failed to import ${file}`);
            console.error(err);
            failedImports.push(`${file} failed to import`);
          });
      })
    );
  };
  const failedImports = [] as string[];
  importAllHandlers(join(__dirname, 'Paths'), failedImports).then(() =>
    console.log(failedImports)
  );

  if (env?.webserver) {
    const httpsServer = https.createServer(
      {
        //@ts-ignore
        key: readFileSync(env.webserver?.keyPath),
        //@ts-ignore
        cert: readFileSync(env.webserver?.certPath),
      },
      server
    );
    httpsServer.listen(env.port, () => {
      console.log(`Secure HTTP Server started on port ${env.port}`);
    });
    //   new SocketServer(
    //     httpsServer.listen(env.port, () => {
    //       console.log(`Secure HTTP Server started on port ${env.port}`);
    //     })
    //   );
  } else {
    console.log(`HTTP Server running on port ${env.port}`);
    server.listen(env.port);
    //   const SocketAPI = new SocketServer(server.listen(env.port));
  }
  return server;
}
