// src/structures/Member.ts
import { Base } from "./Base";
import type { Client } from "../client/Client";
import type { User } from "./User";
import type { Server } from "./Server";
import type { Role } from "./Role";
import { Permissions, PermissionFlags } from "../utils/permissions";
import * as util from "node:util";

export class Member extends Base {
  public serverId!: string;
  public nickname: string | null = null;
  public avatar: string | null = null;
  public roles: string[] = [];
  public joinedAt!: Date;
  public timeout: Date | null = null;
  public canPublish: boolean = false;
  public canRecieve: boolean = false;

  constructor(client: Client, data: any) {
    super(client, { _id: data.user._id});

    this.serverId = data.serverId || data.server_id;
    this.joinedAt = new Date(data.joinedAt || data.joined_at);

    this._patch(data);
  }

  public _patch(data: any) {
    if (data.nickname !== undefined) this.nickname = data.nickname;
    if (data.avatar !== undefined) this.avatar = data.avatar;
    if (data.roles !== undefined) this.roles = data.roles;
    if (data.timeout !== undefined) this.timeout = data.timeout ? new Date(data.timeout) : null;
    if (data.can_publish !== undefined) this.canPublish = data.canPublish;
    if (data.can_recieve !== undefined) this.canRecieve = data.canRecieve;
  }

  /** Gets the global User object for this member */
  public get user(): User | undefined {
    return this.client.users.cache.get(this.id);
  }

  /** Gets the Server object this member belongs to */
  public get server(): Server | undefined {
    return this.client.servers.cache.get(this.serverId);
  }

  /** Resolves the array of role strings into actual Role objects */
  public get roleObjects(): Role[] {
    const server = this.server;
    if (!server) return [];

    return this.roles.map((id) => server.roles.cache.get(id)).filter((role): role is Role => role !== undefined);
  }

  /** Calculates the member's total permissions using BigInt */
  public get permissions(): bigint {
    const server = this.server;
    if (!server) return 0n;

    let totalPerms = server.defaultPermissions ?? 0n;

    for (const role of this.roleObjects) {
      totalPerms |= BigInt(role.permissions);
    }

    if (server.ownerId === this.id) {
      return PermissionFlags.GrantAllSafe;
    }

    return totalPerms;
  }

  /** Checks if the member has a specific permission */
  public hasPermission(permission: bigint): boolean {
    return Permissions.has(this.permissions, permission);
  }

  [util.inspect.custom](depth: number, options: util.InspectOptions, inspect: typeof util.inspect) {
    const { client, serverId, ...props } = this;

    return `${this.constructor.name} ${inspect(
      {
        ...props,
        user: this.user,
        permissions: this.permissions,
      },
      options,
    )}`;
  }
}
