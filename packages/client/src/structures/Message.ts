import { Base } from "./Base";
import { Client } from "../client/Client";
import { Member } from "./Member";
import { User } from "./User";
import { BaseChannel } from "./BaseChannel";
import * as util from "node:util";
import { EmbedBuilder, TextEmbedData } from "../builders/EmbedBuilder";
import { Attachment } from "./Attachment";
import { Server } from "./Server";
import { decodeTime } from "ulid";
import { UserResolvable } from "../managers/UserManager";
import { ReactionCollector, ReactionCollectorOptions } from "../utils/ReactionCollector";
import { Collection } from "../utils/Collection";
import { MessageReaction } from "./MessageReaction";

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
  mention: boolean;
  fail_if_not_exists?: boolean;
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
  public createdAt: Date | null = null;
  public flags: number = 0;
  public interactions: Interaction | null = null;
  public masquerade: Masquerade | null = null;
  public mentions: string[] = [];
  public pinned: boolean = false;
  public reactions: Record<string, string[]> = {};
  public replies: string[] = [];
  public role_mentions: string[] = [];

  constructor(client: Client, data: any) {
    super(client, data);

    this.authorId = data.author;
    this.channelId = data.channel;

    const timestamp = decodeTime(this.id);
    if (timestamp) {
      this.createdAt = new Date(timestamp);
    }

    if (data.attachments) {
      this.attachments = data.attachments.map((fileData: any) => new Attachment(this.client, fileData));
    }

    if (data.masquerade !== undefined) this.masquerade = data.masquerade;
    if (data.mentions !== undefined) this.mentions = data.mentions;
    if (data.replies !== undefined) this.replies = data.replies;
    if (data.role_mentions !== undefined) this.role_mentions = data.role_mentions;

    this._patch(data);
  }

  public async reply(contentOrOptions: string | MessageOptions): Promise<Message> {
    let channel = this.channel;
    if (!channel) channel = await this.client.channels.fetch(this.channelId);

    const options: MessageOptions =
      typeof contentOrOptions === "string" ? { content: contentOrOptions } : { ...contentOrOptions };

    const repliesArray: ReplyIntent[] = options.replies ? [...options.replies] : [];

    const alreadyReplying = repliesArray.some((reply) => reply.id === this.id);
    if (!alreadyReplying) {
      repliesArray.push({
        id: this.id,
        mention: true,
      });
    }

    options.replies = repliesArray;

    return channel.messages.send(options);
  }

  /**
   * Edits this message.
   * @param contentOrOptions The new content or options for the message.
   */
  public async edit(contentOrOptions: string | MessageOptions): Promise<this> {
    let channel = this.channel;
    if (!channel) channel = await this.client.channels.fetch(this.channelId);

    return (await channel.messages.edit(this.id, contentOrOptions)) as this;
  }

  /**
   * Deletes this message.
   */
  public async delete(): Promise<void> {
    let channel = this.channel;
    if (!channel) channel = await this.client.channels.fetch(this.channelId);

    await channel.messages.delete(this.id);
  }

  /**
   * Pins this message.
   */
  public async pin(): Promise<void> {
    let channel = this.channel;
    if (!channel) channel = await this.client.channels.fetch(this.channelId);

    await channel.messages.pin(this.id);
  }

  /**
   * Unpins this message.
   */
  public async unpin(): Promise<void> {
    let channel = this.channel;
    if (!channel) channel = await this.client.channels.fetch(this.channelId);

    await channel.messages.unpin(this.id);
  }

  /**
   * React to this message
   * @param reaction The emoji to react with. Can be a Unicode emoji or a custom emoji ID.
   * @throws {Error} If the API request fails.
   * @example
   * await message.react("👍");
   * await message.react("customEmojiId");
   */
  public async react(reaction: string): Promise<void> {
    let channel = this.channel;
    if (!channel) channel = await this.client.channels.fetch(this.channelId);

    await channel.messages.react(this.id, reaction);
  }

  /**
   * Remove a reaction from this message
   * @param reaction The emoji to remove. Can be a Unicode emoji or a custom emoji ID.
   * @param userId The ID of the user whose reaction to remove. If not provided, removes the current user's reaction.
   * @param removeAll Remove all reactions of this type.
   * @throws {Error} If both userId and removeAll are provided, or if the API request fails.
   * @example
   * // Remove the current user's reaction
   * await message.removeReaction("👍");
   * // Remove a specific user's reaction
   * await message.removeReaction("👍", userId);
   * // Remove all reactions of this type
   * await message.removeReaction("👍", undefined, true);
   */
  public async removeReaction(reaction: string, userId?: UserResolvable, removeAll?: boolean): Promise<void> {
    let channel = this.channel;
    if (!channel) channel = await this.client.channels.fetch(this.channelId);

    await channel.messages.removeReaction(this.id, reaction, userId, removeAll);
  }

  /**
   * Remove all reactions from this message
   * @throws {Error} If the API request fails.
   * @example
   * await message.clearReactions();
   */
  public async clearReactions(): Promise<void> {
    let channel = this.channel;
    if (!channel) channel = await this.client.channels.fetch(this.channelId);

    await channel.messages.clearReactions(this.id);
  }

  /**
   * Creates a ReactionCollector to collect reactions on this message.
   * @param options The options for the collector.
   * @returns A new ReactionCollector instance.
   * @example
   * const collector = message.createReactionCollector({ time: 15000 });
   * collector.on('collect', (reaction) => console.log(`Collected ${reaction.emojiId} from ${reaction.userId}`));
   * collector.on('end', (collected) => console.log(`Collected ${collected.size} items`));
   */
  public createReactionCollector(options?: ReactionCollectorOptions): ReactionCollector {
    return new ReactionCollector(this, options);
  }

  /**
   * Awaits reactions on this message.
   * @param options The options for the collector.
   * @returns A promise that resolves to a collection of reactions collected.
   * @example
   * // Await reactions
   * const filter = (reaction) => reaction.emoji.id === '123' && reaction.users.has(author.id);
   * message.awaitReactions({ filter, max: 1, time: 60000 })
   *   .then(collected => console.log(collected.size))
   *   .catch(console.error);
   */
  public awaitReactions(options?: ReactionCollectorOptions): Promise<Collection<string, MessageReaction>> {
    return new Promise((resolve) => {
      const collector = this.createReactionCollector(options);
      collector.once("end", (collected) => resolve(collected));
    });
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
    if (data.reactions !== undefined) {
      this.reactions = Array.isArray(data.reactions) ? {} : data.reactions;
    }

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
