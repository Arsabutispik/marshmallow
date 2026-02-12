/**
 * Permission types for commands
 */
export type Permission =
  | 'SendMessages'
  | 'ManageMessages'
  | 'ManageChannels'
  | 'ManageServer'
  | 'KickMembers'
  | 'BanMembers'
  | 'Administrator'
  | (string & {});

/**
 * Command metadata options passed to @Command decorator
 */
export interface CommandOptions {
  /** Command name (defaults to class name without 'Command' suffix) */
  name?: string;
  /** Command description */
  description?: string;
  /** Command aliases */
  aliases?: string[];
  /** Required permissions to run the command */
  permissions?: Permission[];
  /** Command category (auto-detected from directory if not provided) */
  category?: string;
  /** Cooldown in milliseconds */
  cooldown?: number;
  /** Whether the command is NSFW only */
  nsfw?: boolean;
  /** Whether the command is owner only */
  ownerOnly?: boolean;
}

/**
 * Resolved command metadata with required fields
 */
export interface CommandMetadata {
  name: string;
  description: string;
  aliases: string[];
  permissions: Permission[];
  category: string;
  cooldown: number;
  nsfw: boolean;
  ownerOnly: boolean;
}

/**
 * Command execution context
 * @template TClient - The client type (e.g., stoat.js Client)
 */
export interface CommandContext<TClient = unknown> {
  /** The Stoat client instance */
  client: TClient;
  /** The raw message content */
  content: string;
  /** The author ID */
  authorId: string;
  /** The channel ID */
  channelId: string;
  /** The server/guild ID (if applicable) */
  serverId?: string;
  /** Parsed command arguments */
  args: string[];
  /** The prefix used */
  prefix: string;
  /** The command name used (could be an alias) */
  commandName: string;
  /** Reply to the message */
  reply: (content: string) => Promise<void>;
  /** The original message object (platform-specific) */
  message: unknown;
}

/**
 * Middleware function type
 */
export type Middleware<TClient = unknown> = (
  ctx: CommandContext<TClient>,
  next: () => Promise<void>
) => Promise<void>;

/**
 * Interface that all command classes must implement
 */
export interface MallyCommand<TClient = unknown> {
  /** Command metadata (injected by registry) */
  metadata: CommandMetadata;

  /**
   * Execute the command
   */
  run(ctx: CommandContext<TClient>): Promise<void>;

  /**
   * Optional: Called when an error occurs during command execution
   */
  onError?(ctx: CommandContext<TClient>, error: Error): Promise<void>;
}

/**
 * Constructor type for command classes
 */
export type CommandConstructor<TClient = unknown> = new () => MallyCommand<TClient>;

/**
 * Handler options
 */
export interface MallyHandlerOptions<TClient = unknown> {
  /** The Stoat client instance */
  client: TClient;
  /** Directory to scan for commands (absolute path) */
  commandsDir: string;
  /** Command prefix or prefix resolver function */
  prefix: string | ((ctx: { serverId?: string }) => string | Promise<string>);
  /** Owner IDs for owner-only commands */
  owners?: string[];
  /** Global middlewares */
  middlewares?: Middleware<TClient>[];
  /** File extensions to load (default: ['.js', '.ts']) */
  extensions?: string[];
}



