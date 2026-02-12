import 'reflect-metadata';
import type { CommandOptions, CommandMetadata } from './types';

// Metadata keys
const COMMAND_OPTIONS_KEY = Symbol('mally:command:options');
const IS_COMMAND_KEY = Symbol('mally:command:isCommand');

/**
 * @Command class decorator
 * Marks a class as a command and attaches metadata
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
    Reflect.defineMetadata(IS_COMMAND_KEY, true, target);
    Reflect.defineMetadata(COMMAND_OPTIONS_KEY, options, target);
  };
}

/**
 * Check if a class is decorated with @Command
 */
export function isCommand(target: Function): boolean {
  return Reflect.getMetadata(IS_COMMAND_KEY, target) === true;
}

/**
 * Get command options from a decorated class
 */
export function getCommandOptions(target: Function): CommandOptions | undefined {
  return Reflect.getMetadata(COMMAND_OPTIONS_KEY, target);
}

/**
 * Build complete CommandMetadata from options and class name
 */
export function buildCommandMetadata(
  target: Function,
  options: CommandOptions,
  category?: string
): CommandMetadata {
  const className = target.name;
  const derivedName = className
    .replace(/Command$/i, '')
    .toLowerCase();

  return {
    name: options.name ?? derivedName,
    description: options.description ?? 'No description provided',
    aliases: options.aliases ?? [],
    permissions: options.permissions ?? [],
    category: options.category ?? category ?? 'uncategorized',
    cooldown: options.cooldown ?? 0,
    nsfw: options.nsfw ?? false,
    ownerOnly: options.ownerOnly ?? false,
  };
}

