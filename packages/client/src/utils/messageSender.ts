import { Message, MessageOptions } from "../structures/Message";
import { Client } from "../client/Client";

export async function sendMessage(client: Client, channelId: string, data: string | MessageOptions): Promise<Message> {
  const payload = typeof data === "string" ? { content: data } : data;

  if (!payload.content && (!payload.embeds || payload.embeds.length === 0)) {
    throw new Error("Cannot send an empty message.");
  }

  const response = await client.rest.post(`/channels/${channelId}/messages`, payload);
  return new Message(client, response);
}
