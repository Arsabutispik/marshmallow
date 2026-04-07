import type { CommandMetadata, SimpleCommandOptions } from "../types";

/**
 * Build CommandMetadata from SimpleCommandOptions
 */
export function buildSimpleCommandMetadata(
  options: SimpleCommandOptions,
  methodName: string,
  category?: string,
): CommandMetadata {
  return {
    name: options.name ?? methodName.toLowerCase(),
    description: options.description ?? "No description provided",
    aliases: options.aliases ?? [],
    permissions: options.permissions ?? [],
    category: options.category ?? category ?? "uncategorized",
    cooldown: options.cooldown ?? 0,
    nsfw: options.nsfw ?? false,
    ownerOnly: options.ownerOnly ?? false,
  };
}
