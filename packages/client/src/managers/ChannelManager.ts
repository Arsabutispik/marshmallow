import { BaseChannel } from "../structures/BaseChannel";
import { createChannel } from "../utils/ChannelFactory";
import type { Client } from "../client/Client";
import { TextChannel } from "../structures/TextChannel";
import { DMChannel } from "../structures/DMChannel";
import { GroupChannel } from "../structures/GroupChannel";
import { Permissions, type PermissionResolvable } from "../utils/permissions";
import { BaseManager } from "./BaseManager";

export type ChannelResolvable = BaseChannel | string;

export interface ChannelEditOptions {
  name?: string;
  description?: string | null;
  owner?: string;
  icon?: string | null;
  nsfw?: boolean;
  archived?: boolean;
  voice?: { max_users: number };
  slowmode?: number;
}

export interface ChannelRolePermissionOptions {
  allow?: PermissionResolvable;
  deny?: PermissionResolvable;
}

export class ChannelManager extends BaseManager<string, BaseChannel> {
  /**
   * Manages API methods and caching for all channels globally.
   * @param client The active Client instance.
   * @param limit The maximum number of channels to hold in the cache.
   */
  constructor(client: Client, limit: number = Infinity) {
    super(client, limit);
  }

  protected extractId(data: any): string {
    return data._id ?? data.id;
  }

  protected construct(data: any): BaseChannel {
    return createChannel(this.client, data);
  }

  /**
   * Resolves a ChannelResolvable to a cached BaseChannel object.
   * @param channel The ChannelResolvable to resolve.
   * @returns The resolved BaseChannel, or undefined if not cached.
   */
  public resolve(channel: ChannelResolvable): BaseChannel | undefined {
    if (channel instanceof BaseChannel) return channel;

    if (typeof channel === "string") {
      const id = channel.replace(/[<#>]/g, "");
      return this.cache.get(id);
    }

    return undefined;
  }

  public resolveText(channel: ChannelResolvable): TextChannel | undefined {
    const resolved = this.resolve(channel);
    return resolved?.isText() ? resolved : undefined;
  }

  public resolveDM(channel: ChannelResolvable): DMChannel | undefined {
    const resolved = this.resolve(channel);
    return resolved?.isDM() ? resolved : undefined;
  }

  public resolveGroup(channel: ChannelResolvable): GroupChannel | undefined {
    const resolved = this.resolve(channel);
    return resolved?.isGroup() ? resolved : undefined;
  }

  /**
   * Extracts ID from a ChannelResolvable.
   * @param channel The ChannelResolvable to extract the ID from.
   * @returns The extracted channel ID.
   * @throws {TypeError} If an invalid type is provided.
   */
  public resolveId(channel: ChannelResolvable): string {
    if (channel instanceof BaseChannel) {
      return channel.id;
    }

    if (typeof channel === "string") {
      return channel.replace(/[<#>]/g, "");
    }

    throw new TypeError("Invalid ChannelResolvable provided. Expected a BaseChannel object or a string ID/Mention.");
  }

  /**
   * Fetches a Channel from the API or resolves it from the local cache.
   * @param channel The ID, mention, or Channel object to fetch.
   * @param force Whether to skip the cache check and force a direct API request. Defaults to true.
   * @returns A promise that resolves to the fetched BaseChannel object.
   * @throws {TypeError} If an invalid ChannelResolvable is provided.
   * @throws {Error} If the API request fails.
   * @example
   * // Fetch a channel, bypassing cache
   * const channel = await client.channels.fetch("01H...");
   */
  public async fetch(channel: ChannelResolvable, force: boolean = true): Promise<BaseChannel> {
    if (!force) {
      const cached = this.resolve(channel);
      if (cached) return cached;
    }

    const id = this.resolveId(channel);
    const data = await this.client.rest.get(`/channels/${id}`);

    return this._add(data);
  }

  /**
   * Edits a channel in the server.
   * @param channel The ChannelResolvable to edit.
   * @param options The fields to update.
   * @returns A promise that resolves to the updated BaseChannel.
   * @throws {TypeError} If invalid options or ChannelResolvable are provided.
   * @throws {Error} If the API request fails.
   * @example
   * // Update channel name and remove its description
   * await client.channels.edit("01H...", { name: "general", description: null });
   */
  public async edit(channel: ChannelResolvable, options: ChannelEditOptions): Promise<BaseChannel> {
    if (!options || typeof options !== "object") {
      throw new TypeError("ChannelEditOptions must be a valid object.");
    }

    const payload: any = {};
    const remove: string[] = [];

    if (options.name !== undefined) payload.name = options.name;
    if (options.owner !== undefined) payload.owner = options.owner;
    if (options.nsfw !== undefined) payload.nsfw = options.nsfw;
    if (options.archived !== undefined) payload.archived = options.archived;
    if (options.voice !== undefined) payload.voice = options.voice;
    if (options.slowmode !== undefined) payload.slowmode = options.slowmode;

    if (options.description !== undefined) {
      if (options.description === null) remove.push("Description");
      else payload.description = options.description;
    }

    if (options.icon !== undefined) {
      if (options.icon === null) remove.push("Icon");
      else payload.icon = options.icon;
    }

    if (remove.length > 0) payload.remove = remove;
    if (Object.keys(payload).length === 0) return this.fetch(channel);

    const data = await this.client.rest.patch(`/channels/${this.resolveId(channel)}`, payload);
    return this._add(data);
  }

  /**
   * Updates the permission overrides for a specific role in a channel.
   * @param channel The ChannelResolvable to update permissions for.
   * @param roleId The raw string ID of the role to update.
   * @param options The allow and deny permissions to set.
   * @returns A promise that resolves to the updated BaseChannel.
   * @throws {TypeError} If the channel is not a Server Channel, or options are invalid.
   * @throws {Error} If the API request fails.
   * @example
   * // Deny a role the ability to send messages in this channel
   * await client.channels.setRolePermissions(channel, "ROLE_ID", { deny: ["SendMessage"] });
   */
  public async setRolePermissions(
    channel: ChannelResolvable,
    roleId: string,
    options: ChannelRolePermissionOptions,
  ): Promise<BaseChannel> {
    const resolved = this.resolve(channel);
    if (resolved && !resolved.isText()) {
      throw new TypeError("Role permissions can only be set on Server Channels.");
    }

    if (!options || typeof options !== "object") {
      throw new TypeError("ChannelRolePermissionOptions must be a valid object.");
    }

    const id = this.resolveId(channel);
    const allowBigInt = options.allow !== undefined ? Permissions.resolve(options.allow) : 0n;
    const denyBigInt = options.deny !== undefined ? Permissions.resolve(options.deny) : 0n;

    const payload = {
      permissions: {
        allow: Number(allowBigInt),
        deny: Number(denyBigInt),
      },
    };

    const data = await this.client.rest.put(`/channels/${id}/permissions/${roleId}`, payload);
    return this._add(data);
  }

  /**
   * Updates the default (everyone) permissions for a channel.
   * @param channel The ChannelResolvable to update permissions for.
   * @param permissions The default permissions to grant globally in this channel.
   * @returns A promise that resolves to the updated BaseChannel.
   * @throws {TypeError} If invalid permissions are provided.
   * @throws {Error} If the API request fails.
   * @example
   * // Set the default permission to allow everyone to view the channel
   * await client.channels.setDefaultPermissions(channel, ["ViewChannel", "ReadMessageHistory"]);
   */
  public async setDefaultPermissions(
    channel: ChannelResolvable,
    permissions: PermissionResolvable,
  ): Promise<BaseChannel> {
    const resolved = this.resolve(channel);
    if (resolved && resolved.isDM()) {
      throw new TypeError("Default permissions cannot be set on Direct Message channels.");
    }

    const id = this.resolveId(channel);
    const permBigInt = Permissions.resolve(permissions);

    const payload = {
      permissions: Number(permBigInt),
    };

    const data = await this.client.rest.put(`/channels/${id}/permissions/default`, payload);
    return this._add(data);
  }

  /**
   * Deletes a server channel, leaves a group, or closes a DM.
   * @param channel The channel object, raw ID, or mention string to delete.
   * @returns A promise that resolves when the action is successful.
   * @throws {Error} If the API request fails.
   * @example
   * await client.channels.delete("01H...");
   */
  public async delete(channel: ChannelResolvable): Promise<void> {
    const id = this.resolveId(channel);
    await this.client.rest.delete(`/channels/${id}`);
    this.cache.delete(id);
  }
}
