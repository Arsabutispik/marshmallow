/**
 * Decorators module - Re-exports all decorators from the decorators folder
 *
 * This file maintains backward compatibility while the actual implementations
 * are organized in separate files under the decorators/ folder.
 */

// Re-export everything from the decorators folder
export {
  // Stoat (discordx-style class decorator)
  Stoat,
  isStoatClass,

  // SimpleCommand (method decorator for @Stoat classes)
  SimpleCommand,
  getSimpleCommands,

  // Guard
  Guard,
  getGuards,

  // Utilities
  buildSimpleCommandMetadata,

  // Metadata keys
  METADATA_KEYS,

  // Events
  On,
  Once,
  getEventsMetadata,
} from "./decorators/index";

// Re-export types
export type { SimpleCommandDefinition, EventDefinition } from "./decorators/index";
