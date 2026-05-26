import { BaseChannel } from "./BaseChannel";
import { Client } from "../client/Client";
import { Attachment } from "./Attachment";
import { PermissionResolvable } from "../utils/permissions";
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
          case "Icon":
            this.icon = null;
            break;
          case "DefaultPermissions":
            this.defaultPermissions = data.default_permissions;
            break;
          case "Voice":
            this.voice = data.voice;
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

  /**
   * Edits the category of this channel. Only applicable to server channels.
   * @param category The ID of the category to move this channel into, or "default" to remove from any category.
   * @returns The updated TextChannel with the new category.
   * @throws {Error} If the channel is not a server channel, if the category is not found in the server, or if the API request fails.
   * @example
   * // Move this channel into a category
   * await channel.setCategory("CATEGORY_ID");
   * // Remove this channel from its category
   * await channel.setCategory("default");
   */
  public async setCategory(category: string): Promise<TextChannel> {
    const serverId = this.serverId as string;
    const server = await this.client.servers.fetch(serverId);

    const categories = server.categories.map((c) => ({
      id: c.id,
      title: c.title,
      channels: [...c.channels],
    }));

    for (const cat of categories) {
      cat.channels = cat.channels.filter((id) => id !== this.id);
    }

    if (category !== "default") {
      const targetCategory = categories.find((c) => c.id === category);
      if (!targetCategory) {
        throw new Error(`Category ${category} not found in server.`);
      }
      targetCategory.channels.push(this.id);
    }

    await this.client.servers.edit(serverId, { categories });

    return this;
  }

  /**
   * Sets the position of this channel within its current category.
   * @param position The new index position for the channel within its category.
   * @returns The updated TextChannel.
   * @throws {Error} If the channel is not in a category, or if the API request fails.
   * @example
   * // Move channel to the top of its category
   * await channel.setPosition(0);
   */
  public async setPosition(position: number): Promise<TextChannel> {
    const serverId = this.serverId as string;
    const server = await this.client.servers.fetch(serverId);

    const categories = server.categories.map((c) => ({
      id: c.id,
      title: c.title,
      channels: [...c.channels],
    }));

    const currentCategory = categories.find((c) => c.channels.includes(this.id));

    if (!currentCategory) {
      throw new Error("This channel is not currently inside any category.");
    }

    currentCategory.channels = currentCategory.channels.filter((id) => id !== this.id);

    const safePosition = Math.max(0, Math.min(position, currentCategory.channels.length));
    currentCategory.channels.splice(safePosition, 0, this.id);

    await this.client.servers.edit(serverId, { categories });

    return this;
  }

  /**
   * Edit the description of this channel
   * @param description
   * @throws {Error} If the API request fails
   * @returns The updated TextChannel
   * @example
   * // Set the channel description
   * await channel.setDescription("This is a channel about cats!");
   * // Remove the channel description
   * await channel.setDescription(null);
   */
  public async setDescription(description: string | null): Promise<TextChannel> {
    await this.edit({ description });
    return this;
  }

  /**
   * Edit the name of this channel
   * @param name
   * @throws {Error} If the API request fails
   * @returns The updated TextChannel
   * @example
   * await channel.setName("New Name");
   */
  public async setName(name: string): Promise<TextChannel> {
    await this.edit({ name });
    return this;
  }

  /**
   * Set whether this channel is NSFW
   * @param nsfw
   * @throws {Error} If the API request fails
   * @returns The updated TextChannel
   * @example
   * // Mark the channel as NSFW
   * await channel.setNSFW(true);
   * // Mark the channel as SFW
   * await channel.setNSFW(false);
   */
  public async setNSFW(nsfw: boolean): Promise<TextChannel> {
    await this.edit({ nsfw });
    return this;
  }

  /**
   * Set the channel slowmode in seconds
   * @param slowmode
   * @throws {Error} If the API request fails
   * @returns The updated TextChannel
   * @example
   * // Set the slowmode to 5 seconds
   * await channel.setSlowmode(5);
   * // Remove slowmode
   * await channel.setSlowmode(0);
   */
  public async setSlowmode(slowmode: number): Promise<TextChannel> {
    await this.edit({ slowmode });
    return this;
  }

  /**
   * Set the channel Icon
   * @param id Autumn ID to use
   * @throws {Error} If the API request fails
   * @returns The updated TextChannel
   * @example
   * await channel.setIcon("123");
    * // Remove the channel icon
    * await channel.setIcon(null);
   */
  public async setIcon(id: string | null): Promise<TextChannel> {
    await this.edit({ icon: id });
    return this;
  }
}
