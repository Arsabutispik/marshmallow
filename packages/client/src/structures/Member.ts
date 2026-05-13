import { Base } from "./Base";
import type { Client } from "../client/Client";
import type { User } from "./User";
import type { Server } from "./Server";
import type { Role } from "./Role";
import { Permissions, PermissionFlags, PermissionResolvable } from "../utils/permissions";
import * as util from "node:util";
import { MemberBanOptions, MemberEditOptions } from "../managers/MemberManager";
import { MemberRoleManager } from "../managers/MemberRoleManager";

export class Member extends Base {
  public serverId!: string;
  public nickname: string | null = null;
  public avatar: string | null = null;
  public roleIds: string[] = [];
  public joinedAt!: Date;
  public timeout: Date | null = null;
  public canPublish: boolean = false;
  public canRecieve: boolean = false;
  public roles: MemberRoleManager;

  constructor(client: Client, data: any) {
    super(client, { _id: data.user._id });

    this.serverId = data.serverId || data.server_id;
    this.joinedAt = new Date(data.joinedAt || data.joined_at);
    this.roles = new MemberRoleManager(this);

    this._patch(data);
  }

  public _patch(data: any) {
    if (data.nickname !== undefined) this.nickname = data.nickname;
    if (data.avatar !== undefined) this.avatar = data.avatar;
    if (data.roles !== undefined) this.roleIds = data.roles;
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

    return this.roleIds.map((id) => server.roles.cache.get(id)).filter((role): role is Role => role !== undefined);
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
  public hasPermission(permission: PermissionResolvable): boolean {
    return Permissions.has(this.permissions, permission);
  }

  /**
   * Edits this member's nickname, avatar, roles, or timeout.
   */
  public async edit(options: MemberEditOptions): Promise<this> {
    let server = this.server;
    if (!server) server = await this.client.servers.fetch(this.serverId);

    return (await server.members.edit(this.id, options)) as this;
  }

  /**
   * Kicks this member from the server.
   */
  public async kick(): Promise<void> {
    let server = this.server;
    if (!server) server = await this.client.servers.fetch(this.serverId);

    await server.members.kick(this.id);
  }

  /**
   * Bans this member from the server.
   * @param options The options for this ban
   */
  public async ban(options?: MemberBanOptions): Promise<void> {
    let server = this.server;
    if (!server) server = await this.client.servers.fetch(this.serverId);

    await server.members.ban(this.id, options);
  }

  public async unban(serverId?: string) {
    if (!serverId) serverId = this.serverId;
    let server = this.client.servers.cache.get(this.serverId!);
    if (!server) server = await this.client.servers.fetch(this.serverId!);
    await server.members.unban(this.id);
  }

  [util.inspect.custom](depth: number, options: util.InspectOptions, inspect: typeof util.inspect) {
    const { client, serverId, ...props } = this;
    return `${this.constructor.name} ${inspect(
      {
        ...props,
        user: this.user,
        permissions: this.permissions,
      },
      { ...options, depth: depth ?? options.depth },
    )}`;
  }
}
