import { Base } from "./Base";
import type { Client } from "../client/Client";
import type { TextChannel } from "./TextChannel";
import { MessageFetchOptions, MessageManager } from "../managers/MessageManager";
import { Message, MessageOptions } from "./Message";
import { DMChannel } from "./DMChannel";
import { GroupChannel } from "./GroupChannel";
import { ChannelEditOptions } from "../managers/ChannelManager";

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

  public async fetch(force: boolean = true): Promise<this> {
    return (await this.client.channels.fetch(this.id, force)) as this;
  }

  /**
   * Fetches multiple messages from this channel.
   * @param options The query parameters to filter the messages.
   */
  public async fetchMessages(options?: MessageFetchOptions) {
    return this.messages.fetchMany(options);
  }

  /**
   * Edits this channel.
   * @param options The fields to update
   */
  public async edit(options: ChannelEditOptions): Promise<this> {
    return (await this.client.channels.edit(this.id, options)) as this;
  }

  /**
   * Deletes this channel.
   */
  public async delete(): Promise<void> {
    await this.client.channels.delete(this.id);
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
