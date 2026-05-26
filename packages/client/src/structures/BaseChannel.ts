import { Base } from "./Base";
import type { Client } from "../client/Client";
import type { TextChannel } from "./TextChannel";
import { MessageFetchOptions, MessageManager, MessageResolvable } from "../managers/MessageManager";
import { Message, MessageOptions } from "./Message";
import { DMChannel } from "./DMChannel";
import { GroupChannel } from "./GroupChannel";
import { ChannelEditOptions } from "../managers/ChannelManager";
import { Collection } from "../utils/Collection";

export enum ChannelType {
  TEXT = "TextChannel",
  DM = "DirectMessage",
  GROUP = "Group",
}

export interface ChannelCreateOptions {
  name: string;
  type: "Text" | "Voice";
  description?: string;
  nsfw?: boolean;
  voice?: {
    max_users?: number;
  };
}

export abstract class BaseChannel extends Base {
  public type: ChannelType;
  public messages: MessageManager;

  protected constructor(client: Client, data: any) {
    super(client, data);
    this.type = data.channel_type;

    this.messages = new MessageManager(this.client, this);
  }

  /**
   * Sends a message to this channel.
   * @param contentOrOptions The string content or message options payload.
   * @returns A promise that resolves to the sent Message.
   * @example
   * await channel.send("Hello world!");
   * await channel.send({ content: "Here is an embed", embeds: [myEmbed] });
   */
  public async send(contentOrOptions: string | MessageOptions): Promise<Message> {
    return this.messages.send(contentOrOptions);
  }

  /**
   * Fetch this channel
   * @param force Whether to skip the cache check and force a direct API request. Defaults to false
   * @throws {Error} If the API request fails
   * @returns {BaseChannel}
   * @example
   * // Force fetch channel to update its data
   * await channel.fetch(true);
   */
  public async fetch(force: boolean = false): Promise<BaseChannel> {
    return await this.client.channels.fetch(this.id, force);
  }

  /**
   * Fetches multiple messages from this channel.
   * @param options The query parameters to filter the messages.
   * @throws {Error} If the API request fails
   * @returns A Collection of Messages, keyed by their ID.
   * @example
   * // Fetch the last 50 messages in the channel
   * const messages = await channel.fetchMessages({ limit: 50 });
   * console.log(`Fetched ${messages.size} messages`);
   * // Fetch messages before a specific message ID
   * const messages = await channel.fetchMessages({ before: "MESSAGE_ID" });
   * console.log(`Fetched ${messages.size} messages sent before the specified message`);
   * // Fetch messages after a specific message ID
   * const messages = await channel.fetchMessages({ after: "MESSAGE_ID" });
   * console.log(`Fetched ${messages.size} messages sent after the specified message`);
   * // Fetch messages around a specific message ID
   * const messages = await channel.fetchMessages({ around: "MESSAGE_ID", limit: 10 });
   * console.log(`Fetched ${messages.size} messages sent around the specified message`);
   */
  public async fetchMessages(options?: MessageFetchOptions): Promise<Collection<string, Message>> {
    return this.messages.fetchMany(options);
  }

  /**
   * Edits this channel.
   * @param options The fields to update
   * @throws {Error} If the API request fails
   * @returns BaseChannel
   * @example
   * // Edit the channel's name
   * await channel.edit({name: "New Cool Name"});
   */
  public async edit(options: ChannelEditOptions): Promise<BaseChannel> {
    return await this.client.channels.edit(this.id, options);
  }

  /**
   * Deletes this channel.
   * @throws {Error} If the API request fails
   * @example
   * // Delete the channel
   * await channel.delete();
   */
  public async delete(): Promise<void> {
    await this.client.channels.delete(this.id);
  }

  /**
   * Bulk delete messages from this channel
   * @param messages MessageResolvable to delete
   * @throws {Error} If the API request fails
   * @example
   * // Delete messages by their ID's
   * await channel.bulkDelete(["MESSAGE_ID_1", "MESSAGE_ID_2", "MESSAGE_ID_3"]);
   * // Delete messages by their Message objects
   * await channel.bulkDelete([message1, message2, message3]);
   */
  public async bulkDelete(messages: MessageResolvable[]): Promise<void> {
    await this.client.channels.bulkDelete(this.id, messages);
  }

  public isText(): this is TextChannel {
    return this.type === ChannelType.TEXT;
  }

  public isDM(): this is DMChannel {
    return this.type === ChannelType.DM;
  }

  public isGroup(): this is GroupChannel {
    return this.type === ChannelType.GROUP;
  }
}
