import { Base } from "./Base";
import type { Client } from "../client/Client";
import { Attachment } from "./Attachment";

export enum UserRelationship {
  None = "None",
  User = "User",
  Friend = "Friend",
  Outgoing = "Outgoing",
  Incoming = "Incoming",
  Blocked = "Blocked",
  BlockedOther = "BlockedOther",
}

export enum UserPresence {
  Online = "Online",
  Idle = "Idle",
  Focus = "Focus",
  Busy = "Busy",
  Invisible = "Invisible",
}

export interface BotInformation {
  owner: string;
}

export interface UserStatus {
  presence: UserPresence;
  text?: string | null;
}

export interface UserProfile {
  background?: string | null;
  content?: string | null;
}

export class User extends Base {
  public discriminator!: string;
  public online!: boolean;
  public relationship!: UserRelationship;
  public username!: string;
  public avatar?: Attachment | null;
  public badges?: number;
  public bot!: false | BotInformation;
  public displayName?: string | null;
  public flags?: number;
  public privileged?: boolean;
  public status?: UserStatus | null;

  constructor(client: Client, data: any) {
    super(client, data);
    this.bot = false;
    this.privileged = false;
    this.flags = 0;
    this._patch(data);
  }

  public _patch(data: any, clear?: string[]) {
    if (data.username !== undefined) this.username = data.username;
    if (data.discriminator !== undefined) this.discriminator = data.discriminator;
    if (data.online !== undefined) this.online = data.online;
    if (data.relationship !== undefined) this.relationship = data.relationship;

    if (data.display_name !== undefined) this.displayName = data.display_name;

    if (data.badges !== undefined) this.badges = data.badges;
    if (data.flags !== undefined) this.flags = data.flags;
    if (data.privileged !== undefined) this.privileged = data.privileged ?? false;
    if (data.status !== undefined) this.status = data.status;

    if (data.bot !== undefined) {
      this.bot = data.bot ? { owner: data.bot.owner } : false;
    }

    if (data.avatar !== undefined) {
      this.avatar = new Attachment(this.client, data.avatar);
    }

    // Handle deletions gracefully
    if (clear && Array.isArray(clear)) {
      for (const field of clear) {
        if (field === "Avatar") this.avatar = null;
        if (field === "StatusText" && this.status) this.status.text = null;
        if (field === "DisplayName") this.displayName = null;
      }
    }
  }

  /**
   * Convenience getter to return the user's tag (username#discriminator)
   */
  public get tag(): string {
    return `${this.username}#${this.discriminator}`;
  }

  /**
   * Fetch a User to update their information
   * @param force Skip the cache check and force an API request
   * @returns The fetched User object
   * @throws Error if the user cannot be found or fetched
   * @example
   * // Fetch a user
   * await user.fetch();
   */
  public async fetch(force: boolean = false): Promise<this> {
    return (await this.client.users.fetch(this.id, force)) as this;
  }
}
