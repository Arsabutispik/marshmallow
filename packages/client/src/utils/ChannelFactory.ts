import { TextChannel } from "../structures/TextChannel";
import { BaseChannel, ChannelType } from "../structures/BaseChannel";
import type { Client } from "../client/Client";
import { UnknownChannel } from "../structures/UnknownChannel";
import { DMChannel } from "../structures/DMChannel";

export function createChannel(client: Client, data: any): BaseChannel {
  switch (data.channel_type) {
    case ChannelType.TEXT:
      return new TextChannel(client, data);
    case ChannelType.DM:
      return new DMChannel(client, data);
    default:
      client.emit("debug", `Received unknown channel type: ${data.type}`);
      return new UnknownChannel(client, data);
  }
}
