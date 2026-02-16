import 'reflect-metadata';
import {CommandRegistry, RegisteredCommand} from './registry';
import type {CommandContext, CommandMetadata, MallyHandlerOptions, } from './types';
import {Client, Message} from "stoat.js";

/**
 * MallyHandler - The execution engine for commands
 *
 * Handles message parsing, middleware execution, and command dispatching
 *
 * @example
 * ```ts
 * import { MallyHandler } from '@marshmallow/mally';
 * import { Client } from 'stoat.js';
 *
 * const client = new Client();
 *
 * const handler = new MallyHandler({
 *   client,
 *   commandsDir: path.join(__dirname, 'commands'),
 *   prefix: '!',
 *   owners: ['owner-user-id'],
 * });
 *
 * await handler.init();
 *
 * client.on('message', (message) => {
 *   handler.handleMessage(message);
 * });
 * ```
 */
export class MallyHandler {
  private readonly commandsDir: string;
  private readonly prefixResolver: string | ((ctx: { serverId?: string }) => string | Promise<string>);
  private readonly owners: Set<string>;
  private readonly registry: CommandRegistry;
  private readonly cooldowns: Map<string, Map<string, number>> = new Map();
  private readonly disableMentionPrefix: boolean;
  private readonly client: Client;
  constructor(options: MallyHandlerOptions) {
    this.client = options.client;
    this.commandsDir = options.commandsDir;
    this.prefixResolver = options.prefix;
    this.owners = new Set(options.owners ?? [])
    this.registry = new CommandRegistry(options.extensions);
    this.disableMentionPrefix = options.disableMentionPrefix ?? false;
  }

  /**
   * Initialize the handler - load all commands
   */
  async init(): Promise<void> {
    await this.registry.loadFromDirectory(this.commandsDir);
  }

  /**
   * Parse a raw message into command context
   */
  async parseMessage(
    rawContent: string,
    message: Message,
    meta: {
      authorId: string;
      channelId: string;
      serverId?: string;
      reply: (content: string) => Promise<void>;
    }
  ): Promise<CommandContext | null> {
    const prefix = await this.resolvePrefix(meta.serverId);
    let usedPrefix = prefix;
    let withoutPrefix = '';

    // Check for string prefix
    if (rawContent.startsWith(prefix)) {
      withoutPrefix = rawContent.slice(prefix.length).trim();
      usedPrefix = prefix;
    }
    // Check for mention prefix (e.g., "<@bot-id> command") - unless disabled
    else if (!this.disableMentionPrefix && rawContent.match(/^<@!?[\w]+>/)) {
      const mentionMatch = rawContent.match(/^<@!?([\w]+)>\s*/);
      if (mentionMatch) {
        const mentionedId = mentionMatch[1];
        const botId = this.client.user?.id;

        // Only process if mentioned user is the bot
        if (botId && mentionedId === botId) {
          usedPrefix = mentionMatch[0];
          withoutPrefix = rawContent.slice(mentionMatch[0].length).trim();
        } else {
        }
      }
    }

    if (!withoutPrefix) {
      return null;
    }

    const [commandName, ...args] = withoutPrefix.split(/\s+/);

    if (!commandName) {
      return null;
    }

    return {
      client: this.client,
      content: rawContent,
      authorId: meta.authorId,
      channelId: meta.channelId,
      serverId: meta.serverId,
      args,
      prefix: usedPrefix,
      commandName: commandName.toLowerCase(),
      reply: meta.reply,
      message,
    };
  }

  /**
   * Handle a message object using the configured message adapter
   *
   * @example
   * ```ts
   * // With message adapter configured
   * client.on('messageCreate', (message) => {
   *   handler.handle(message);
   * });
   * ```
   */
  async handle(message: any): Promise<boolean> {
    if(!message.channel || !message.author) {
      return false;
    }

    // Skip messages from bots
    if (message.author.bot) {
      return false;
    }

    const rawContent = message.content;
    const authorId = message.author.id;
    const channelId = message.channel.id;
    const serverId = message.server?.id;
    const reply = async (content: string) => {
      await message.channel!.sendMessage(content);
    }

    return this.handleMessage(rawContent, message, {
      authorId,
      channelId,
      serverId,
      reply,
    });
  }

  /**
   * Handle a raw message string with metadata
   *
   * @example
   * ```ts
   * // Manual usage without message adapter
   * client.on('messageCreate', (message) => {
   *   handler.handleMessage(message.content, message, {
   *     authorId: message.author.id,
   *     channelId: message.channel.id,
   *     serverId: message.server?.id,
   *     reply: (content) => message.channel.sendMessage(content),
   *   });
   * });
   * ```
   */
  async handleMessage(
    rawContent: string,
    message: Message,
    meta: {
      authorId: string;
      channelId: string;
      serverId?: string;
      reply: (content: string) => Promise<void>;
    }
  ): Promise<boolean> {
    const ctx = await this.parseMessage(rawContent, message, meta);

    if (!ctx) {
      return false;
    }

    return this.execute(ctx);
  }

  /**
   * Execute a command with the given context
   */
  async execute(ctx: CommandContext): Promise<boolean> {
    const registered = this.registry.get(ctx.commandName);

    if (!registered) {
      return false;
    }

    const { instance, metadata } = registered;

    // Owner-only check
    if (metadata.ownerOnly && !this.owners.has(ctx.authorId)) {
      await ctx.reply('This command is owner-only.');
      return false;
    }
    const guards: Function[] = Reflect.getMetadata('mally:command:guards', instance.constructor) || [];
    for (const guardClass of guards) {
      const guardInstance = new (guardClass as any)();
      if (typeof guardInstance.run === 'function') {
        const guardResult = await guardInstance.run(ctx);
        if (!guardResult) {
          if (typeof guardInstance.guardFail === 'function') {
            await guardInstance.guardFail(ctx);
          } else {
            console.error("[Mally] Guard check failed but no guardFail method defined on", guardClass.name);
          }
          return false;
        }
      }
    }
    // Cooldown check
    if (!this.checkCooldown(ctx.authorId, metadata)) {
      const remaining = this.getRemainingCooldown(ctx.authorId, metadata);
      if (instance.onCooldown) {
        await instance.onCooldown(ctx, remaining);
      } else {
        await ctx.reply(`Please wait ${(remaining / 1000).toFixed(1)} seconds before using this command again.`);
      }
      return false;
    }
    await instance.run(ctx)
    try {
      // Set cooldown after successful execution
      if (metadata.cooldown > 0) {
        this.setCooldown(ctx.authorId, metadata);
      }

      return true;
    } catch (error) {
      if (instance.onError) {
        await instance.onError(ctx, error as Error);
      } else {
        console.error(`[Mally] Error in command ${metadata.name}:`, error);
        await ctx.reply(`An error occurred: ${(error as Error).message}`);
      }
      return false;
    }
  }

  /**
   * Get the command registry
   */
  getRegistry(): CommandRegistry {
    return this.registry;
  }

  /**
   * Get a command by name or alias
   */
  getCommand(name: string): RegisteredCommand | undefined {
    return this.registry.get(name);
  }

  /**
   * Get all commands
   */
  getCommands(): RegisteredCommand[] {
    return this.registry.getAll();
  }

  /**
   * Reload all commands
   */
  async reload(): Promise<void> {
    this.registry.clear();
    this.cooldowns.clear();
    await this.registry.loadFromDirectory(this.commandsDir);
  }

  /**
   * Check if a user is an owner
   */
  isOwner(userId: string): boolean {
    return this.owners.has(userId);
  }

  /**
   * Add an owner
   */
  addOwner(userId: string): void {
    this.owners.add(userId);
  }

  /**
   * Remove an owner
   */
  removeOwner(userId: string): void {
    this.owners.delete(userId);
  }

  /**
   * Resolve the prefix for a context
   */
  private async resolvePrefix(serverId?: string): Promise<string> {
    if (typeof this.prefixResolver === 'function') {
      return this.prefixResolver({ serverId });
    }
    return this.prefixResolver;
  }

  /**
   * Check if user is on cooldown
   */
  private checkCooldown(userId: string, metadata: CommandMetadata): boolean {
    if (metadata.cooldown <= 0) return true;

    const commandCooldowns = this.cooldowns.get(metadata.name);
    if (!commandCooldowns) return true;

    const userCooldown = commandCooldowns.get(userId);
    if (!userCooldown) return true;

    return Date.now() >= userCooldown;
  }

  /**
   * Get remaining cooldown time in ms
   */
  private getRemainingCooldown(userId: string, metadata: CommandMetadata): number {
    const commandCooldowns = this.cooldowns.get(metadata.name);
    if (!commandCooldowns) return 0;

    const userCooldown = commandCooldowns.get(userId);
    if (!userCooldown) return 0;

    return Math.max(0, userCooldown - Date.now());
  }

  /**
   * Set cooldown for a user
   */
  private setCooldown(userId: string, metadata: CommandMetadata): void {
    if (!this.cooldowns.has(metadata.name)) {
      this.cooldowns.set(metadata.name, new Map());
    }

    const commandCooldowns = this.cooldowns.get(metadata.name)!;
    commandCooldowns.set(userId, Date.now() + metadata.cooldown);
  }
}

