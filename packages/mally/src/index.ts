// Types
export type {
  Permission,
  SimpleCommandOptions,
  CommandMetadata,
  CommandContext,
  CommandContext as Context, // Short alias for convenience
  StoatLifecycle,
  MallyHandlerOptions,
  MallyDiscoveryOptions,
  MallyGuard,
} from "./types";

// Decorators
export {
  Stoat,
  SimpleCommand,
  Guard,
  isStoatClass,
  getSimpleCommands,
  getGuards,
  buildSimpleCommandMetadata,
  METADATA_KEYS,
} from "./decorators";

export type { SimpleCommandDefinition } from "./decorators";

// Registry
export { CommandRegistry } from "./registry";
export type { RegisteredCommand } from "./registry";

// Handler
export { MallyHandler } from "./handler";
