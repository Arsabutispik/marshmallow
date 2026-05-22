# Stoatx

A high-performance, fully-typed, and memory-efficient toolkit for building bots on the Stoat platform.

The Stoatx ecosystem is designed with flexibility in mind. Whether you prefer a highly organized, decorator-based framework inspired by `discordx`, or a lean, object-oriented client wrapper inspired by `discord.js`, Stoatx provides the tools you need to scale.

---

## 🏗️ Project Structure

This repository is a monorepo managed using modern Node tooling. It contains both the core libraries and example applications.

* **`apps/bot`** —  A sample bot built using the `stoatx` command handler and `@stoatx/client`. This serves as mostly testing ground for new features and a reference implementation for users.
* **`apps/docs`** — Documentation site for the Stoatx ecosystem.
* **`packages/client`** (`@stoatx/client`) — The core REST and WebSocket API wrapper.
* **`packages/handler`** (`stoatx`) — The decorator-based command framework.

---

## 📦 Ecosystem Packages

Stoatx is split into two primary packages to give developers control over their architecture.

### 1. The Command Handler (`stoatx`)

A powerful, decorator-based framework for organizing commands, guards, and events. If you want to build a large bot with cleanly separated concerns, this is the recommended approach.

**Key Features:**

* **Decorators:** Use `@Stoat()` to group commands and `@SimpleCommand()` to define them.
* **Middleware/Guards:** Easily implement permission checks and cooldowns using `@Guard()`.
* **Auto-Discovery:** Automatically scans and registers your command files, saving you from maintaining massive import lists.
* **Dynamic Prefixes:** Support for async, per-server prefix resolution.

**Quick Example:**

```typescript
import { Stoat, SimpleCommand, Context } from "stoatx";

@Stoat()
export class GeneralCommands {
  @SimpleCommand({ name: "ping", description: "Check bot latency" })
  async ping(ctx: Context) {
    await ctx.reply(`Pong! 🏓`);
  }
}

```

### 2. The Core Client (`@stoatx/client`)

A robust object-oriented wrapper around the Stoat APIs. It powers the `stoatx` handler, but can be used entirely standalone if you prefer writing your own command logic.

**Key Features:**

* **Smart Caching:** Built on a `BaseManager` architecture guaranteeing reference stability (no duplicate objects in memory).
* **Memory Management:** Built-in `SweeperManager` prevents memory leaks in long-running applications by cleaning up old messages and unused caches.
* **Strictly Typed:** Highly accurate generic types for all events and data structures.

**Quick Example:**

```typescript
import { Client } from "@stoatx/client";

const client = new Client({
  sweepers: {
    messages: { lifetime: 3600000, interval: 600000 },
  },
});

client.on("messageCreate", async (message) => {
  if (message.content === "!ping" && !message.author.bot) {
    await message.channel.send("Pong! 🏓");
  }
});

client.login("YOUR_BOT_TOKEN");

```

---

## 🚀 Getting Started

### Installation

Depending on your preferred architecture, install the necessary packages:

**For the full framework experience:**

```bash
pnpm add stoatx @stoatx/client reflect-metadata

```

*(Note: Be sure to enable `experimentalDecorators` and `emitDecoratorMetadata` in your `tsconfig.json`)*

**For the raw client only:**

```bash
pnpm add @stoatx/client

```

---

## 🤝 Contributing

Contributions to the Stoatx ecosystem are highly encouraged! Whether you are fixing bugs in the client, adding new features to the handler, or improving the documentation:

1. Clone this repository.
2. Run `pnpm install` at the root.
3. Make your changes within the respective `packages/*` or `apps/*` directory.
4. Run `pnpm build` to ensure `tsup` compiles your changes successfully.
5. Submit a Pull Request.

---

## 📄 License

Because this is a monorepo containing multiple distinct tools, **packages in this repository are licensed individually.**

* Core Client (`@stoatx/client`): MIT License
* Command Handler (`stoatx`): MIT License

Please check the `LICENSE` file within each specific package directory for exact details.