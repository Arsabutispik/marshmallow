export class ServerBan {
  public userId: string;
  public reason: string | null;

  constructor(data: any) {
    this.userId = data._id?.user ?? data.id;
    this.reason = data.reason ?? null;
  }

  public _patch(data: any) {
    if (data.reason !== undefined) this.reason = data.reason;
  }
}
