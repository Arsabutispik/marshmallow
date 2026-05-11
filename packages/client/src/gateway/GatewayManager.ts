import WebSocket from "ws";
import { Client } from "../client/Client";
import { Message } from "../structures/Message";
import { TextChannel } from "../structures/TextChannel";

export class GatewayManager {
  private ws: WebSocket | null = null;
  private pingInterval: NodeJS.Timeout | null = null;
  private token: string | null = null;

  constructor(private client: Client) {}

  public async connect(token: string): Promise<void> {
    this.token = token;
    this.client.emit("debug", "Connecting to Stoat Gateway...");

    const baseUrl = "wss://stoat.chat/events";
    const url = `${baseUrl}?version=1&format=json&token=${this.token}`;

    this.ws = new WebSocket(url);

    this.ws.on("open", () => {
      this.client.emit("debug", "WebSocket Opened. Starting ping loop...");
      this.startPingLoop();
    });

    this.ws.on("message", (data) => this.handleMessage(data));

    this.ws.on("close", (code , reason) => {
      this.client.emit("debug", `WebSocket closed: ${code} - ${reason.toString()}`);
      this.reconnect();
    });

    this.ws.on("error", (error) => {
      this.client.emit("error", error);
    });
  }

  private handleMessage(rawData: WebSocket.RawData) {
    const payload = JSON.parse(rawData.toString());
    const eventType = payload.type;

    switch (eventType) {
      case "Error":
        this.client.emit("error", new Error(`Gateway Error: ${payload.error || JSON.stringify(payload)}`));
        break;

      case "Authenticated":
        this.client.emit("debug", "Successfully authenticated with Stoat.");
        break;

      case "Ready": {
        if (payload.channels) {
          for (const rawChannel of payload.channels) {
            this.client.channels._add(rawChannel);
          }
        }

        if (payload.servers) {
          for (const rawServer of payload.servers) {
            this.client.servers._add(rawServer);
          }
        }

        if (payload.users) {
          for (const rawUser of payload.users) {
            this.client.users._add(rawUser);
          }
        }
        this.client.emit("ready", payload);
        break;
      }

      case "Message": {
        if (payload.user) this.client.users._add(payload.user);

        const channel = this.client.channels.cache.get(payload.channel);
        let message;

        if (channel) {
          message = channel.messages._add(payload);

          if ("serverId" in channel) {
            const serverId = (channel as TextChannel).serverId;
            const server = this.client.servers.cache.get(serverId);
            if (server && payload.member && payload.user) {
              server.members._add({ ...payload.member, user: payload.user });
            }
          }
        } else {
          message = new Message(this.client, payload);
        }

        this.client.emit("messageCreate", message);
        break;
      }

      case "MessageUpdate": {
        const channel = this.client.channels.cache.get(payload.channel);
        const existing = channel?.messages.cache.get(payload.id);

        if (existing) {
          const oldMessage = existing._clone();
          existing._patch(payload.data);
          this.client.emit("messageUpdate", oldMessage, existing);
        } else {
          const newMessage = new Message(this.client, { id: payload.id, channelId: payload.channel, ...payload.data });
          this.client.emit("messageUpdate", null, newMessage);
        }
        break;
      }

      case "MessageAppend": {
        const channel = this.client.channels.cache.get(payload.channel);
        const message = channel?.messages.cache.get(payload.id);

        if (message && payload.append.embeds) {
          const oldMessage = message._clone();
          message.embeds.push(...payload.append.embeds);
          this.client.emit("messageUpdate", oldMessage, message);
        }
        break;
      }

      case "MessageDelete": {
        const channel = this.client.channels.cache.get(payload.channel);

        let message;

        if (channel) {
          message = channel.messages.cache.get(payload.id);
          channel.messages.cache.delete(payload.id);
        }

        if (message) {
          this.client.emit("messageDelete", message);
        } else {
          this.client.emit("messageDelete", {id: payload.id, channelId: payload.channel});
        }

        break;
      }

      case "Pong":
        this.client.emit("debug", "Received Pong from server.");
        break;

      case "ChannelCreate": {
        const channel = this.client.channels._add(payload);

        this.client.emit("channelCreate", channel);
        break;
      }

      case "ChannelUpdate": {
        const existing = this.client.channels.cache.get(payload.id);

        if (existing) {
          const oldChannel = existing._clone();

          if ("_patch" in existing) {
            (existing as any)._patch(payload.data, payload.clear);
          }

          this.client.emit("channelUpdate", oldChannel, existing);
        } else {
          const newChannel = this.client.channels._add({ id: payload.id, ...payload.data });
          this.client.emit("channelUpdate", null, newChannel);
        }
        break;
      }

      case "ChannelDelete": {
        const channel = this.client.channels.cache.get(payload.id);
        if (channel) {
          this.client.channels.cache.delete(channel.id);
          this.client.emit("channelDelete", channel);
        }
        break;
      }

      case "ServerCreate": {
        const server = this.client.servers._add(payload);
        this.client.emit("serverCreate", server);
        break;
      }

      case "ServerUpdate": {
        const existing = this.client.servers.cache.get(payload.id);

        if (existing) {
          const oldServer = existing._clone();

          existing._patch(payload.data, payload.clear);

          this.client.emit("serverUpdate", oldServer, existing);
        } else {
          const newServer = this.client.servers._add({ id: payload.id, ...payload.data });
          this.client.emit("serverUpdate", null, newServer);
        }
        break;
      }

      case "ServerDelete": {
        const server = this.client.servers.cache.get(payload.id);
        if (server) {
          this.client.servers.cache.delete(payload.id);
          this.client.emit("serverDelete", server);
        } else {
          this.client.emit("serverDelete", payload.id);
        }
        break;
      }

      case "ServerMemberJoin": {
        const server = this.client.servers.cache.get(payload.id);
        if (server) {
          const member = server.members._add({ user: payload.user });
          this.client.emit("serverMemberJoin", member);
        }
        break;
      }

      case "ServerMemberLeave": {
        const server = this.client.servers.cache.get(payload.id);
        if (server) {
          const member = server.members.cache.get(payload.user);
          if (member) {
            server.members.cache.delete(payload.user);
            this.client.emit("serverMemberLeave", member);
          }
        }
        break;
      }

      case "UserUpdate": {
        const existing = this.client.users.cache.get(payload.id);
        if (existing) {
          const oldUser = existing._clone();
          existing._patch(payload.data, payload.clear);
          this.client.emit("userUpdate", oldUser, existing);
        }
        break;
      }

      default:
        this.client.emit("raw", payload);
    }
  }

  private startPingLoop() {
    if (this.pingInterval) clearInterval(this.pingInterval);

    this.pingInterval = setInterval(() => {
      this.client.emit("debug", "Sending Ping...");
      this.send({ type: "Ping", data: Date.now() });
    }, 20000);
  }

  private send(payload: any) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(payload));
    }
  }

  private reconnect() {
    this.client.emit("debug", "Attempting to reconnect in 5 seconds...");

    if (!this.token) {
      return this.client.emit("error", new Error("RECONNECT_FAILED: No token available."));
    }

    if (this.pingInterval) clearInterval(this.pingInterval);

    setTimeout(() => {
      void this.connect(this.token!);
    }, 5000);
  }
}
