import { Collection } from "../utils/Collection";
import { Role } from "../structures/Role";
import type { Server } from "../structures/Server";
import type { Client } from "../client/Client";
import * as util from "node:util";

export class RoleManager {
  public cache = new Collection<string, Role>();

  constructor(
    private client: Client,
    private server: Server,
  ) {}

  public _add(data: any): Role {
    const id = data._id ?? data.id;
    const existing = this.cache.get(id);

    if (existing) {
      existing._patch(data);
      return existing;
    }

    const role = new Role(this.client, data, this.server.id);
    this.cache.set(role.id, role);
    return role;
  }

  [util.inspect.custom]() {
    return this.cache;
  }
}
