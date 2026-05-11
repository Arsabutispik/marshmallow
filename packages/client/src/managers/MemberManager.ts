import { Member } from "../structures/Member";
import { Collection } from "../utils/Collection";
import type { Client } from "../client/Client";
import type { Server } from "../structures/Server";
import * as util from "node:util";

export class MemberManager {
  public cache: Collection<string, Member> = new Collection();

  constructor(
    private client: Client,
    private server: Server,
  ) {}

  public _add(data: any): Member {
    const id = data.user_id ?? data.id ?? data._id;
    const existing = this.cache.get(id);

    if (existing) {
      existing._patch(data);
      return existing;
    }

    if (!data.server_id && !data.serverId) {
      data.serverId = this.server.id;
    }

    const member = new Member(this.client, data);
    this.cache.set(member.id, member);
    return member;
  }

  [util.inspect.custom]() {
    return this.cache;
  }
}
