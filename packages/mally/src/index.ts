// Types
export type {
  Permission,
  CommandOptions,
  SimpleCommandOptions,
  CommandMetadata,
  CommandContext,
  CommandContext as Context, // Short alias for convenience
  MallyCommand,
  CommandConstructor,
  MallyHandlerOptions,
  MallyDiscoveryOptions,
  MallyGuard,
} from "./types";

// Base Command Class
export { BaseCommand } from "./types";

// Decorators
export {
  Command,
  Stoat,
  SimpleCommand,
  Guard,
  isCommand,
  isStoatClass,
  getCommandOptions,
  getSimpleCommands,
  getGuards,
  buildCommandMetadata,
  buildSimpleCommandMetadata,
  METADATA_KEYS,
} from "./decorators";

export type { SimpleCommandDefinition } from "./decorators";

// Registry
export { CommandRegistry } from "./registry";
export type { RegisteredCommand } from "./registry";

// Handler
export { MallyHandler } from "./handler";
