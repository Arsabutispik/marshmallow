import { Collector, CollectorOptions } from "./Collector";
import { Message } from "../structures/Message";

export interface ReactionCollectorOptions extends CollectorOptions<{
  emojiId: string;
  userId: string;
  message: Message | { id: string; channelId: string };
}> {
  /** The maximum number of reactions to collect */
  max?: number;
}

export class ReactionCollector extends Collector<
  string,
  { emojiId: string; userId: string; message: Message | { id: string; channelId: string } }
> {
  public messageId: string;
  public total = 0;

  constructor(
    public message: Message,
    options: ReactionCollectorOptions = {},
  ) {
    super((message as any).client, options);
    this.messageId = message.id;

    const boundHandleCollect = this.handleMessageReact.bind(this);
    const boundHandleDispose = this.handleMessageUnreact.bind(this);

    this.client.on("messageReact", boundHandleCollect);
    this.client.on("messageUnreact", boundHandleDispose);

    this.once("end", () => {
      this.client.removeListener("messageReact", boundHandleCollect);
      this.client.removeListener("messageUnreact", boundHandleDispose);
    });
  }

  public collect(reaction: {
    emojiId: string;
    userId: string;
    message: Message | { id: string; channelId: string };
  }): string | null {
    if (reaction.message.id !== this.messageId) return null;
    return `${reaction.emojiId}-${reaction.userId}`; // Use a composite key, or just generate a unique one
  }

  public dispose(reaction: {
    emojiId: string;
    userId: string;
    message: Message | { id: string; channelId: string };
  }): string | null {
    if (reaction.message.id !== this.messageId) return null;
    return `${reaction.emojiId}-${reaction.userId}`;
  }

  private handleMessageReact(message: Message | { id: string; channelId: string }, emojiId: string, userId: string) {
    if (message.id !== this.messageId) return;
    const item = { emojiId, userId, message };
    super.handleCollect(item);
    if (!this.ended && this.collected.has(this.collect(item) as string)) {
      this.total++;
      this.checkEnd();
    }
  }

  private handleMessageUnreact(message: Message | { id: string; channelId: string }, emojiId: string, userId: string) {
    if (message.id !== this.messageId) return;
    super.handleDispose({ emojiId, userId, message });
  }

  public override endReason(): string | null {
    const options = this.options as ReactionCollectorOptions;
    if (options.max && this.total >= options.max) return "limit";
    return null;
  }
}
