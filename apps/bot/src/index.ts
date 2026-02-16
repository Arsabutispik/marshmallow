import {Client} from "stoat.js";
import {MallyHandler} from "@marshmallow/mally";
import {fileURLToPath} from 'url';
import {dirname, join} from 'path';
import {env} from './env.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const client = new Client();

const handler = new MallyHandler({
  client,
  commandsDir: join(__dirname, 'commands'),
  prefix: "!",
  owners: [env.OWNER_ID],
});
await handler.init()
client.on("ready", async () => {
    if (client.user) {
        console.info(`Logged in as ${client.user.username}!`);
    }
});

client.on("messageCreate", async (message) => {
    console.log("Received message:", message.content);
  await handler.handle(message);
});
void client.loginBot(env.BOT_TOKEN);