/**
 * Metadata keys used by decorators
 */
export const METADATA_KEYS = {
  IS_STOAT_CLASS: Symbol("mally:stoat:isClass"),
  SIMPLE_COMMANDS: Symbol("mally:stoat:simpleCommands"),
  GUARDS: "mally:command:guards",
} as const;
