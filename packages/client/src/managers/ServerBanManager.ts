import type { Server } from "../structures/Server";
import type { Client } from "../client/Client";
import { Collection } from "../utils/Collection";
import { BaseManager } from "./BaseManager";
import { ServerBan } from "../structures/ServerBan";

export interface Ban {
  userId: string;
  reason: string | null;
}

export class ServerBanManager extends BaseManager<string, ServerBan> {
  constructor(
    client: Client,
    public server: Server,
    limit: number = Infinity,
  ) {
    super(client, limit);
  }

  protected extractId(data: any): string {
    return data._id?.user ?? data.id;
  }

  protected construct(data: any): ServerBan {
    return new ServerBan(data);
  }

  /**
   * Fetches all bans in this server.
   * Automatically caches the associated User objects globally!
   * @returns A promise that resolves to a Collection of Bans.
   */
  public async fetch(): Promise<Collection<string, ServerBan>> {
    const data = await this.client.rest.get(`/servers/${this.server.id}/bans`);

    // Cache associated users globally
    if (data.users && Array.isArray(data.users)) {
      for (const userData of data.users) {
        this.client.users._add(userData);
      }
    }

    const rawBans = data.bans || (Array.isArray(data) ? data : []);
    const fetched = new Collection<string, ServerBan>();

    for (const rawBan of rawBans) {
      const ban = this._add(rawBan);
      fetched.set(ban.userId, ban);
    }

    return fetched;
  }

  /**
   * Unbans a user from the server.
   * @param userId The ID of the user to unban.
   */
  public async remove(userId: string): Promise<void> {
    const id = userId.replace(/[<@!>]/g, ""); // Clean the ID just in case
    await this.client.rest.delete(`/servers/${this.server.id}/bans/${id}`);
    this.cache.delete(id);
  }
}
