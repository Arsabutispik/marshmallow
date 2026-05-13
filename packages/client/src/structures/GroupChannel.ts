import { Client } from "../client/Client";
import { Attachment } from "./Attachment";
import { BaseChannel } from "./BaseChannel";
import type { User } from "./User";
import * as util from "node:util";

export class GroupChannel extends BaseChannel {
  public name!: string;
  public ownerId!: string;
  public recipients: string[] = [];
  public description?: string | null = null;
  public icon: Attachment | null = null;
  public lastMessageId?: string | null = null;
  public nsfw: boolean = false;

  constructor(client: Client, data: any) {
    super(client, data);
    this._patch(data);
  }

  public _patch(data: any, clear?: string[]) {
    if (data.name !== undefined) this.name = data.name;
    if (data.owner !== undefined) this.ownerId = data.owner;
    if (data.recipients !== undefined) this.recipients = data.recipients;
    if (data.description !== undefined) this.description = data.description;
    if (data.last_message_id !== undefined) this.lastMessageId = data.last_message_id;
    if (data.nsfw !== undefined) this.nsfw = data.nsfw;

    if (data.icon !== undefined) {
      this.icon = data.icon ? new Attachment(this.client, data.icon) : null;
    }

    if (clear && Array.isArray(clear)) {
      for (const field of clear) {
        switch (field) {
          case "Name":
            this.name = "";
            break;
          case "Description":
            this.description = null;
            break;
          case "Icon":
            this.icon = null;
            break;
        }
      }
    }
  }

  /** Gets the User object of the person who owns this group */
  public get owner(): User | undefined {
    return this.client.users.cache.get(this.ownerId);
  }

  /** Resolves the recipient IDs into an array of cached User objects */
  public get recipientUsers(): User[] {
    return this.recipients
      .map((id) => this.client.users.cache.get(id))
      .filter((user): user is User => user !== undefined);
  }

  [util.inspect.custom](_depth: number, options: util.InspectOptions, inspect: typeof util.inspect) {
    const { client, ...props } = this;
    return `${this.constructor.name} ${inspect(
      {
        ...props,
        owner: this.owner,
        recipientUsers: this.recipientUsers,
      },
      options,
    )}`;
  }
}
