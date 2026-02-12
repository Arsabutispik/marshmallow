import { Command, BaseCommand, Context } from "@marshmallow/mally";

@Command({
    description: "Replies with Pong!",
    name: "ping",
})
export class PingCommand extends BaseCommand {
    async run(ctx: Context) {
        await ctx.reply("Pong!");
    }
}