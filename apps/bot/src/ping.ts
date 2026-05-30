import { type CommandContext, SimpleCommand, Stoat, StoatLifecycle } from "stoatx";

@Stoat()
export class PingCommand implements StoatLifecycle {
  @SimpleCommand({
    description: "Replies with Pong! and the bot's latency.",
    aliases: ["p"],
    cooldown: 10,
    cooldownStorage: "database",
  })
  async ping(ctx: CommandContext) {
    const reply = await ctx.message.reply("Calculating Ping...");
    const latency = reply.createdAt!.getTime() - ctx.message.createdAt!.getTime();
    await reply.edit(`Pong! Latency: ${latency}ms`);
  }
}
