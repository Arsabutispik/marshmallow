import "reflect-metadata";
import { METADATA_KEYS } from "./keys";
import { decoratorStore } from "./store";

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
    Reflect.defineMetadata(METADATA_KEYS.IS_STOAT_CLASS, true, target);
    decoratorStore.registerStoatClass(target);
  };
}

/**
 * Check if a class is decorated with @Stoat
 */
export function isStoatClass(target: Function): boolean {
  return Reflect.getMetadata(METADATA_KEYS.IS_STOAT_CLASS, target) === true;
}
