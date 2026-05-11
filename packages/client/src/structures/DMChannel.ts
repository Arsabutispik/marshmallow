import { BaseChannel } from "./BaseChannel";

export class DMChannel extends BaseChannel {
  public active: boolean = false;
  public recipients: DMChannel[] = [];
  public lastMessageId: string | null = null;

  constructor(client: any, data: any) {
    super(client, data);
  }

  public _patch(data: any) {
    if (data.active !== undefined) this.active = data.active;
    if (data.recipients !== undefined) this.recipients = data.recipients;
    if (data.last_message_id !== undefined) this.lastMessageId = data.last_message_id;
  }
}
