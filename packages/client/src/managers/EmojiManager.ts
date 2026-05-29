import { BaseManager } from "./BaseManager";
import type { Client } from "../client/Client";
import { Emoji } from "../structures/Emoji";
import type { Server } from "../structures/Server";
import * as util from "node:util";

export class EmojiManager extends BaseManager<string, Emoji> {
  constructor(
    client: Client,
    public server?: Server,
    limit: number = Infinity,
  ) {
    super(client, limit);
  }

  /**
   * Tell BaseManager how to find the ID for Emojis
   */
  protected extractId(data: any): string {
    return data._id ?? data.id;
  }

  /**
   * Tell BaseManager how to build an Emoji
   */
  protected construct(data: any): Emoji {
    return new Emoji(this.client, data);
  }

  public async fetch(id: string): Promise<Emoji> {
    const data = await this.client.rest.get(`/custom/emoji/${id}`);
    return this._add(data);
  }

  [util.inspect.custom]() {
    return this.cache;
  }
}
