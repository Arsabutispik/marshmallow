// Types
export type {
  Permission,
  CommandOptions,
  CommandMetadata,
  CommandContext,
  CommandContext as Context, // Short alias for convenience
  MallyCommand,
  CommandConstructor,
  MallyHandlerOptions,
    MallyGuard
} from './types';

// Base Command Class
export { BaseCommand } from './types';

// Decorators
export { Command, isCommand, getCommandOptions, buildCommandMetadata, Guard } from './decorators';

// Registry
export { CommandRegistry } from './registry';
export type { RegisteredCommand } from './registry';

// Handler
export { MallyHandler } from './handler';

