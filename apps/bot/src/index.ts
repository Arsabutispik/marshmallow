import { Client } from "stoat.js";
import { MallyHandler } from "stoatx";
import { env } from "./env.js";
const client = new Client();

const handler = new MallyHandler({
  client,
  prefix: "!",
  owners: [env.OWNER_ID],
});
await handler.init();
client.on("ready", async () => {
  if (client.user) {
    console.info(`Logged in as ${client.user.username}!`);
  }
});

client.on("messageCreate", async (message) => {
  await handler.handle(message);
});
void client.loginBot(env.BOT_TOKEN);
