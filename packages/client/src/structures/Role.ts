import { Base } from "./Base";
import type { Client } from "../client/Client";
import type { Server } from "./Server";
import * as util from "node:util";

export class Role extends Base {
  public serverId: string;
  public name!: string;
  public color: string | null = null;
  public hoist: boolean = false;
  public rank: number = 0;
  public permissions: bigint = 0n;

  constructor(client: Client, data: any, serverId: string) {
    super(client, data);
    this.serverId = serverId;
    this._patch(data);
  }

  public _patch(data: any) {
    if (data.name !== undefined) this.name = data.name;
    if (data.color !== undefined) this.color = data.color;
    if (data.hoist !== undefined) this.hoist = data.hoist;
    if (data.rank !== undefined) this.rank = data.rank;
    if (data.permissions !== undefined) {
      try {
        if (typeof data.permissions === "object" && data.permissions !== null) {
          const allowPerms = data.permissions.a ?? data.permissions[0] ?? 0;
          this.permissions = BigInt(allowPerms);
        } else {
          this.permissions = BigInt(data.permissions);
        }
      } catch {
        this.permissions = 0n;
      }
    }
  }

  public get server(): Server | undefined {
    return this.client.servers.cache.get(this.serverId);
  }

  [util.inspect.custom]() {
    const { client, serverId, ...props } = this;
    return `${this.constructor.name} ${util.inspect(props)}`;
  }
}
