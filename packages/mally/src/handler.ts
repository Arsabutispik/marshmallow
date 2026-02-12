import { CommandRegistry, RegisteredCommand } from './registry';
import type {
  CommandContext,
  MallyHandlerOptions,
  Middleware,
  CommandMetadata,
  MessageAdapter,
} from './types';

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
 *   middlewares: [permissionMiddleware],
 * });
 *
 * await handler.init();
 *
 * client.on('message', (message) => {
 *   handler.handleMessage(message);
 * });
 * ```
 */
export class MallyHandler<TClient = unknown, TMessage = unknown> {
  private readonly client: TClient;
  private readonly commandsDir: string;
  private readonly prefixResolver: string | ((ctx: { serverId?: string }) => string | Promise<string>);
  private readonly owners: Set<string>;
  private readonly middlewares: Middleware<TClient>[];
  private readonly registry: CommandRegistry<TClient>;
  private readonly cooldowns: Map<string, Map<string, number>> = new Map();
  private readonly messageAdapter?: MessageAdapter<TMessage>;

  constructor(options: MallyHandlerOptions<TClient, TMessage>) {
    this.client = options.client;
    this.commandsDir = options.commandsDir;
    this.prefixResolver = options.prefix;
    this.owners = new Set(options.owners ?? []);
    this.middlewares = options.middlewares ?? [];
    this.registry = new CommandRegistry<TClient>(options.extensions);
    this.messageAdapter = options.messageAdapter;
  }

  /**
   * Initialize the handler - load all commands
   */
  async init(): Promise<void> {
    await this.registry.loadFromDirectory(this.commandsDir);
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
   * Parse a raw message into command context
   */
  async parseMessage(
    rawContent: string,
    message: unknown,
    meta: {
      authorId: string;
      channelId: string;
      serverId?: string;
      reply: (content: string) => Promise<void>;
    }
  ): Promise<CommandContext<TClient> | null> {
    const prefix = await this.resolvePrefix(meta.serverId);

    if (!rawContent.startsWith(prefix)) {
      return null;
    }

    const withoutPrefix = rawContent.slice(prefix.length).trim();
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
      prefix,
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
  async handle(message: TMessage): Promise<boolean> {
    if (!this.messageAdapter) {
      throw new Error(
        'MessageAdapter is not configured. Either provide a messageAdapter in options or use handleMessage() with manual metadata.'
      );
    }

    // Check if message should be processed
    if (this.messageAdapter.shouldProcess && !this.messageAdapter.shouldProcess(message)) {
      return false;
    }

    const rawContent = this.messageAdapter.getContent(message);
    const authorId = this.messageAdapter.getAuthorId(message);
    const channelId = this.messageAdapter.getChannelId(message);
    const serverId = this.messageAdapter.getServerId?.(message);
    const reply = this.messageAdapter.createReply(message);

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
    message: unknown,
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
  async execute(ctx: CommandContext<TClient>): Promise<boolean> {
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

    // Cooldown check
    if (!this.checkCooldown(ctx.authorId, metadata)) {
      const remaining = this.getRemainingCooldown(ctx.authorId, metadata);
      await ctx.reply(`Please wait ${(remaining / 1000).toFixed(1)} seconds before using this command again.`);
      return false;
    }

    // Create middleware chain
    const runCommand = async (): Promise<void> => {
      await instance.run(ctx);
    };

    // Build middleware chain with permission check as first middleware
    const chain = this.buildMiddlewareChain(ctx, metadata, runCommand);

    try {
      await chain();

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
   * Build the middleware execution chain
   */
  private buildMiddlewareChain(
    ctx: CommandContext<TClient>,
    metadata: CommandMetadata,
    finalHandler: () => Promise<void>
  ): () => Promise<void> {
    // Built-in permission middleware
    const permissionMiddleware: Middleware<TClient> = async (ctx, next) => {
      // Permission check logic would go here
      // For now, we'll just pass through
      // In a real implementation, you'd check ctx against metadata.permissions
      if (metadata.permissions.length > 0) {
        // TODO: Implement actual permission checking with Stoat API
        // For now, we assume permissions are valid
      }
      await next();
    };

    // Combine built-in and user middlewares
    const allMiddlewares: Middleware<TClient>[] = [
      permissionMiddleware,
      ...this.middlewares,
    ];

    // Build chain from right to left
    let chain = finalHandler;

    for (let i = allMiddlewares.length - 1; i >= 0; i--) {
      const middleware = allMiddlewares[i];
      const nextChain = chain;
      chain = () => middleware(ctx, nextChain);
    }

    return chain;
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

  /**
   * Add a global middleware
   */
  use(middleware: Middleware<TClient>): this {
    this.middlewares.push(middleware);
    return this;
  }

  /**
   * Get the command registry
   */
  getRegistry(): CommandRegistry<TClient> {
    return this.registry;
  }

  /**
   * Get a command by name or alias
   */
  getCommand(name: string): RegisteredCommand<TClient> | undefined {
    return this.registry.get(name);
  }

  /**
   * Get all commands
   */
  getCommands(): RegisteredCommand<TClient>[] {
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
}

