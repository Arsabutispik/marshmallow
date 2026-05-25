import { Collection } from "../utils/Collection";
import type { BaseChannel, ChannelCreateOptions } from "../structures/BaseChannel";
import type { Server } from "../structures/Server";
import type { Client } from "../client/Client";
import * as util from "node:util";

export class ServerChannelManager {
  public client: Client;
  public server: Server;

  constructor(client: Client, server: Server) {
    this.client = client;
    this.server = server;
  }

  public get cache(): Collection<string, BaseChannel> {
    return this.client.channels.cache.filter((channel) => (channel as any).serverId === this.server.id);
  }

  /**
   * Creates a new channel within this server.
   * @param options The configuration for the new channel.
   * @returns The newly created Channel object.
   */
  public async create(options: ChannelCreateOptions): Promise<BaseChannel> {
    if (!options.name) throw new Error("A channel name must be provided.");

    const payload: any = {
      name: options.name,
      type: options.type ?? "Text",
      description: options.description,
      nsfw: options.nsfw ?? false,
    };

    if (options.type === "Voice" && options.voice?.max_users) {
      payload.voice = { max_users: options.voice.max_users };
    }

    const data = await this.client.rest.post(`/servers/${this.server.id}/channels`, payload);

    return this.client.channels._add(data);
  }

  [util.inspect.custom]() {
    return this.cache;
  }
}
