import "reflect-metadata";
import type { CommandMetadata, CommandOptions } from "../types";
import { METADATA_KEYS } from "./keys";

/**
 * @Command
 * Marks a class as a command and attaches metadata.
 * This is the legacy/class-based approach where each command is a separate class.
 *
 * @example
 * ```ts
 * import { Command, MallyCommand, CommandContext } from '@marshmallow/mally';
 *
 * @Command({
 *   description: 'Ban a user from the server',
 *   aliases: ['b'],
 *   permissions: ['BanMembers']
 * })
 * export class BanCommand implements MallyCommand {
 *   metadata!: CommandMetadata;
 *
 *   async run(ctx: CommandContext) {
 *     const userId = ctx.args[0];
 *     await ctx.reply(`Banned user ${userId}`);
 *   }
 * }
 * ```
 */
export function Command(options: CommandOptions = {}): ClassDecorator {
  return (target: Function) => {
    Reflect.defineMetadata(METADATA_KEYS.IS_COMMAND, true, target);
    Reflect.defineMetadata(METADATA_KEYS.COMMAND_OPTIONS, options, target);
  };
}

/**
 * Check if a class is decorated with @Command
 */
export function isCommand(target: Function): boolean {
  return Reflect.getMetadata(METADATA_KEYS.IS_COMMAND, target) === true;
}

/**
 * Get command options from a decorated class
 */
export function getCommandOptions(target: Function): CommandOptions | undefined {
  return Reflect.getMetadata(METADATA_KEYS.COMMAND_OPTIONS, target);
}

/**
 * Build complete CommandMetadata from options and class name
 */
export function buildCommandMetadata(target: Function, options: CommandOptions, category?: string): CommandMetadata {
  const className = target.name;
  const derivedName = className.replace(/Command$/i, "").toLowerCase();

  return {
    name: options.name ?? derivedName,
    description: options.description ?? "No description provided",
    aliases: options.aliases ?? [],
    permissions: options.permissions ?? [],
    category: options.category ?? category ?? "uncategorized",
    cooldown: options.cooldown ?? 0,
    nsfw: options.nsfw ?? false,
    ownerOnly: options.ownerOnly ?? false,
  };
}
