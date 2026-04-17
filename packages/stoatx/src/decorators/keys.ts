/**
 * Metadata keys used by decorators
 */
export const METADATA_KEYS = {
  IS_STOAT_CLASS: Symbol("stoatx:stoat:isClass"),
  SIMPLE_COMMANDS: Symbol("stoatx:stoat:simpleCommands"),
  GUARDS: "stoatx:command:guards",
  EVENTS: Symbol("stoatx:stoat:events"),
} as const;
