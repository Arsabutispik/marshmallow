import { BaseChannel } from "./BaseChannel";
import { Client } from "../client/Client";
import { Attachment } from "./Attachment";
import { PermissionResolvable, Permissions } from "../utils/permissions";
import { ChannelRolePermissionOptions } from "../managers/ChannelManager";

export class TextChannel extends BaseChannel {
  public name!: string;
  public serverId!: string;
  public defaultPermissions?: { a: number; d: number };
  public description?: string | null;
  public icon?: Attachment | null;
  public lastMessageId?: string | null;
  public nsfw?: boolean;
  public slowmode?: number;
  public voice?: any;

  constructor(client: Client, data: any) {
    super(client, data);
    this.serverId = data.server;
    this.defaultPermissions = data.default_permissions;
    this.description = data.description;
    this.icon = data.icon;
    this.lastMessageId = data.last_message_id;
    this.nsfw = data.nsfw ?? false;
    this.slowmode = data.slowmode ?? 0;
    this.voice = data.voice;
    this._patch(data);
  }

  public _patch(data: any, clear?: string[]) {
    if (data.name !== undefined) this.name = data.name;
    if (data.description !== undefined) this.description = data.description;

    if (clear && Array.isArray(clear)) {
      for (const field of clear) {
        switch (field) {
          case "Description":
            this.description = null;
            break;
        }
      }
    }
  }

  /**
   * Updates the permission overrides for the channel.
   * @param roleId The raw string ID of the role to update.
   * @param options The allow and deny permissions to set.
   * @returns A promise that resolves to the updated BaseChannel.
   * @throws {TypeError} If the channel is not a Server Channel, or options are invalid.
   * @throws {Error} If the API request fails.
   * @example
   * // Deny a role the ability to send messages in this channel
   * await channel.setRolePermissions("ROLE_ID", { deny: ["SendMessage"] });
   */
  public async setRolePermissions(roleId: string, options: ChannelRolePermissionOptions): Promise<this> {
    return (await this.client.channels.setRolePermissions(this.id, roleId, options)) as this;
  }

  /**
   * Updates the default (everyone) permissions for this channel.
   * @param permissions The default permissions to grant globally in this channel.
   * @returns A promise that resolves to the updated BaseChannel.
   * @throws {TypeError} If invalid permissions are provided.
   * @throws {Error} If the API request fails.
   * @example
   * // Set the default permission to allow everyone to view the channel
   * await channel.setDefaultPermissions(["ViewChannel", "ReadMessageHistory"]);
   */
  public async setDefaultPermissions(permissions: PermissionResolvable): Promise<this> {
    return (await this.client.channels.setDefaultPermissions(this.id, permissions)) as this;
  }
}
