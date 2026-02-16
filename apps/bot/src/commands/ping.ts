import { Command, BaseCommand, Context } from "@marshmallow/mally";
//Unrelated message for testing purposes
@Command({
    description: "Replies with Pong!",
    name: "ping",
})
export class PingCommand extends BaseCommand {
    async run(ctx: Context) {
        await ctx.reply("Pong!");
    }
}
