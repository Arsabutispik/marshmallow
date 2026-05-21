import { Base } from "./Base";
import type { Client } from "../client/Client";

export type AttachmentMetadata =
  | { type: "File" }
  | { type: "Text" }
  | { type: "Audio" }
  | { type: "Image"; width: number; height: number; thumbhash?: number[]; animated?: boolean }
  | { type: "Video"; width: number; height: number };

export class Attachment extends Base {
  public override id: string;
  public tag: string;
  public filename: string;
  public metadata: AttachmentMetadata;
  public contentType: string;
  public size: number;

  public deleted?: boolean;
  public reported?: boolean;
  public messageId?: string;
  public userId?: string;
  public serverId?: string;
  public objectId?: string;

  constructor(client: Client, data: any) {
    super(client, { ...data, id: data._id });

    this.id = data._id;
    this.tag = data.tag;
    this.filename = data.filename;
    this.metadata = data.metadata ?? { type: "File" };
    this.contentType = data.content_type;
    this.size = data.size;

    this.deleted = data.deleted ?? false;
    this.reported = data.reported ?? false;
    this.messageId = data.message_id;
    this.userId = data.user_id;
    this.serverId = data.server_id;
    this.objectId = data.object_id;
  }

  /**
   * Automatically constructs the direct CDN URL for this file
   */
  public get url(): string {
    // Standard Autumn CDN format: cdn.domain.com/tag/id/filename
    return `https://cdn.stoatusercontent.com/${this.tag}/${this.id}/${this.filename}`;
  }

  /**
   * Helper boolean to quickly check if it's an image
   */
  public get isImage(): boolean {
    return this.metadata.type === "Image";
  }
}
