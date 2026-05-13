import { User, UserProfile, UserStatus } from "../structures/User";
import type { Client } from "../client/Client";
import { BaseManager } from "./BaseManager";

export type UserResolvable = User | string;

export interface UserEditOptions {
  avatar?: string | null;
  displayName?: string | null;
  profile?: UserProfile;
  status?: UserStatus;
}

export class UserManager extends BaseManager<string, User> {
  constructor(client: Client, limit: number = Infinity) {
    super(client, limit);
  }

  /**
   * Tell BaseManager how to find the ID for Users
   */
  protected extractId(data: any): string {
    return data._id ?? data.id;
  }

  /**
   * Tell BaseManager how to build a User
   */
  protected construct(data: any): User {
    return new User(this.client, data);
  }

  /**
   * Resolves a UserResolvable to a User object from the cache.
   */
  public resolve(user: UserResolvable): User | undefined {
    if (user instanceof User) return user;

    if (typeof user === "string") {
      const id = user.replace(/[<@>]/g, "");
      return this.cache.get(id);
    }

    return undefined;
  }

  /**
   * Extracts ID from a UserResolvable.
   * @param user The UserResolvable to extract the ID from.
   * @returns The extracted user ID.
   * @throws TypeError if an invalid type is provided.
   */
  public resolveId(user: UserResolvable): string {
    if (user instanceof User) {
      return user.id;
    }

    if (typeof user === "string") {
      return user.replace(/[<@>]/g, "");
    }

    throw new TypeError("Invalid UserResolvable provided. Expected a User object or a string ID/Mention.");
  }

  /**
   * Fetches a User.
   * @param user The ID or mention to fetch
   * @param force Skip the cache check and force an API request
   * @returns The fetched User object
   * @throws Error if the user cannot be found or fetched
   * @throws TypeError if invalid UserResolvable is provided
   * @example
   * // Fetch a user by ID
   * const user = await client.users.fetch("01JE2MM759J5D7CHJF084R7MJ2");
   * console.log(user.username);
   *
   * // Fetch a user by mention
   * const user = await client.users.fetch("<@01JE2MM759J5D7CHJF084R7MJ2>");
   * console.log(user.username);
   *
   * // Force fetch a user, bypassing the cache
   * const user = await client.users.fetch("01JE2MM759J5D7CHJF084R7MJ2", true);
   * console.log(user.username);
   */
  public async fetch(user: UserResolvable, force: boolean = false): Promise<User> {
    if (!force) {
      const cached = this.resolve(user);
      if (cached) return cached;
    }

    const id = this.resolveId(user);

    const data = await this.client.rest.get(`/users/${id}`);

    return this._add(data);
  }

  /**
   * Fetch the current user (the bot itself).
   * @returns The fetched User object representing the current user.
   * @throws Error if the user cannot be fetched.
   * @example
   * // Fetch the current user (the bot itself)
   * const me = await client.users.fetchMe();
   * console.log(`Logged in as ${me.tag}`);
   */
  public async fetchMe() {
    const data = await this.client.rest.get(`/users/@me`);

    return this._add(data);
  }

  /**
   * Edits the currently authenticated user (the bot itself).
   * @param options The fields to update (avatar, status, profile, etc.).
   * @returns A promise that resolves to the updated User object.
   * @throws {TypeError} If invalid options are provided.
   * @throws {Error} If the API request fails.
   * @example
   * // Update the bot's status and presence
   * await client.users.editMe({
   *   status: { text: "Watching the server", presence: "Online" }
   * });
   *
   * // Clear the bot's avatar and display name
   * await client.users.editMe({ avatar: null, displayName: null });
   */
  public async editMe(options: UserEditOptions): Promise<User> {
    if (!options || typeof options !== "object") {
      throw new TypeError("UserEditOptions must be a valid object.");
    }

    const payload: any = {};
    const remove: string[] = [];

    if (options.displayName !== undefined) {
      if (options.displayName === null) remove.push("DisplayName");
      else payload.display_name = options.displayName;
    }

    if (options.avatar !== undefined) {
      if (options.avatar === null) remove.push("Avatar");
      else payload.avatar = options.avatar;
    }

    if (options.profile !== undefined) {
      payload.profile = {};
      if (options.profile.content !== undefined) {
        if (options.profile.content === null) remove.push("ProfileContent");
        else payload.profile.content = options.profile.content;
      }
      if (options.profile.background !== undefined) {
        if (options.profile.background === null) remove.push("ProfileBackground");
        else payload.profile.background = options.profile.background;
      }
      if (Object.keys(payload.profile).length === 0) delete payload.profile;
    }

    if (options.status !== undefined) {
      payload.status = {};
      if (options.status.text !== undefined) {
        if (options.status.text === null) remove.push("StatusText");
        else payload.status.text = options.status.text;
      }
      if (options.status.presence !== undefined) {
        if (options.status.presence === null) remove.push("StatusPresence");
        else payload.status.presence = options.status.presence;
      }
      if (Object.keys(payload.status).length === 0) delete payload.status;
    }

    if (remove.length > 0) {
      payload.remove = remove;
    }

    if (Object.keys(payload).length === 0) {
      return this.fetch("@me");
    }

    const data = await this.client.rest.patch(`/users/@me`, payload);

    return this._add(data);
  }
}
