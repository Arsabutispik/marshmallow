import {Context, SimpleCommand, Stoat} from "@marshmallow/mally";

@Stoat()
export class GeneralCommands {
    @SimpleCommand({ name: 'ping', description: 'Replies with Pong!' })
    async ping(ctx: Context) {
        await ctx.reply(`Pong! Latency: ${Date.now() - ctx.message.createdAt.getTime()}ms`);
    }
}
