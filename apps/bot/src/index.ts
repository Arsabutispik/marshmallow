import { env } from "./env.js";
import { Client } from "stoatx";

const client = new Client({
  prefix: "!",
  owners: [env.OWNER_ID],
  extensions: [".ts"],
});

client.on("ready", async () => {
  if (client.user) {
    console.info(`Logged in as ${client.user.username}!`);
  }
});

async function main() {
  await client.initCommands();
  await client.loginBot(env.BOT_TOKEN);
}

void main();
