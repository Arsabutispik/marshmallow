import { EventEmitter } from "events";
import { Client } from "../client/Client";
import { Collection } from "./Collection";

/**
 * Options to be passed to a Collector
 */
export interface CollectorOptions<V> {
  /** The filter applied to this collector */
  filter?: (item: V, ...args: any[]) => boolean;
  /** How long to run the collector for in milliseconds */
  time?: number;
  /** How long to stop the collector after inactivity in milliseconds */
  idle?: number;
  /** Whether to dispose data when it's deleted */
  dispose?: boolean;
}

/**
 * Abstract class for defining a new Collector
 */
export abstract class Collector<K, V> extends EventEmitter {
  public readonly client: Client;
  public filter: (item: V, ...args: any[]) => boolean;
  public options: CollectorOptions<V>;
  public collected: Collection<K, V>;
  public ended: boolean = false;

  private _timeout: NodeJS.Timeout | null = null;
  private _idletimeout: NodeJS.Timeout | null = null;

  protected constructor(client: Client, options: CollectorOptions<V> = {}) {
    super();
    this.client = client;
    this.options = options;
    this.filter = options.filter ?? (() => true);
    this.collected = new Collection();

    if (options.time) {
      this._timeout = setTimeout(() => this.stop("time"), options.time);
    }
    if (options.idle) {
      this._idletimeout = setTimeout(() => this.stop("idle"), options.idle);
    }
  }

  /**
   * Evaluates an item and possibly passes it to the collector
   */
  public handleCollect(item: V, ...args: any[]) {
    if (this.ended) return;
    if (!this.filter(item, ...args)) return;

    const key = this.collect(item, ...args);
    if (key !== null && key !== undefined) {
      this.collected.set(key, item);
      this.emit("collect", item, ...args);

      if (this._idletimeout) {
        clearTimeout(this._idletimeout);
        this._idletimeout = setTimeout(() => this.stop("idle"), this.options.idle);
      }

      this.checkEnd();
    }
  }

  /**
   * Evaluates an item and possibly removes it from the collector
   */
  public handleDispose(item: V, ...args: any[]) {
    if (this.ended) return;
    if (!this.options.dispose) return;

    const key = this.dispose(item, ...args);
    if (key !== null && key !== undefined) {
      this.collected.delete(key);
      this.emit("dispose", item, ...args);
      this.checkEnd();
    }
  }

  /**
   * Stops the collector.
   */
  public stop(reason: string = "user") {
    if (this.ended) return;
    this.ended = true;

    if (this._timeout) clearTimeout(this._timeout);
    if (this._idletimeout) clearTimeout(this._idletimeout);

    this.removeAllListeners("collect");
    this.removeAllListeners("dispose");

    this.emit("end", this.collected, reason);
  }

  /**
   * Check if we should end upon collecting/disposing
   */
  public checkEnd() {
    const reason = this.endReason();
    if (reason) this.stop(reason);
  }

  /**
   * Check if there's a reason to end
   */
  public endReason(): string | null {
    return null;
  }

  /**
   * Returns a key if the item should be collected, or null to skip
   */
  public abstract collect(item: V, ...args: any[]): K | null;

  /**
   * Returns a key if the item should be disposed, or null to skip
   */
  public abstract dispose(item: V, ...args: any[]): K | null;

  /**
   * Allows iterating over collected items asynchronously.
   * @example
   * for await (const [id, message] of collector) {
   *   console.log(`Received message: ${message.content}`);
   * }
   */
  public async *[Symbol.asyncIterator](): AsyncIterableIterator<[K, V]> {
    const queue: [K, V][] = [];
    let resolve: (() => void) | null = null;

    const onCollect = (item: V, ...args: any[]) => {
      const key = this.collect(item, ...args);
      if (key !== null && key !== undefined) {
        queue.push([key, item]);
      }
      if (resolve) {
        resolve();
        resolve = null;
      }
    };

    const onEnd = () => {
      if (resolve) {
        resolve();
        resolve = null;
      }
    };

    this.on("collect", onCollect as any);
    this.on("end", onEnd as any);

    try {
      while (true) {
        if (queue.length > 0) {
          yield queue.shift() as [K, V];
        } else if (this.ended) {
          break;
        } else {
          await new Promise<void>((res) => {
            resolve = res;
          });
        }
      }
    } finally {
      this.removeListener("collect", onCollect as any);
      this.removeListener("end", onEnd as any);
    }
  }
}
