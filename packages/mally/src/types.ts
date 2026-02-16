import {Client} from "stoat.js";

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
  message: unknown;
}


/**
 * Interface that all command classes must implement
 */
export interface MallyCommand {
  /** Command metadata (injected by registry) */
  metadata: CommandMetadata;

  /**
   * Execute the command
   */
  run(ctx: CommandContext): Promise<void>;

  /**
   * Optional: Called when an error occurs during command execution
   */
  onError?(ctx: CommandContext, error: Error): Promise<void>;
}

/**
 * Abstract base class for commands.
 * Extend this class to create commands without boilerplate.
 *
 * @example
 * ```ts
 * @Command({ name: 'ping', description: 'Replies with Pong!' })
 * export class PingCommand extends BaseCommand {
 *   async run(ctx) {
 *     await ctx.reply('Pong!');
 *   }
 * }
 * ```
 */
export abstract class BaseCommand implements MallyCommand{
  /** Command metadata (injected by registry) */
  metadata!: CommandMetadata;

  /** Typed context for use in subclasses */
  protected ctx!: CommandContext;

  /**
   * Execute the command - must be implemented by subclasses
   */
  abstract run(ctx: CommandContext): Promise<void>;

  /**
   * Optional: Called when an error occurs during command execution.
   * Override this method to provide custom error handling.
   */
  async onError(ctx: CommandContext, error: Error): Promise<void> {
    await ctx.reply(`An error occurred: ${error.message}`);
  }
}

/**
 * Constructor type for command classes
 */
export type CommandConstructor = new () => MallyCommand;

/**
 * Handler options
 */
export interface MallyHandlerOptions {
    /** The client instance */
    client: Client;
  /** Directory to scan for commands (absolute path) */
  commandsDir: string;
  /** Command prefix or prefix resolver function */
  prefix: string | ((ctx: { serverId?: string }) => string | Promise<string>);
  /** Owner IDs for owner-only commands */
  owners?: string[];
  /** File extensions to load (default: ['.js', '.ts']) */
  extensions?: string[];
  /** Disable mention prefix support (default: false) */
  disableMentionPrefix?: boolean;
}



