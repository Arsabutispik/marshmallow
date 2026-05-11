// src/managers/SweeperManager.ts
import type { Client } from "../client/Client";
import type { TextChannel } from "../structures/TextChannel";

export interface SweeperOptions {
  messages?: {
    lifetime: number;
    interval: number;
  };
}

export class SweeperManager {
  private messageInterval: NodeJS.Timeout | null = null;

  constructor(
    private client: Client,
    private options: SweeperOptions,
  ) {}

  public start() {
    if (this.options.messages) {
      this.client.emit("debug", "Starting Message Cache Sweeper...");

      this.messageInterval = setInterval(() => {
        this.sweepMessages();
      }, this.options.messages.interval);
    }
  }

  private sweepMessages() {
    if (!this.options.messages) return;

    const now = Date.now();
    const lifetime = this.options.messages.lifetime;
    let sweptCount = 0;

    for (const channel of this.client.channels.cache.values()) {
      if (!("messages" in channel)) continue;

      const textChannel = channel as TextChannel;

      for (const [id, message] of textChannel.messages.cache.entries()) {
        if (now - message.cachedAt > lifetime) {
          textChannel.messages.cache.delete(id);
          sweptCount++;
        }
      }
    }

    if (sweptCount > 0) {
      this.client.emit("debug", `🧹 Sweeper cleared ${sweptCount} old messages from cache.`);
    }
  }

  public stop() {
    if (this.messageInterval) clearInterval(this.messageInterval);
    this.client.emit("debug", "Sweepers stopped.");
  }
}
