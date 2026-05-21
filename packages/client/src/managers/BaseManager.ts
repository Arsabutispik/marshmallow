import { Collection } from "../utils/Collection";
import type { Client } from "../client/Client";

/**
 * @template K The type of the cache keys (usually string)
 * @template Holds The type of the Structure this manager holds
 */
export abstract class BaseManager<K, Holds> {
  public cache: Collection<K, Holds>;
  protected readonly client: Client;

  protected constructor(
    client: Client,
    limit: number = Infinity,
  ) {
    this.client = client;
    this.cache = new Collection<K, Holds>(limit);

    Object.defineProperty(this, "client", {
      value: client,
      enumerable: false,
      writable: false,
    });
  }

  /**
   * Defines how to extract the unique ID from a raw API payload.
   * @internal
   */
  protected abstract extractId(data: any): K;

  /**
   * Defines how to construct a new instance of the Structure.
   * @internal
   */
  protected abstract construct(data: any): Holds;

  /**
   * Transforms raw data into a Structure, patches if existing, and saves to cache.
   * @internal
   */
  public _add(data: any): Holds {
    const id = this.extractId(data);
    const existing = this.cache.get(id);

    if (existing && typeof (existing as any)._patch === "function") {
      (existing as any)._patch(data);
      return existing;
    }

    const structure = this.construct(data);
    this.cache.set(id, structure);

    return structure;
  }
}
