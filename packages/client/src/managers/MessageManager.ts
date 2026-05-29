import { Collection } from "../utils/Collection";
import type { BaseChannel } from "../structures/BaseChannel";
import { Message, MessageOptions } from "../structures/Message";
import type { Client } from "../client/Client";
import * as util from "node:util";
import { BaseManager } from "./BaseManager";
import { UserResolvable } from "./UserManager";

export type MessageResolvable = Message | string;

export interface MessageFetchOptions {
  limit?: number;
  before?: string;
  after?: string;
  sort?: "Relevance" | "Latest" | "Oldest";
  nearby?: string;
  includeUsers?: boolean;
}

export class MessageManager extends BaseManager<string, Message> {
  constructor(
    client: Client,
    public channel: BaseChannel,
    limit: number = Infinity,
  ) {
    super(client, limit);
  }

  /**
   * Tell BaseManager how to find the ID for Messages
   */
  protected extractId(data: any): string {
    return data._id ?? data.id;
  }

  /**
   * Tell BaseManager how to build a Message
   */
  protected construct(data: any): Message {
    return new Message(this.client, data);
  }

  public async fetch(id: string): Promise<Message> {
    const data = await this.client.rest.get(`/channels/${this.channel.id}/messages/${id}`);
    return this._add(data);
  }

  /**
   * Fetches multiple messages from the channel using specific filter parameters.
   * @param options The query parameters to filter the fetched messages.
   * @returns A promise that resolves to a Collection of fetched Messages.
   * @throws {Error} If the API request fails.
   * @example
   * // Fetch the last 50 messages in the channel
   * const messages = await channel.messages.fetchMany({ limit: 50, sort: "Latest" });
   *
   * // Fetch 20 messages before a specific message ID
   * const history = await channel.messages.fetchMany({ limit: 20, before: "01H..." });
   */
  public async fetchMany(options: MessageFetchOptions = {}): Promise<Collection<string, Message>> {
    const params = new URLSearchParams();

    if (options.limit !== undefined) params.append("limit", options.limit.toString());
    if (options.before !== undefined) params.append("before", options.before);
    if (options.after !== undefined) params.append("after", options.after);
    if (options.sort !== undefined) params.append("sort", options.sort);
    if (options.nearby !== undefined) params.append("nearby", options.nearby);
    if (options.includeUsers !== undefined) params.append("include_users", options.includeUsers.toString());

    const queryString = params.toString();
    const endpoint = `/channels/${this.channel.id}/messages${queryString ? `?${queryString}` : ""}`;

    const data = await this.client.rest.get(endpoint);

    const rawMessages = Array.isArray(data) ? data : data.messages || [];

    if (!Array.isArray(data) && data.users) {
      for (const userData of data.users) {
        this.client.users._add(userData);
      }
    }

    const fetched = new Collection<string, Message>();

    for (const rawMsg of rawMessages) {
      const msg = this._add(rawMsg);
      fetched.set(msg.id, msg);
    }

    return fetched;
  }

  public resolveId(message: MessageResolvable): string {
    if (typeof message === "string") return message;
    if (message instanceof Message) return message.id;
    throw new Error("Invalid MessageResolvable: must be a Message object or a string ID.");
  }

  /**
   * Sends a new message to this channel.
   * @param contentOrOptions The string content or message options payload.
   * @returns A promise that resolves to the sent Message.
   */
  public async send(contentOrOptions: MessageOptions | string): Promise<Message> {
    const payload: any = typeof contentOrOptions === "string" ? { content: contentOrOptions } : { ...contentOrOptions }; // Spread to avoid mutating the user's original object

    if (payload.embeds) {
      payload.embeds = payload.embeds.map((embed: any) =>
        typeof embed.toJSON === "function" ? embed.toJSON() : embed,
      );
    }

    const data = await this.client.rest.post(`/channels/${this.channel.id}/messages`, payload);

    return new Message(this.client, data);
  }

  /**
   * Edits an existing message.
   * @param message The MessageResolvable (object or ID) to edit.
   * @param contentOrOptions The new content or options.
   * @returns A promise that resolves to the updated Message.
   */
  public async edit(message: MessageResolvable, contentOrOptions: string | MessageOptions): Promise<Message> {
    const id = this.resolveId(message);
    const payload: MessageOptions =
      typeof contentOrOptions === "string" ? { content: contentOrOptions } : { ...contentOrOptions };

    if (payload.embeds) {
      payload.embeds = payload.embeds.map((embed: any) =>
        typeof embed.toJSON === "function" ? embed.toJSON() : embed,
      );
    }

    const data = await this.client.rest.patch(`/channels/${this.channel.id}/messages/${id}`, payload);
    const existing = this.cache.get(id);
    if (existing) {
      existing._patch(data);
      return existing;
    }

    return new Message(this.client, data);
  }

  /**
   * Deletes a message from the channel.
   * @param message The MessageResolvable to delete.
   */
  public async delete(message: MessageResolvable): Promise<void> {
    const id = this.resolveId(message);
    await this.client.rest.delete(`/channels/${this.channel.id}/messages/${id}`);
    this.cache.delete(id);
  }

  /**
   * Pins a message in the channel.
   * @param message The MessageResolvable to pin.
   */
  public async pin(message: MessageResolvable): Promise<void> {
    const id = this.resolveId(message);
    await this.client.rest.post(`/channels/${this.channel.id}/messages/${id}/pin`, {});

    const existing = this.cache.get(id);
    if (existing) existing.pinned = true;
  }

  /**
   * Unpins a message in the channel.
   * @param message The MessageResolvable to unpin.
   */
  public async unpin(message: MessageResolvable): Promise<void> {
    const id = this.resolveId(message);
    await this.client.rest.delete(`/channels/${this.channel.id}/messages/${id}/pin`);

    const existing = this.cache.get(id);
    if (existing) existing.pinned = false;
  }

  /**
   * React to a message
   * @param message The MessageResolvable to react to.
   * @param reaction The emoji to react with. Can be a Unicode emoji or a custom emoji ID.
   * @throws {Error} If the API request fails.
   * @example
   * await channel.messages.react(messageId, "👍");
   * await channel.messages.react(messageId, "customEmojiId");
   */
  public async react(message: MessageResolvable, reaction: string): Promise<void> {
    const id = this.resolveId(message);
    await this.client.rest.put(`/channels/${this.channel.id}/messages/${id}/reactions/${encodeURIComponent(reaction)}`);
  }

  /**
   * Remove a reaction(s) from a message
   * Requires ManageMessages if changing others' reactions.
   * @param reaction The emoji to remove. Can be a unicode emoji or a custom emoji ID.
   * @param message The MessageResolvable to remove the reaction from.
   * @param userId The ID of the user whose reaction to remove. If not provided, removes the current user's reaction.
   * @param removeAll Remove all reactions of this type.
   * @throws {Error} If both userId and removeAll are provided, or if the API request fails.
   * @example
   * // Remove the current user's reaction
   * await channel.messages.removeReaction(messageId, "👍");
   * // Remove a specific user's reaction
   * await channel.messages.removeReaction(messageId, "👍", userId);
   * // Remove all reactions of this type
   * await channel.messages.removeReaction(messageId, "👍", undefined, true);
   */
  public async removeReaction(
    message: MessageResolvable,
    reaction: string,
    userId?: UserResolvable,
    removeAll?: boolean,
  ): Promise<void> {
    const id = this.resolveId(message);
    const targetUser = userId ? this.client.users.resolveId(userId) : undefined;

    const params = new URLSearchParams();
    if (targetUser) params.append("user_id", targetUser);
    if (removeAll) params.append("remove_all", "true");

    const queryString = params.toString();
    const endpoint = `/channels/${this.channel.id}/messages/${id}/reactions/${encodeURIComponent(reaction)}${queryString ? `?${queryString}` : ""}`;

    await this.client.rest.delete(endpoint);
  }

  /**
   * Remove all reactions from a message
   * Requires ManageMessages permission.
   * @param message The MessageResolvable to clear reactions from.
   * @throws {Error} If the API request fails.
   * @example
   * await channel.messages.clearReactions(messageId);
   */
  public async clearReactions(message: MessageResolvable): Promise<void> {
    const id = this.resolveId(message);
    await this.client.rest.delete(`/channels/${this.channel.id}/messages/${id}/reactions`);
  }

  [util.inspect.custom]() {
    return this.cache;
  }
}
