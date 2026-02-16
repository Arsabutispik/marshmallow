import {BaseCommand, Command, Context} from "@marshmallow/mally";

@Command({
    description: "Replies with Pong!",
    name: "ping",
})
export class PingCommand extends BaseCommand {
    async run(ctx: Context) {
        await ctx.reply( `Pong! Latency: ${Date.now() - ctx.message.createdAt.getTime()}ms` );
    }
}
