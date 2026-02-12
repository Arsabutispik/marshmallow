// Types
export type {
  Permission,
  CommandOptions,
  CommandMetadata,
  CommandContext,
  CommandContext as Context, // Short alias for convenience
  Middleware,
  MallyCommand,
  CommandConstructor,
  MallyHandlerOptions,
  MessageAdapter,
} from './types';

// Base Command Class
export { BaseCommand } from './types';

// Decorators
export { Command, isCommand, getCommandOptions, buildCommandMetadata } from './decorators';

// Registry
export { CommandRegistry } from './registry';
export type { RegisteredCommand } from './registry';

// Handler
export { MallyHandler } from './handler';

