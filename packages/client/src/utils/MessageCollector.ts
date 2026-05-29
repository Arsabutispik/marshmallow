import { Collector, CollectorOptions } from "./Collector";
import { Message } from "../structures/Message";
import { BaseChannel } from "../structures/BaseChannel";

/**
 * Options to be passed to a MessageCollector
 */
export interface MessageCollectorOptions extends CollectorOptions<Message> {
  /** The maximum number of messages to collect */
  max?: number;
  /** The maximum number of messages to process (both matching and non-matching the filter) */
  maxProcessed?: number;
}

/**
 * Collects messages on a channel.
 */
export class MessageCollector extends Collector<string, Message> {
  public channelId: string;
  public total = 0;
  public processed = 0;

  constructor(
    public channel: BaseChannel,
    options: MessageCollectorOptions = {},
  ) {
    super((channel as any).client, options);
    this.channelId = channel.id;

    const boundHandleCollect = this.handleCollect.bind(this);
    const boundHandleDispose = this.handleDispose.bind(this) as any;

    this.client.on("messageCreate", boundHandleCollect);
    this.client.on("messageDelete", boundHandleDispose);

    this.once("end", () => {
      this.client.removeListener("messageCreate", boundHandleCollect);
      this.client.removeListener("messageDelete", boundHandleDispose);
    });
  }

  public override collect(message: Message): string | null {
    if (message.channelId !== this.channelId) return null;
    return message.id;
  }

  public override dispose(message: Message | { id: string; channelId: string }): string | null {
    if (message.channelId !== this.channelId) return null;
    return message.id;
  }

  public override handleCollect(message: Message) {
    if (message.channelId !== this.channelId) return;
    this.processed++;
    super.handleCollect(message);
    if (!this.ended && this.collected.has(message.id)) {
      this.total++;
      this.checkEnd();
    }
  }

  public override endReason(): string | null {
    const options = this.options as MessageCollectorOptions;
    if (options.max && this.total >= options.max) return "limit";
    if (options.maxProcessed && this.processed >= options.maxProcessed) return "processedLimit";
    return null;
  }
}
