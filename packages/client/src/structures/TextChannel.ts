import { BaseChannel } from "./BaseChannel";
import { Client } from "../client/Client";
import { Attachment } from "./Attachment";

export class TextChannel extends BaseChannel {
  public name!: string;
  public serverId!: string;
  public defaultPermissions?: {a: number, d: number};
  public description?: string | null;
  public icon?: Attachment | null;
  public lastMessageId?: string | null;
  public nsfw?: boolean;
  public slowmode?: number;
  public voice?: any;

  constructor(client: Client, data: any) {
    super(client, data);
    this.serverId = data.server;
    this.defaultPermissions = data.default_permissions;
    this.description = data.description;
    this.icon = data.icon;
    this.lastMessageId = data.last_message_id;
    this.nsfw = data.nsfw ?? false;
    this.slowmode = data.slowmode ?? 0;
    this.voice = data.voice;
    this._patch(data);
  }

  public _patch(data: any, clear?: string[]) {
    if (data.name !== undefined) this.name = data.name;
    if (data.description !== undefined) this.description = data.description;

    if (clear && Array.isArray(clear)) {
      for (const field of clear) {
        switch (field) {
          case "Description":
            this.description = null;
            break;
        }
      }
    }
  }
}
