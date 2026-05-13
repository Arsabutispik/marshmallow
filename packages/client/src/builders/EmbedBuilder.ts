export interface TextEmbedData {
  type: "Text";
  title?: string;
  description?: string;
  url?: string;
  icon_url?: string;
  colour?: string;
  media?: string;
}

export class EmbedBuilder {
  private data: TextEmbedData;

  constructor(data: Partial<TextEmbedData> = {}) {
    this.data = { type: "Text", ...data };
  }

  public setTitle(title: string): this {
    this.data.title = title;
    return this;
  }

  public setDescription(description: string): this {
    this.data.description = description;
    return this;
  }

  public setUrl(url: string): this {
    this.data.url = url;
    return this;
  }

  public setIconUrl(iconUrl: string): this {
    this.data.icon_url = iconUrl;
    return this;
  }

  public setColor(color: string): this {
    this.data.colour = color;
    return this;
  }

  public setMedia(fileId: string): this {
    this.data.media = fileId;
    return this;
  }

  /**
   * Serializes the builder into the raw JSON required by the API
   */
  public toJSON(): TextEmbedData {
    return { ...this.data };
  }
}
