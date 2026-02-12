import { Client, Message } from "stoat.js";
import { MallyHandler } from "@marshmallow/mally";
import type { MessageAdapter } from "@marshmallow/mally";
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { env } from './env.js';
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const client = new Client();

// Define the message adapter for stoat.js once
const stoatAdapter: MessageAdapter<Message> = {
  getContent: (msg: Message) => msg.content,
  getAuthorId: (msg: Message) => msg.author!.id,
  getChannelId: (msg: Message) => msg.channel!.id,
  getServerId: (msg: Message) => msg.server?.id,
  createReply: (msg: Message) => async (content: string) => { await msg.channel!.sendMessage(content); },
  shouldProcess: (msg: Message) => !!msg.channel && !!msg.author,
};

const handler = new MallyHandler<Client, Message>({
  client,
  commandsDir: join(__dirname, 'commands'),
  prefix: "!",
  owners: [env.OWNER_ID],
  messageAdapter: stoatAdapter,
});
await handler.init()
client.on("ready", async () => {
    if (client.user) {
        console.info(`Logged in as ${client.user.username}!`);
    }
});

client.on("messageCreate", async (message) => {
  await handler.handle(message);
});
void client.loginBot(env.BOT_TOKEN);