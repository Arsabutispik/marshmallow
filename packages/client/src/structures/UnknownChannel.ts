import { BaseChannel } from "./BaseChannel";
import type { Client } from "../client/Client";

/**
 * A fallback class for channel types that are not yet officially supported by the library.
 */
export class UnknownChannel extends BaseChannel {
  constructor(client: Client, data: any) {
    super(client, data);
  }
}
