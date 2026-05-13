import { Collection } from "../utils/Collection";
import { User } from "../structures/User";
import type { Client } from "../client/Client";

export class UserManager {
  public cache: Collection<string, User>;

  constructor(private client: Client, limit: number = Infinity) {
    this.cache = new Collection<string, User>(limit);
  }

  /**
   * Transforms raw data into a User object and saves it to cache.
   */
  public _add(data: any): User {
    const user = new User(this.client, data);
    this.cache.set(user.id, user);
    return user;
  }

  /**
   * Fetches a user from the API if it isn't cached
   */
  public async fetch(id: string): Promise<User> {
    if (this.cache.has(id)) return this.cache.get(id)!;

    const data = await this.client.rest.get(`/users/${id}`);
    return this._add(data);
  }

  /**
   * Return a user from cache, if it exists
   */
  public get(id: string): User | undefined {
    return this.cache.get(id);
  }
}
