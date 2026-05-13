import { BaseManager } from "./BaseManager";
import { Server } from "../structures/Server";
import type { Client } from "../client/Client";
import * as util from "node:util";

export interface ServerEditOptions {
  name?: string;
  description?: string | null;
  icon?: string | null;
  banner?: string | null;
  categories?: {
    id: string;
    title: string;
    channels: string[];
  }[];
  systemMessages?: {
    userJoined?: string | null;
    userLeft?: string | null;
    userKicked?: string | null;
    userBanned?: string | null;
  };
  analytics?: boolean;
  owner?: string;
}

export class ServerManager extends BaseManager<string, Server> {
  constructor(client: Client, limit: number = Infinity) {
    super(client, limit);
  }

  /**
   * Tell BaseManager how to find the ID for Servers
   */
  protected extractId(data: any): string {
    return data._id ?? data.id;
  }

  /**
   * Tell BaseManager how to build a Server
   */
  protected construct(data: any): Server {
    return new Server(this.client, data);
  }

  /**
   * Fetches a server from the API.
   * @param id The server ID.
   * @param force Whether to skip the cache and fetch from the API.
   */
  public async fetch(id: string, force: boolean = false): Promise<Server> {
    if (!force) {
      const cached = this.cache.get(id);
      if (cached) return cached;
    }

    const data = await this.client.rest.get(`/servers/${id}`);
    return this._add(data);
  }

  public async edit(serverId: string, options: ServerEditOptions): Promise<Server> {
    const payload: any = {};
    const remove: string[] = [];

    if (options.name !== undefined) payload.name = options.name;
    if (options.description !== undefined) {
      if (options.description === null) remove.push("Description");
      else payload.description = options.description;
    }

    if (options.icon !== undefined) {
      if (options.icon === null) remove.push("Icon");
      else payload.icon = options.icon;
    }
    if (options.banner !== undefined) {
      if (options.banner === null) remove.push("Banner");
      else payload.banner = options.banner;
    }

    // System Messages
    if (options.systemMessages) {
      payload.system_messages = {};
      const sm = options.systemMessages;
      if (sm.userJoined !== undefined) {
        if (sm.userJoined === null) remove.push("SystemMessageUserJoined");
        else payload.system_messages.user_joined = sm.userJoined;
      }
      if (sm.userLeft !== undefined) {
        if (sm.userLeft === null) remove.push("SystemMessageUserLeft");
        else payload.system_messages.user_left = sm.userLeft;
      }
      if (sm.userKicked !== undefined) {
        if (sm.userKicked === null) remove.push("SystemMessageUserKicked");
        else payload.system_messages.user_kicked = sm.userKicked;
      }
      if (sm.userBanned !== undefined) {
        if (sm.userBanned === null) remove.push("SystemMessageUserBanned");
        else payload.system_messages.user_banned = sm.userBanned;
      }
    }

    if (options.categories !== undefined) payload.categories = options.categories;
    if (options.analytics !== undefined) payload.analytics = options.analytics;
    if (options.owner !== undefined) payload.owner = options.owner;

    if (remove.length > 0) payload.remove = remove;

    const data = await this.client.rest.patch(`/servers/${serverId}`, payload);

    // Using _add ensures the existing Server object is patched!
    return this._add(data);
  }

  [util.inspect.custom]() {
    return this.cache;
  }
}
