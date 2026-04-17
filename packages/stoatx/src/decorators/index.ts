// Re-export all decorators
export { Stoat, isStoatClass } from "./Stoat";
export { SimpleCommand, getSimpleCommands } from "./SimpleCommand";
export { Guard, getGuards } from "./Guard";
export { On, Once, getEventsMetadata } from "./Events";
// Types
export type { SimpleCommandDefinition } from "./SimpleCommand";
export type { EventDefinition } from "./Events";

// Shared utilities
export { buildSimpleCommandMetadata } from "./utils";

// Metadata keys (for advanced usage)
export { METADATA_KEYS } from "./keys";
