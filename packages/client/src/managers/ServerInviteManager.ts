import type { Server } from "../structures/Server";
import type { Client } from "../client/Client";
import { Collection } from "../utils/Collection";
import { ServerInvite } from "../structures/ServerInvite";
import { BaseManager } from "./BaseManager";

export interface Invite {
  code: string;
  creatorId: string;
  channelId: string;
}

export class ServerInviteManager extends BaseManager<string, ServerInvite> {
  constructor(
    client: Client,
    public server: Server,
    limit: number = Infinity,
  ) {
    super(client, limit);
  }

  protected extractId(data: any): string {
    return data._id ?? data.code;
  }

  protected construct(data: any): ServerInvite {
    return new ServerInvite(data);
  }

  /**
   * Fetches all active invites for this server.
   */
  public async fetch(): Promise<Collection<string, ServerInvite>> {
    const data = await this.client.rest.get(`/servers/${this.server.id}/invites`);

    const rawInvites = Array.isArray(data) ? data : [];
    const fetched = new Collection<string, ServerInvite>();

    for (const raw of rawInvites) {
      const invite = this._add(raw);
      fetched.set(invite.code, invite);
    }

    return fetched;
  }
}
