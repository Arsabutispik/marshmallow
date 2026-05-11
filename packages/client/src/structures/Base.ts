import { Client } from "../client/Client";

/**
 * The base class for all structures.
 */
export abstract class Base {
  public readonly id: string;

  protected readonly client: Client;

  constructor(client: Client, data: { _id: string }) {
    this.id = data._id;
    this.client = client;

    Object.defineProperty(this, "client", {
      value: client,
      enumerable: false,
      writable: false,
    });
  }

  /**
   * Compares this object with another to see if they represent the same entity.
   */
  public equals(other: Base | string): boolean {
    if (typeof other === "string") return this.id === other;
    return other instanceof Base && this.id === other.id;
  }

  /**
   * Returns the UUID string when the object is cast to a string.
   */
  public toString(): string {
    return this.id;
  }

  /**
   * Helper to quickly clone a structure
   */
  public _clone(): this {
    return Object.assign(Object.create(this), this);
  }
}
