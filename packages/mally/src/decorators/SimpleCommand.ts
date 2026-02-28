import "reflect-metadata";
import type { SimpleCommandOptions } from "../types";
import { METADATA_KEYS } from "./keys";

/**
 * Stored simple command metadata from method decorator
 */
export interface SimpleCommandDefinition {
  methodName: string;
  options: SimpleCommandOptions;
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
      Reflect.getMetadata(METADATA_KEYS.SIMPLE_COMMANDS, constructor) || [];

    // Add this command definition
    existingCommands.push({
      methodName: String(propertyKey),
      options,
    });

    Reflect.defineMetadata(METADATA_KEYS.SIMPLE_COMMANDS, existingCommands, constructor);

    return descriptor;
  };
}

/**
 * Get all simple command definitions from a @Stoat class
 */
export function getSimpleCommands(target: Function): SimpleCommandDefinition[] {
  return Reflect.getMetadata(METADATA_KEYS.SIMPLE_COMMANDS, target) || [];
}
