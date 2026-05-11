// src/managers/ServerChannelManager.ts
import { Collection } from "../utils/Collection";
import type { BaseChannel } from "../structures/BaseChannel";
import type { Server } from "../structures/Server";
import type { Client } from "../client/Client";
import * as util from "node:util";

export class ServerChannelManager {
  constructor(
    private client: Client,
    private server: Server,
  ) {}

  public get cache(): Collection<string, BaseChannel> {
    return this.client.channels.cache.filter((channel) => (channel as any).serverId === this.server.id);
  }

  [util.inspect.custom]() {
    return this.cache;
  }
}
