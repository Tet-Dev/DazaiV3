import {
  ApplicationCommandOptions,
  CommandClient,
  Constants,
  Message,
  Interaction,
  CommandInteraction,
  ComponentInteraction,
  ClientEvents,
} from 'eris';
import { APIUser } from 'discord-api-types/v10';
import { NextFunction, Request, Response } from 'express';
import { Socket } from 'socket.io';



export type Omit<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>>
export type PartialBy<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>


export type Command = {
  name: string;
  description: string;
  args: ApplicationCommandOptions[];
  // type any part of Constants.CommandOptionTypes
  type: typeof Constants.ApplicationCommandTypes[keyof typeof Constants.ApplicationCommandTypes];
  aliases?: string[];
  execute: (
    bot: BotClient,
    context: {
      // args: string[];
      // message: Message;
      interaction: CommandInteraction;
    }
  ) => Promise<void> | void;
};
export type EventHandler<K extends keyof ClientEvents> = {
  event: K;
  run: (bot: BotClient, ...args: ClientEvents[K]) => Promise<void> | void;
};
export type ComponentInteractionHandler = {
  run: (
    bot: BotClient,
    interaction: ComponentInteraction
  ) => Promise<void> | void;
  limit?: number;
  whitelistUsers?: string[];
  blacklistUsers?: string[];
  interactionid: string;
  doNotAcknowledge?: boolean;
};
export type BotClient = CommandClient;
export enum RESTMethods {
  GET = 'get',
  POST = 'post',
  PUT = 'put',
  DELETE = 'delete',
}
export interface RESTHandler {
  path: string;
  method: RESTMethods;
  sendUser: boolean;
  run: (
    req: Request,
    res: Response,
    next: NextFunction,
    user?: APIUser
  ) => void | Promise<void> | any | Promise<any>;
}
export interface SocketHandler {
  event: string;
  method: RESTMethods;
  sendUser?: boolean;
  run: (
    socket: Socket,
    user?: APIUser,
    ...args: any[]
  ) => void | Promise<void> | any | Promise<any>;
}
