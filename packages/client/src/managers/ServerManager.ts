import { Server } from "../structures/Server";
import { Collection } from "../utils/Collection";
import { Client } from "../client/Client";

export class ServerManager {
  public cache: Collection<string, Server> = new Collection();

  constructor(private client: Client) {}

  /**
   * Internal helper to add a server to the cache
   */
  public _add(data: any): Server {
    const server = new Server(this.client, data);
    this.cache.set(server.id, server);
    return server;
  }

  /**
   * Fetches a server from the API
   */
  public async fetch(id: string): Promise<Server> {
    if (this.cache.has(id)) return this.cache.get(id)!;

    const data = await this.client.rest.get(`/servers/${id}`);
    return this._add(data);
  }
}
