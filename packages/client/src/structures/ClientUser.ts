import { User } from "./User";
import type { Client } from "../client/Client";

/**
 * Represents the authenticated bot's user object.
 */
export class ClientUser extends User {
  constructor(client: Client, data: any) {
    super(client, data);
  }
}
