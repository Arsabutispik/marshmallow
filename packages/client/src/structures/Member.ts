import { Base } from "./Base";
import type { Client } from "../client/Client";
import type { User } from "./User";
import type { Server } from "./Server";
import { Permissions, PermissionFlags, PermissionResolvable } from "../utils/permissions";
import * as util from "node:util";
import { MemberBanOptions, MemberEditOptions } from "../managers/MemberManager";
import { MemberRoleManager } from "../managers/MemberRoleManager";
import { StoatCDN } from "../utils/Constants";
import { Attachment } from "./Attachment";
import { Message, MessageOptions } from "./Message";

/**
 * Represents a member of a server on Stoat
 *
 * @extends {Base}
 */
export class Member extends Base {
  // The server ID the member is in
  public serverId!: string;
  // The nickname the member has in the server, if any.
  public nickname: string | null = null;
  // The avatar the member has in the server, if any.
  public avatar: Attachment | null = null;
  /** @internal */
  private _roles: string[] = [];
  // The date the member joined the server
  public joinedAt!: Date;
  // The date the member's timeout expires, or null if not timed out
  public timeout: Date | null = null;
  // Whatever the user can talk in Voice Chat
  public canPublish: boolean = false;
  // Whatever the user can hear in Voice Chat
  public canRecieve: boolean = false;
  // Member roles manager
  public roles: MemberRoleManager;

  constructor(client: Client, data: any) {
    super(client, { _id: data.user._id });

    this.serverId = data.serverId || data.server_id;
    this.joinedAt = new Date(data.joinedAt || data.joined_at);
    this.roles = new MemberRoleManager(this);

    this._patch(data);
  }

  _patch(data: any) {
    if (data.nickname !== undefined) this.nickname = data.nickname;
    if (data.avatar !== undefined) this.avatar = data.avatar;
    if (data.roles !== undefined) this._roles = data.roles;
    if (data.timeout !== undefined) this.timeout = data.timeout ? new Date(data.timeout) : null;
    if (data.can_publish !== undefined) this.canPublish = data.canPublish;
    if (data.can_recieve !== undefined) this.canRecieve = data.canRecieve;
  }

  /**
   * Get member role IDs
   */
  public get roleIds(): string[] {
    return this._roles;
  }

  /** Gets the global User object for this member */
  public get user(): User | undefined {
    return this.client.users.cache.get(this.id);
  }

  /** Gets the Server object this member belongs to */
  public get server(): Server | undefined {
    return this.client.servers.cache.get(this.serverId);
  }

  /** Calculates the member's total permissions using BigInt */
  public get permissions(): bigint {
    const server = this.server;
    if (!server) return 0n;

    let totalPerms = server.defaultPermissions ?? 0n;

    for (const role of this.roles.cache.values()) {
      totalPerms |= BigInt(role.permissions);
    }

    if (server.ownerId === this.id) {
      return PermissionFlags.GrantAllSafe;
    }

    return totalPerms;
  }

  /** Get avatar URL for this member, or null if they don't have one.
   * @example
   * // Get a member's avatar URL
   * const avatarURL = member.avatarURL;
   * console.log(avatarURL); // https://cdn.stoat.chat/attachments/avatars/1234567890/avatar.png
   */
  public get avatarURL(): string | null {
    if (!this.avatar) return null;
    return `${StoatCDN}/attachments/avatars/${this.avatar.id}/${this.avatar.filename}`;
  }

  /**
   * Ban this member from the server.
   * @param options The options for this ban
   * @example
   * // Ban a member with a reason and delete their messages from the last hour
   * await member.ban({ reason: "Spamming", deleteMessageSeconds: 3600 });
   */
  public async ban(options?: MemberBanOptions): Promise<void> {
    let server = this.server;
    if (!server) server = await this.client.servers.fetch(this.serverId);

    await server.members.ban(this.id, options);
  }

  /**
   * Creates a DM channel between the client's user and this member.
   * @param force If true, forces the creation of a new DM channel even if one already exists.
   * @returns A promise that resolves to the created DMChannel object.
   * @throws {Error} If the API request fails.
   * @example
   * // Create a DM with this member
   * const dm = await member.createDM();
   * console.log(`DM channel ID: ${dm.id}`);
   */
  public async createDM(force: boolean = false): Promise<void> {
    await this.client.users.createDM(this.id, { force });
  }

  /**
   * Timeout this member for a specified duration.
   * @param duration The duration of the timeout in milliseconds.
   * @example
   * // Timeout a member for 10 minutes (600,000 milliseconds)
   * await member.setTimeout(600000);
   */
  public async setTimeout(duration: number): Promise<void> {
    let server = this.server;
    if (!server) server = await this.client.servers.fetch(this.serverId);

    await this.edit({ timeout: new Date(Date.now() + duration).toISOString() });
  }

  /**
   * Send a message to this member.
   * @param options The content or options for the message to send.
   * @returns A promise that resolves to the sent Message object.
   * @throws {Error} If the API request fails.
   * @example
   * // Send a message to this member
   * const message = await member.send("Hello!");
   * console.log(`Sent message ID: ${message.id}`);
   */
  public async send(options: string | MessageOptions): Promise<Message> {
    let dmChannel = await this.client.users.createDM(this.id);
    return dmChannel.messages.send(options);
  }

  public async setNickname(nickname: string): Promise<Member> {
    return this.edit({ nickname });
  }

  /** Checks if the member has a specific permission */
  public hasPermission(permission: PermissionResolvable): boolean {
    return Permissions.has(this.permissions, permission);
  }

  /**
   * Edit this member.
   * @param options The options to edit the member with (nickname, roles, timeout, etc.)
   * @returns A promise that resolves to the updated Member.
   */
  public async edit(options: MemberEditOptions): Promise<Member> {
    let server = this.server;
    if (!server) server = await this.client.servers.fetch(this.serverId);

    return await server.members.edit(this.id, options);
  }

  /**
   * When concatenated with a string, this automatically returns the user's mention instead of the GuildMember object.
   * @returns {string}
   * @example
   * // Logs: Hello from <@01JE2MM759J5D7CHJF084R7MJ2>!
   * console.log(`Hello from ${member}!`);
   */
  public override toString(): string {
    return `<@${this.id}>`;
  }

  /**
   * Kick this member from the server.
   */
  public async kick(): Promise<void> {
    let server = this.server;
    if (!server) server = await this.client.servers.fetch(this.serverId);

    await server.members.kick(this.id);
  }

  /** @internal */
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
