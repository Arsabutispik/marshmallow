export class ServerInvite {
  public code: string;
  public creatorId: string;
  public channelId: string;

  constructor(data: any) {
    this.code = data._id ?? data.code;
    this.creatorId = data.creator;
    this.channelId = data.channel;
  }

  public _patch(data: any) {
    this.creatorId = data.creator ?? this.creatorId;
    this.channelId = data.channel ?? this.channelId;
  }
}
