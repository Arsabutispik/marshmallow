# @marshmallow-stoat/mally

A high-performance, decorator-based command handler for the [Stoat](https://github.com/stoatchat/javascript-client-sdk) ecosystem. Inspired by [discordx](https://github.com/discordx-ts/discordx).

## Features

- **Decorator-based** - Use `@Stoat()` and `@SimpleCommand()` decorators like discordx
- **Guards** - Built-in guard system for permissions and checks
- **Cooldowns** - Per-command cooldown support
- **Organized** - Group multiple commands in a single class
- **Type-safe** - Full TypeScript support

## Installation

```bash
npm install @marshmallow-stoat/mally reflect-metadata
# or
pnpm add @marshmallow-stoat/mally reflect-metadata
```

Make sure to enable decorators in your `tsconfig.json`:

```json
{
  "compilerOptions": {
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true
  }
}
```

## Quick Start

### 1. Create your handler

```typescript
// index.ts
import 'reflect-metadata';
import { Client } from 'stoat.js';
import { MallyHandler } from '@marshmallow-stoat/mally';

const client = new Client();

const handler = new MallyHandler({
    client, 
    prefix: '!', 
    owners: ['your-user-id']
});

await handler.init();

client.on('messageCreate', (message) => {
  handler.handleMessage(message);
});

client.login('your-token');
```

### 2. Create commands

```typescript
// commands/general.ts
import { Stoat, SimpleCommand, Context } from '@marshmallow-stoat/mally';

@Stoat()
export class GeneralCommands {
  @SimpleCommand({ name: 'ping', description: 'Check bot latency' })
  async ping(ctx: Context) {
    await ctx.reply(`Pong! 🏓`);
  }

  @SimpleCommand({ name: 'hello', aliases: ['hi', 'hey'] })
  async hello(ctx: Context) {
    await ctx.reply(`Hello, <@${ctx.authorId}>!`);
  }
}
```

That's it! No manual imports needed - decorated command classes are auto-discovered.

## Decorators

### @Stoat()

Marks a class as a command container. All `@SimpleCommand()` methods inside will be registered.

```typescript
@Stoat()
export class MyCommands {
  // commands go here
}
```

### @SimpleCommand(options)

Marks a method as a command.

```typescript
@SimpleCommand({
  name: 'ban',           // Command name (defaults to method name)
  description: 'Ban a user',
  aliases: ['b'],        // Alternative names
  permissions: ['BanMembers'], // This is currently not implemented, but will be in the future
  cooldown: 5000,        // 5 seconds
  ownerOnly: false,
  nsfw: false,
})
async ban(ctx: Context) {
  // ...
}
```

### @Guard(GuardClass)

Adds a guard check before command execution.

```typescript
import { Stoat, SimpleCommand, Guard, MallyGuard, Context } from '@marshmallow-stoat/mally';

// Define a guard
class IsAdmin implements MallyGuard {
  run(ctx: Context): boolean {
    return ctx.message.member?.hasPermission('Administrator') ?? false;
  }

  guardFail(ctx: Context): void {
    ctx.reply('You need Administrator permission!');
  }
}

@Stoat()
@Guard(IsAdmin)
export class AdminCommands {
  @SimpleCommand({ name: 'shutdown' })
  async shutdown(ctx: Context) {
    await ctx.reply('Shutting down...');
  }
}
```

## Context

The `Context` object provides:

```typescript
interface Context {
  client: Client;          // Stoat client instance
  message: Message;        // Original message
  content: string;         // Raw message content
  authorId: string;        // Author's user ID
  channelId: string;       // Channel ID
  serverId?: string;       // Server/Guild ID
  args: string[];          // Parsed arguments
  prefix: string;          // Prefix used
  commandName: string;     // Command name used
  
  reply(content: string): Promise<void>;
}
```

## Handler Options

```typescript
interface MallyHandlerOptions {
  client: Client;
  commandsDir?: string;          // Legacy mode: explicitly scan this directory
  discovery?: {
    roots?: string[];            // Default: [process.cwd()]
    include?: string[];          // Glob patterns per root
    ignore?: string[];           // Additional ignore globs
  };
  prefix: string | ((ctx: { serverId?: string }) => string | Promise<string>);
  owners?: string[];             // Owner user IDs
  extensions?: string[];         // File extensions (default: ['.js', '.mjs', '.cjs'])
  disableMentionPrefix?: boolean; // Disable @bot prefix
}

// Default auto-discovery is discordx-like: scans broadly under process.cwd(),
// then registers only files that look like decorated command modules.
```

## Dynamic Prefix

```typescript
const handler = new MallyHandler({
  client,
  prefix: async ({ serverId }) => {
    // Fetch from database, etc.
    return serverId ? await getServerPrefix(serverId) : '!';
  },
});

// Optional: constrain auto-discovery to specific roots/patterns
const scopedHandler = new MallyHandler({
  client,
  prefix: '!',
  discovery: {
    roots: [process.cwd()],
    include: ['apps/bot/dist/commands/**/*.js'],
  },
});

// TypeScript source discovery is opt-in and requires a TS runtime loader (tsx/ts-node)
const tsRuntimeHandler = new MallyHandler({
  client,
  prefix: '!',
  extensions: ['.ts'],
  discovery: {
    include: ['apps/bot/src/commands/**/*.ts'],
  },
});
```

All commands are defined through `@Stoat()` classes and `@SimpleCommand()` methods.

## License

AGPL-3.0-or-later



