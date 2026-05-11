import { env } from "./env.js";
import { Client, EmbedBuilder } from "@stoatx/client";
import * as fs from "fs";

const client = new Client();

client.on("ready", async () => {
  console.log("Client ready");
});

client.on("messageCreate", async (message) => {
  if (message.content === "!ping") {
    const embed = new EmbedBuilder().setTitle("Test").setColor("#FF0000").setDescription("This is a test embed");

    const buffer = fs.readFileSync("./a.jpg");
    const fileId = await client.rest.uploadFile("a.jpg", buffer);

    await message.reply({ content: "pong", embeds: [embed], attachments: [fileId] });
  }
});

client.on("messageDelete", async (message) => {
  console.log(message);
});

void client.login(env.BOT_TOKEN);
