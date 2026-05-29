import { Message } from "./Message";
import { Emoji } from "./Emoji";
import { Collection } from "../utils/Collection";
import { Client } from "../client/Client";
import { User } from "./User";
import * as util from "node:util";

export class MessageReaction {
  public message: Message | { id: string; channelId: string };
  public emoji: Emoji | string;
  public users: Collection<string, User | { id: string }>;

  constructor(
    public client: Client,
    data: { message: Message | { id: string; channelId: string }; emojiId: string; users?: string[] },
  ) {
    this.message = data.message;
    // Attempt to resolve custom emojis from the cache, otherwise fallback to the string (e.g. for unicode)
    this.emoji = this.client.emojis.cache.get(data.emojiId) || data.emojiId;
    this.users = new Collection();

    if (data.users) {
      for (const userId of data.users) {
        const user = this.client.users.cache.get(userId) || { id: userId };
        this.users.set(userId, user as User);
      }
    }
  }

  public get count(): number {
    return this.users.size;
  }

  public async remove(): Promise<void> {
    if (this.message instanceof Message) {
      const emojiId = typeof this.emoji === "string" ? this.emoji : this.emoji.id;
      await this.message.removeReaction(emojiId);
    }
  }

  [util.inspect.custom]() {
    const data = {
      messageId: this.message.id,
      emoji: this.emoji,
      count: this.count,
      users: Array.from(this.users.keys()),
    };
    return `MessageReaction ${util.inspect(data)}`;
  }
}
