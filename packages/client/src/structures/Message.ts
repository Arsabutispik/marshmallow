import { Base } from "./Base";
import { Client } from "../client/Client";
import { Member } from "./Member";
import { User } from "./User";
import { BaseChannel } from "./BaseChannel";
import * as util from "node:util";
import { EmbedBuilder, TextEmbedData } from "../builders/EmbedBuilder";
import { Attachment } from "./Attachment";
import { Server } from "./Server";

export interface MessageOptions {
  content?: string;
  embeds?: (TextEmbedData | EmbedBuilder)[];
  attachments?: string[];
  interactions?: any[];
  flags?: number;
  masquerade?: Masquerade;
  replies?: ReplyIntent[];
}
export interface Masquerade {
  avatar?: string;
  name?: string;
  colour?: string;
}
export interface ReplyIntent {
  id: string;
  mention: boolean,
  fail_if_not_exists?: boolean,
}

export interface Interaction {
  reactions: string[];
  restrictReactions: boolean;
}

export class Message extends Base {
  public content: string | null = null;
  public authorId: string;
  public channelId: string;
  public embeds: any[] = [];
  public attachments: Attachment[] = [];
  public editedAt: Date | null = null;
  public flags: number = 0;
  public interactions: Interaction | null = null;
  public masquerade: Masquerade | null = null;
  public mentions: string[] = [];
  public pinned: boolean = false;
  public reactions: any[] = [];
  public replies: string[] = [];
  public role_mentions: string[] = [];

  constructor(client: Client, data: any) {
    super(client, data);

    this.authorId = data.author;
    this.channelId = data.channel;

    if (data.attachments) {
      this.attachments = data.attachments.map((fileData: any) => new Attachment(this.client, fileData));
    }

    if (data.masquerade !== undefined) this.masquerade = data.masquerade;
    if (data.mentions !== undefined) this.mentions = data.mentions;
    if (data.replies !== undefined) this.replies = data.replies;
    if (data.role_mentions !== undefined) this.role_mentions = data.role_mentions;

    this._patch(data);
  }

  public async reply(content: string): Promise<Message>;

  public async reply(options: MessageOptions): Promise<Message>;

  public async reply(contentOrOptions: string | MessageOptions): Promise<Message> {
    let payload: MessageOptions = {};

    if (typeof contentOrOptions === "string") {
      payload.content = contentOrOptions;
    } else {
      payload = contentOrOptions;
    }

    const resolvedEmbeds = payload.embeds?.map((embed) =>
      typeof (embed as any).toJSON === "function" ? (embed as any).toJSON() : embed,
    );

    const repliesArray: ReplyIntent[] = payload.replies ? [...payload.replies] : [];

    const alreadyReplying = repliesArray.some((reply) => reply.id === this.id);

    if (!alreadyReplying) {
      repliesArray.push({
        id: this.id,
        mention: true,
      });
    }

    const data = await this.client.rest.post(`/channels/${this.channelId}/messages`, {
      ...payload,
      embeds: resolvedEmbeds,
      replies: repliesArray,
    });

    return new Message(this.client, data);
  }

  public async edit(contentOrOptions: string | MessageOptions): Promise<Message> {
    let payload: MessageOptions = {};

    if (typeof contentOrOptions === "string") {
      payload.content = contentOrOptions;
    } else {
      payload = { ...contentOrOptions };
    }

    const resolvedEmbeds = payload.embeds?.map((embed) =>
      typeof (embed as any).toJSON === "function" ? (embed as any).toJSON() : embed,
    );

    const data = await this.client.rest.patch(`/channels/${this.channelId}/messages/${this.id}`, {
      ...payload,
      embeds: resolvedEmbeds,
    });

    this._patch(data);
    return this;
  }

  public async delete(): Promise<void> {
    await this.client.rest.delete(`/channels/${this.channelId}/messages/${this.id}`);
  }

  public async pin(): Promise<void> {
    await this.client.rest.post(`/channels/${this.channelId}/messages/${this.id}/pin`, {});
    this.pinned = true;
  }

  public async unpin(): Promise<void> {
    await this.client.rest.delete(`/channels/${this.channelId}/messages/${this.id}/pin`);
    this.pinned = false;
  }

  /** Gets the Channel object from cache */
  public get channel(): BaseChannel | undefined {
    return this.client.channels.cache.get(this.channelId);
  }

  /** Gets the Global User object from cache */
  public get author(): User | undefined {
    return this.client.users.cache.get(this.authorId);
  }

  /** Gets the Server Member object (if sent in a server) */
  public get member(): Member | undefined {
    const channel = this.channel;
    if (channel && "serverId" in channel) {
      const server = this.client.servers.cache.get((channel as any).serverId);
      return server?.members.cache.get(this.authorId);
    }
    return undefined;
  }

  /** Gets the Server ID if this message was sent in a server channel */
  public get serverId(): string | undefined {
    const channel = this.channel;
    if (channel && "serverId" in channel) {
      return (channel as any).serverId as string;
    }
    return undefined;
  }

  /** Gets the Server object from cache */
  public get server(): Server | undefined {
    const serverId = this.serverId;
    if (!serverId) return undefined;
    return this.client.servers.cache.get(serverId);
  }

  public _patch(data: any) {
    if (data.content !== undefined) this.content = data.content;
    if (data.edited !== undefined) this.editedAt = new Date(data.edited);
    if (data.pinned !== undefined) this.pinned = data.pinned;
    if (data.embeds !== undefined) this.embeds = data.embeds;
    if (data.flags !== undefined) this.flags = data.flags;
    if (data.reactions !== undefined) this.reactions = data.reactions;

    if (data.interactions !== undefined) {
      if (data.interactions) {
        this.interactions = {
          reactions: data.interactions.reactions ?? [],
          restrictReactions: data.interactions.restrict_reactions ?? false,
        };
      } else {
        this.interactions = null;
      }
    }
  }

  // This tells Node.js exactly how to print this object in console.log()
  [util.inspect.custom](depth: number, options: util.InspectOptions, inspect: typeof util.inspect) {
    const { client, authorId, channelId, ...props } = this;

    const data = {
      ...props,
      author: this.author,
      channel: this.channel,
      server: this.server,
      member: this.member,
    };

    return `${this.constructor.name} ${inspect(data, { ...options, depth: depth ?? options.depth })}`;
  }
}
