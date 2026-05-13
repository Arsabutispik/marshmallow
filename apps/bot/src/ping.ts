import { type CommandContext, SimpleCommand, Stoat } from "stoatx";

@Stoat()
export class PingCommand {
  @SimpleCommand({
    description: "Replies with Pong! and the bot's latency.",
    aliases: ["p"],
  })
  async ping(ctx: CommandContext) {
    const reply = await ctx.message.reply("Calculating Ping...");
    const latency = reply.createdAt!.getTime() - ctx.message.createdAt!.getTime();
    await reply.edit(`Pong! Latency: ${latency}ms`);
  }
}
