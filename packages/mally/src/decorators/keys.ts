/**
 * Metadata keys used by decorators
 */
export const METADATA_KEYS = {
  COMMAND_OPTIONS: Symbol("mally:command:options"),
  IS_COMMAND: Symbol("mally:command:isCommand"),
  IS_STOAT_CLASS: Symbol("mally:stoat:isClass"),
  SIMPLE_COMMANDS: Symbol("mally:stoat:simpleCommands"),
  GUARDS: "mally:command:guards",
} as const;
