import { Base } from "./Base";
import type { Client } from "../client/Client";
import type { TextChannel } from "./TextChannel";
import { MessageManager } from "../managers/MessageManager";
import { sendMessage } from "../utils/messageSender";
import { Message, MessageOptions } from "./Message";

export enum ChannelType {
  TEXT = "TextChannel",
  DM = "DirectMessage",
}

export abstract class BaseChannel extends Base {
  public type: ChannelType;
  public messages: MessageManager;

  protected constructor(client: Client, data: any) {
    super(client, data);
    this.type = data.channel_type;

    this.messages = new MessageManager(this.client, this);
  }

  public async send(data: string | MessageOptions): Promise<Message> {
    return sendMessage(this.client, this.id, data);
  }

  public isText(): this is TextChannel {
    return this.type === ChannelType.TEXT;
  }
}
