# @stoatx/client

A high-performance, fully-typed, and memory-efficient client library for the Stoat API. Built from the ground up for the Stoatx ecosystem.

[![npm version](https://img.shields.io/npm/v/@stoatx/client.svg?style=flat-square)](https://www.npmjs.com/package/@stoatx/client)
[![TypeScript](https://img.shields.io/badge/TypeScript-Strict-blue.svg?style=flat-square)](https://www.typescriptlang.org/)

`@stoatx/client` provides a robust object-oriented wrapper around Stoat's REST and WebSocket APIs. It features an intelligent caching system, automatic memory sweeping, and strict event typings to make building bots as frictionless as possible.

## Features

- **Strictly Typed:** 100% TypeScript with highly accurate generic types for events and structures.
- **Smart Caching:** Built on a unified `BaseManager` architecture that guarantees reference stability (no duplicate objects in memory).
- **Automatic Memory Management:** Includes a built-in `SweeperManager` to prevent memory leaks in long-running applications.
- **Extensible:** Designed to seamlessly integrate with higher-level command frameworks like the Stoatx Handler.
- **Modern Node:** Pure ESM and CommonJS support built with `tsup`.

## Installation

```bash
# Using pnpm (Recommended)
pnpm add @stoatx/client

# Using npm
npm install @stoatx/client

# Using yarn
yarn add @stoatx/client
```

## Quick Start

```typescript
import { Client } from "@stoatx/client";

// Initialize the client
const client = new Client({
  sweepers: {
    messages: {
      lifetime: 3600000, // 1 hour
      interval: 600000, // 10 minutes
    },
  },
});

// Listen to events
client.on("ready", async () => {
  const me = await client.users.fetchMe();
  console.log(`Logged in successfully as ${me.username}!`);
});

client.on("messageCreate", async (message) => {
  if (message.author.bot) return;

  if (message.content === "!ping") {
    await message.channel.send("Pong! 🏓");
  }
});

// Connect to Stoat
client.login("YOUR_BOT_TOKEN");
```

##️ Architecture & Managers

`@stoatx/client` organizes data using a predictable **Manager** hierarchy. Managers handle fetching, caching, and editing structures.

### Global Managers

Accessible directly on the `client`, managing data across the entire bot:

- `client.users` (Fetches and caches users)
- `client.servers` (Fetches and caches servers)
- `client.channels` (The global cache for all channel types)

### Scoped Managers

Accessible on specific structures (like `Server` or `Channel`), managing localized data:

- `server.members` (Manages members within a specific server)
- `server.roles` (Manages roles for a server)
- `server.channels` (A virtual manager filtering the global channel cache)
- `channel.messages` (Manages messages within a specific channel)

### Example: Editing a Server and Sending a Message

```typescript
// Fetch a server and edit its name
const server = await client.servers.fetch("SERVER_ID");
await server.edit({ name: "My Awesome Server" });

// Find a specific channel and send an embed
const channel = server.channels.cache.get("CHANNEL_ID");
if (channel && channel.isText()) {
  await channel.send({
    content: "Welcome to the new server!",
    embeds: [{ title: "Update", description: "Name changed successfully." }],
  });
}
```

## Building Command Handlers

While you can use `@stoatx/client` directly, it truly shines when paired with a command handler. Because the events are strictly typed using generics, you can easily build type-safe event registries.
We recommend using the `Stoatx` for a seamless experience, but you can also create your own custom command handler leveraging the client's event system.

```typescript
// Example of event listening
import type { ClientEvents } from "@stoatx/client";

function registerEvent<K ClientEvents extends keyof>(
  client: Client,
  event: K,
  handler: (...args: ClientEvents[K]) => void
) {
  client.on(event, handler);
}
```

## Contributing

Contributions are welcome! If you're using this library and find a bug or want to add a feature from the Revolt API, feel free to open a Pull Request.

1. Clone the repository.
2. Run `pnpm install`.
3. Make your changes in `packages/client`.
4. Run `pnpm build` to ensure `tsup` compiles your changes correctly.

## License

MIT © [Stoatx / Stoatx Team]
