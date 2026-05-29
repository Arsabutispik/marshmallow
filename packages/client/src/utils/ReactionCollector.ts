import { Collector, CollectorOptions } from "./Collector";
import { Message } from "../structures/Message";
import { MessageReaction } from "../structures/MessageReaction";

export interface ReactionCollectorOptions extends CollectorOptions<MessageReaction> {
  /** The maximum number of reactions to collect */
  max?: number;
  /** The maximum number of users to collect reactions from */
  maxUsers?: number;
}

export class ReactionCollector extends Collector<string, MessageReaction> {
  public messageId: string;
  public total = 0;
  public users = new Set<string>();

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

  public collect(reaction: MessageReaction): string | null {
    if (reaction.message.id !== this.messageId) return null;
    return typeof reaction.emoji === "string" ? reaction.emoji : reaction.emoji.id;
  }

  public dispose(reaction: MessageReaction): string | null {
    if (reaction.message.id !== this.messageId) return null;
    return typeof reaction.emoji === "string" ? reaction.emoji : reaction.emoji.id;
  }

  private handleMessageReact(message: Message | { id: string; channelId: string }, emojiId: string, userId: string) {
    if (message.id !== this.messageId) return;

    // Check if we already have this reaction in the collector
    let reaction = this.collected.get(emojiId);

    if (!reaction) {
      reaction = new MessageReaction(this.client as any, { message, emojiId, users: [userId] });
    } else {
      const user = this.client.users.cache.get(userId) || { id: userId };
      reaction.users.set(userId, user as any);
    }

    super.handleCollect(reaction);

    if (!this.ended && this.collected.has(emojiId)) {
      this.total++;
      this.users.add(userId);
      this.checkEnd();
    }
  }

  private handleMessageUnreact(message: Message | { id: string; channelId: string }, emojiId: string, userId: string) {
    if (message.id !== this.messageId) return;

    const reaction = this.collected.get(emojiId);
    if (reaction) {
      reaction.users.delete(userId);
      if (reaction.users.size === 0) {
        super.handleDispose(reaction);
      }
    }
  }

  public override endReason(): string | null {
    const options = this.options as ReactionCollectorOptions;
    if (options.max && this.total >= options.max) return "limit";
    if (options.maxUsers && this.users.size >= options.maxUsers) return "userLimit";
    return null;
  }
}
