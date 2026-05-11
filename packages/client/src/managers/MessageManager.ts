import { Collection } from "../utils/Collection";
import type { BaseChannel } from "../structures/BaseChannel";
import { Message } from "../structures/Message";
import type { Client } from "../client/Client";
import * as util from "node:util";

export class MessageManager {
  // 1. Explicitly public
  public cache: Collection<string, Message> = new Collection();

  constructor(
    private client: Client,
    private channel: BaseChannel,
  ) {}

  /**
   * Internal method to add or update a message in the cache
   */
  public _add(data: any): Message {
    const id = data._id ?? data.id;
    const existing = this.cache.get(id);

    if (existing) {
      existing._patch(data);
      return existing;
    }

    const message = new Message(this.client, data);
    this.cache.set(message.id, message);

    return message;
  }

  public async fetch(id: string): Promise<Message> {
    const data = await this.client.rest.get(`/channels/${this.channel.id}/messages/${id}`);
    return this._add(data);
  }

  [util.inspect.custom]() {
    return this.cache;
  }
}
