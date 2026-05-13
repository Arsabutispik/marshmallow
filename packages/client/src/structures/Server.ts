import { Base } from "./Base";
import type { Client } from "../client/Client";
import { FetchMembersOptions, MemberManager } from "../managers/MemberManager";
import { ServerChannelManager } from "../managers/ServerChannelManager";
import { Attachment } from "./Attachment";
import { RoleManager, RoleResolvable } from "../managers/RoleManager";
import { ServerInviteManager } from "../managers/ServerInviteManager";
import { ServerBanManager } from "../managers/ServerBanManager";
import { ServerEditOptions } from "../managers/ServerManager";

export interface Categories {
  channels: string[];
  id: string;
  title: string;
}

export class Server extends Base {
  public channelIds: string[] = [];
  public defaultPermissions!: bigint;
  public name!: string;
  public ownerId!: string;
  public analytics: boolean = false;
  public banner: Attachment | null = null;
  public categories: Categories[] = [];
  public description: string | null = null;
  public discoverable: boolean = false;
  public flags: number = 0;
  public icon: Attachment | null = null;
  public nsfw: boolean = false;
  public members: MemberManager;
  public channels: ServerChannelManager;
  public roles: RoleManager;
  public bans: ServerBanManager;
  public invites: ServerInviteManager;

  constructor(client: Client, data: any) {
    super(client, data);
    this.channels = new ServerChannelManager(client, this);
    this.members = new MemberManager(client, this);
    this.roles = new RoleManager(client, this);
    this.bans = new ServerBanManager(this.client, this);
    this.invites = new ServerInviteManager(this.client, this);
    this._patch(data);
  }

  /**
   * Updates the server instance with new data without losing the object reference.
   */
  public _patch(data: any, clear?: string[]) {
    if (data.channels !== undefined) this.channelIds = data.channels;
    if (data.default_permissions !== undefined) {
      try {
        this.defaultPermissions = BigInt(data.default_permissions);
      } catch {
        this.defaultPermissions = 0n;
      }
    }
    if (data.name !== undefined) this.name = data.name;
    if (data.owner !== undefined) this.ownerId = data.owner;
    if (data.analytics !== undefined) this.analytics = data.analytics;
    if (data.categories !== undefined) this.categories = data.categories;
    if (data.description !== undefined) this.description = data.description;
    if (data.discoverable !== undefined) this.discoverable = data.discoverable;
    if (data.flags !== undefined) this.flags = data.flags;
    if (data.nsfw !== undefined) this.nsfw = data.nsfw;
    if (data.icon !== undefined) {
      this.icon = data.icon ? new Attachment(this.client, data.icon) : null;
    }
    if (data.banner !== undefined) {
      this.banner = data.banner ? new Attachment(this.client, data.banner) : null;
    }
    if (data.roles !== undefined) {
      for (const [id, roleData] of Object.entries(data.roles)) {
        this.roles._add({ id, ...(roleData as any) });
      }
    }

    if (clear && Array.isArray(clear)) {
      for (const field of clear) {
        switch (field) {
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

  /**
   * Edits this server.
   * @param options The fields to update.
   */
  public async edit(options: ServerEditOptions): Promise<this> {
    await this.client.servers.edit(this.id, options);
    return this;
  }

  /**
   * Leaves the server
   */
  public async leave() {
    return this.client.rest.delete(`/servers/${this.id}/leave`);
  }

  /**
   * Fetches multiple members from this server.
   * @param options Filter options for the fetch request.
   * @returns A Collection of the fetched members.
   */
  public async fetchMembers(options?: FetchMembersOptions) {
    return this.members.fetchMany(options);
  }
}
