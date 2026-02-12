import {Command} from "@marshmallow/mally";
import {CommandContext, CommandMetadata, MallyCommand} from "@marshmallow/mally";

@Command({
    description: "Replies with Pong!",
    name: "ping",
})
export class PingCommand implements MallyCommand {
    metadata!: CommandMetadata;

    async run(ctx: CommandContext) {
        throw new Error("Test");
        //await ctx.reply("Pong!");
    }
    async onError(ctx: CommandContext, error: Error) {
        await ctx.reply("An error happened " + error.message)
    }
}