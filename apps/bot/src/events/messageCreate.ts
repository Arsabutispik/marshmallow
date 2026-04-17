import { On, Stoat } from "stoatx";
import { Message } from "stoat.js";

@Stoat()
export class MessageCreate {
  @On("messageCreate")
  async onMessageCreate(message: Message) {
    if (message.author?.bot) return;
    if (message.content.toLowerCase() === "hello") {
      await message.reply("Hello there!");
    }
  }
}
