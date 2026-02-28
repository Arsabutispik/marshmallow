import 'reflect-metadata';
import type {CommandMetadata, CommandOptions, SimpleCommandOptions} from './types';

// Metadata keys
const COMMAND_OPTIONS_KEY = Symbol('mally:command:options');
const IS_COMMAND_KEY = Symbol('mally:command:isCommand');
const IS_STOAT_CLASS_KEY = Symbol('mally:stoat:isClass');
const SIMPLE_COMMANDS_KEY = Symbol('mally:stoat:simpleCommands');

/**
 * Stored simple command metadata from method decorator
 */
export interface SimpleCommandDefinition {
  methodName: string;
  options: SimpleCommandOptions;
}

/**
 * @Stoat
 * Marks a class as a Stoat command container.
 * Use this decorator on classes that contain @SimpleCommand methods.
 *
 * @example
 * ```ts
 * import { Stoat, SimpleCommand, CommandContext } from '@marshmallow/mally';
 *
 * @Stoat()
 * class ModerationCommands {
 *   @SimpleCommand({ name: 'ban', description: 'Ban a user' })
 *   async ban(ctx: CommandContext) {
 *     await ctx.reply('User banned!');
 *   }
 *
 *   @SimpleCommand({ name: 'kick', description: 'Kick a user' })
 *   async kick(ctx: CommandContext) {
 *     await ctx.reply('User kicked!');
 *   }
 * }
 * ```
 */
export function Stoat(): ClassDecorator {
  return (target: Function) => {
    Reflect.defineMetadata(IS_STOAT_CLASS_KEY, true, target);
  };
}

/**
 * @SimpleCommand
 * Marks a method as a simple command within a @Stoat() decorated class.
 *
 * @example
 * ```ts
 * @Stoat()
 * class Example {
 *   @SimpleCommand({ name: 'ping', description: 'Replies with Pong!' })
 *   async ping(ctx: CommandContext) {
 *     await ctx.reply('Pong!');
 *   }
 *
 *   @SimpleCommand({ aliases: ['perm'], name: 'permission' })
 *   async permission(ctx: CommandContext) {
 *     await ctx.reply('Access granted');
 *   }
 * }
 * ```
 */
export function SimpleCommand(options: SimpleCommandOptions = {}): MethodDecorator {
  return (target: Object, propertyKey: string | symbol, descriptor: PropertyDescriptor) => {
    const constructor = target.constructor;

    // Get existing simple commands or create new array
    const existingCommands: SimpleCommandDefinition[] =
      Reflect.getMetadata(SIMPLE_COMMANDS_KEY, constructor) || [];

    // Add this command definition
    existingCommands.push({
      methodName: String(propertyKey),
      options,
    });

    Reflect.defineMetadata(SIMPLE_COMMANDS_KEY, existingCommands, constructor);

    return descriptor;
  };
}

/**
 * Check if a class is decorated with @Stoat
 */
export function isStoatClass(target: Function): boolean {
  return Reflect.getMetadata(IS_STOAT_CLASS_KEY, target) === true;
}

/**
 * Get all simple command definitions from a @Stoat class
 */
export function getSimpleCommands(target: Function): SimpleCommandDefinition[] {
  return Reflect.getMetadata(SIMPLE_COMMANDS_KEY, target) || [];
}

/**
 * @Command
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
 * @Guard
 * Runs before a command to check if it should execute. Should return true to allow execution, false to block.
 * Can be applied to both @Command classes and @Stoat classes.
 *
 * @example
 * ```ts
 * import { Guard, Stoat, SimpleCommand, CommandContext } from '@marshmallow/mally';
 *
 * @Stoat()
 * @Guard(NotBot)
 * class AdminCommands {
 *   @SimpleCommand({ name: 'admin', description: 'Admin only command' })
 *   async admin(ctx: CommandContext) {
 *     ctx.reply("You passed the guard check!");
 *   }
 * }
 * ```
 */
export function Guard(guardClass: Function): ClassDecorator {
  return (target: Function) => {
    const existingGuards: Function[] =
      Reflect.getMetadata('mally:command:guards', target) || [];
    existingGuards.push(guardClass);
    Reflect.defineMetadata('mally:command:guards', existingGuards, target);
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

/**
 * Build CommandMetadata from SimpleCommandOptions
 */
export function buildSimpleCommandMetadata(
  options: SimpleCommandOptions,
  methodName: string,
  category?: string
): CommandMetadata {
  return {
    name: options.name ?? methodName.toLowerCase(),
    description: options.description ?? 'No description provided',
    aliases: options.aliases ?? [],
    permissions: options.permissions ?? [],
    category: options.category ?? category ?? 'uncategorized',
    cooldown: options.cooldown ?? 0,
    nsfw: options.nsfw ?? false,
    ownerOnly: options.ownerOnly ?? false,
  };
}
