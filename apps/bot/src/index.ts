import { env } from "./env.js";
import { Client } from "stoatx";

const client = new Client({
  prefix: "!",
});
async function main() {
  await client.initCommands();
}

client.on("messageDelete", async (message) => {
  console.log(message);
});
client.on("error", (err) => {
  console.error(err);
});
void main();

void client.login(env.BOT_TOKEN);
