import { env } from "./env.js";
import { Client, CommandContext, CommandMetadata, CooldownManager, DefaultCooldownManager } from "stoatx";

// I couldn't be bothered setting up a database just for this
const slowmodes = new Map<string, number>();

class MixedCooldownManager implements CooldownManager {
  private memory = new DefaultCooldownManager();

  async check(ctx: CommandContext, metadata: CommandMetadata): Promise<boolean> {
    if (metadata.cooldownStorage === "database") {
      console.log(`Checking cooldown for ${ctx.message.author?.id} on command ${metadata.name} using database storage`);
      // Check cooldown from DB
      const key = `${ctx.message.author?.id}:${metadata.name}`;
      const expiresAt = slowmodes.get(key);
      if (expiresAt && expiresAt > Date.now()) {
        return false; // Still on cooldown
      }
      return true; // Not on cooldown
    }
    return this.memory.check(ctx, metadata);
  }

  async getRemaining(ctx: CommandContext, metadata: CommandMetadata): Promise<number> {
    if (metadata.cooldownStorage === "database") {
      const key = `${ctx.message.author?.id}:${metadata.name}`;
      const expiresAt = slowmodes.get(key);
      if (expiresAt) {
        return Math.max(0, expiresAt - Date.now());
      }
      return 0;
    }
    return this.memory.getRemaining(ctx, metadata);
  }

  async set(ctx: CommandContext, metadata: CommandMetadata): Promise<void> {
    if (metadata.cooldownStorage === "database") {
      const key = `${ctx.message.author?.id}:${metadata.name}`;
      const expiresAt = Date.now() + metadata.cooldown * 1000;
      slowmodes.set(key, expiresAt);
      return;
    }
    this.memory.set(ctx, metadata);
  }
}

const client = new Client({
  prefix: "!",
  cooldownManager: new MixedCooldownManager(),
});
async function main() {
  await client.initCommands();
}

client.on("messageDelete", async (message) => {
  console.log(message);
});
client.on("error", (err) => {
  console.error(err);
});
void main();

void client.login(env.BOT_TOKEN);
