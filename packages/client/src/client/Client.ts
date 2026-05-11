import { EventEmitter } from "events";
import { GatewayManager } from "../gateway/GatewayManager";
import { RESTManager } from "../rest/RESTManager";
import { Message } from "../structures/Message";
import { ChannelManager } from "../managers/ChannelManager";
import { BaseChannel } from "../structures/BaseChannel";
import { ServerManager } from "../managers/ServerManager";
import { Server } from "../structures/Server";
import { UserManager } from "../managers/UserManager";
import { User } from "../structures/User";
import { Member } from "../structures/Member";
import { SweeperManager, SweeperOptions } from "../managers/SweepManager";

export interface ClientEvents {
  ready: [data: any];
  messageCreate: [message: Message];
  messageUpdate: [oldMessage: null | Message, newMessage: Message];
  messageDelete: [message: Message | { id: string; channelId: string }];
  error: [error: Error];
  debug: [message: string];
  raw: [data: any];
  channelCreate: [channel: BaseChannel];
  channelUpdate: [oldChannel: BaseChannel | null, newChannel: BaseChannel];
  channelDelete: [channel: BaseChannel | string];
  serverCreate: [server: Server];
  serverUpdate: [oldServer: Server | null, newServer: Server];
  serverDelete: [server: Server | string];
  userUpdate: [oldUser: User, newUser: User];
  serverMemberJoin: [member: Member];
  serverMemberLeave: [member: Member];
}

export interface ClientOptions {
  sweepers?: SweeperOptions;
}

export class Client extends EventEmitter {
  public rest: RESTManager;
  public gateway: GatewayManager;
  public channels: ChannelManager;
  public servers: ServerManager;
  public users: UserManager;
  public sweepers: SweeperManager;

  constructor(public options: ClientOptions = {}) {
    super({ captureRejections: true });
    this.rest = new RESTManager(this);
    this.gateway = new GatewayManager(this);
    this.channels = new ChannelManager(this);
    this.servers = new ServerManager(this);
    this.users = new UserManager(this);

    this.sweepers = new SweeperManager(this, options.sweepers ?? {});
  }

  /**
   * Connects the bot to the Stoat Gateway
   */
  public async login(token: string): Promise<any> {
    if (!token) throw new Error("A valid token must be provided.");
    this.sweepers.start();
    this.rest.setToken(token);
    return this.gateway.connect(token);
  }

  [Symbol.for("nodejs.rejection")](error: Error) {
    this.emit("error", error);
  }

  public override on<K extends keyof ClientEvents>(event: K, listener: (...args: ClientEvents[K]) => void): this {
    return super.on(event, listener as any);
  }

  public override emit<K extends keyof ClientEvents>(event: K, ...args: ClientEvents[K]): boolean {
    return super.emit(event, ...args);
  }
}
