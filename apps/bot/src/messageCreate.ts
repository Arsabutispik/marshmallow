import { Message, On, Stoat } from "stoatx";

@Stoat()
export class MessageCreateListener {
  @On("messageCreate")
  async onMessage(message: Message) {
    console.log("Received message:", message.content);
  }
}
