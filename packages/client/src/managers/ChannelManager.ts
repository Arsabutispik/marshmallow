import { BaseChannel } from "../structures/BaseChannel";
import { createChannel } from "../utils/ChannelFactory";
import type { Client } from "../client/Client";
import { Collection } from "../utils/Collection";

export class ChannelManager {
  public cache: Collection<string, BaseChannel> = new Collection();

  constructor(private client: Client) {}

  /**
   * Transforms raw data into a Channel object and saves it to the cache.
   */
  public _add(data: any): BaseChannel {
    const channel = createChannel(this.client, data);
    this.cache.set(channel.id, channel);
    return channel;
  }

  /**
   * Allows the user to fetch a channel from the API if it isn't cached
   */
  public async fetch(id: string): Promise<BaseChannel> {
    if (this.cache.has(id)) return this.cache.get(id)!;

    const data = await this.client.rest.get(`/channels/${id}`);
    
    return this._add(data);
  }

  /**
   * Return a channel from cache, if it exists
   */
  public get(id: string): BaseChannel | undefined {
    return this.cache.get(id);
  }
}
