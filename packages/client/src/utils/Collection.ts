/**
 * A utility class that extends the native JavaScript Map with Array-like methods.
 */
export class Collection<K, V> extends Map<K, V> {
  public limit: number;

  constructor(limit: number = Infinity) {
    super();
    this.limit = limit;
  }

  /**
   * Overrides the default set method to enforce the maximum cache size.
   */
  public override set(key: K, value: V): this {
    if (this.limit === 0) return this;

    if (this.size >= this.limit && !this.has(key)) {
      const oldestKey = this.keys().next().value;
      if (oldestKey !== undefined) {
        this.delete(oldestKey);
      }
    }

    return super.set(key, value);
  }

  /**
   * Finds the first item where the given function returns true.
   */
  public find(fn: (value: V, key: K, collection: this) => boolean): V | undefined {
    for (const [key, val] of this) {
      if (fn(val, key, this)) return val;
    }
    return undefined;
  }

  /**
   * Returns a new Collection containing only the items where the function returns true.
   */
  public filter(fn: (value: V, key: K, collection: this) => boolean): Collection<K, V> {
    const results = new Collection<K, V>();
    for (const [key, val] of this) {
      if (fn(val, key, this)) results.set(key, val);
    }
    return results;
  }

  /**
   * Maps each item to a new array of values.
   */
  public map<T>(fn: (value: V, key: K, collection: this) => T): T[] {
    const results: T[] = [];
    for (const [key, val] of this) {
      results.push(fn(val, key, this));
    }
    return results;
  }

  /**
   * Gets the very first value in the Collection (based on insertion order).
   */
  public first(): V | undefined {
    return this.values().next().value;
  }

  /**
   * Gets the very last value in the Collection.
   */
  public last(): V | undefined {
    const arr = Array.from(this.values());
    return arr[arr.length - 1];
  }

  /**
   * Checks if at least one item matches the condition.
   */
  public some(fn: (value: V, key: K, collection: this) => boolean): boolean {
    for (const [key, val] of this) {
      if (fn(val, key, this)) return true;
    }
    return false;
  }
}
