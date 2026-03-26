import { Client, Message } from "stoat.js";

/**
 * Permission types for commands
 */
export type Permission =
  | "SendMessages"
  | "ManageMessages"
  | "ManageChannels"
  | "ManageServer"
  | "KickMembers"
  | "BanMembers"
  | "Administrator"
  | (string & {});

/**
 * Simple command options passed to @SimpleCommand decorator
 * Used with @Stoat() decorated classes for method-based commands
 */
export interface SimpleCommandOptions {
  /** Command name (defaults to method name) */
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
 */
export interface CommandContext {
  /** The client instance */
  client: Client;
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
  message: Message;
}

/**
 * Optional lifecycle hooks for @Stoat() class instances
 */
export interface StoatLifecycle {
  /** Optional: Called when an error occurs during command execution */
  onError?(ctx: CommandContext, error: Error): Promise<void>;
  /** Optional: Called when a cooldown is active */
  onCooldown?(ctx: CommandContext, remaining: number): Promise<void>;
}

export interface MallyGuard {
  run(ctx: CommandContext): Promise<boolean> | boolean;
  guardFail?(ctx: CommandContext): Promise<void> | void;
}

/**
 * Discovery options for automatic command module loading
 */
export interface MallyDiscoveryOptions {
  /** Root directories to scan (default: [process.cwd()]) */
  roots?: string[];
  /** Glob patterns relative to each root */
  include?: string[];
  /** Additional ignore patterns */
  ignore?: string[];
}

/**
 * Handler options
 */
export interface MallyHandlerOptions {
  /** The client instance */
  client: Client;
  /** Directory to scan for command modules (absolute path) */
  commandsDir?: string;
  /** Auto-discovery options used when commandsDir is not provided */
  discovery?: MallyDiscoveryOptions;
  /** Command prefix or prefix resolver function */
  prefix: string | ((ctx: { serverId?: string }) => string | Promise<string>);
  /** Owner IDs for owner-only commands */
  owners?: string[];
  /** File extensions to load (default: ['.js', '.mjs', '.cjs']) */
  extensions?: string[];
  /** Disable mention prefix support (default: false) */
  disableMentionPrefix?: boolean;
}
