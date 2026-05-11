import { request } from "undici";
import { Client } from "../client/Client";

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Represents an independent rate limit bucket queue
 */
class AsyncBucket {
  public remaining: number = 1;
  public resetAt: number = 0;
  public queue: Promise<void> = Promise.resolve();
}

export class RESTManager {
  private baseURL = "https://stoat.chat/api";

  private token: string | null = null;

  private buckets = new Map<string, AsyncBucket>();

  constructor(private client: Client) {}

  public setToken(token: string) {
    this.token = token;
  }

  /**
   * Generates a local identifier for the bucket based on method and path.
   */
  private getRouteKey(method: string, endpoint: string): string {
    return `${method}:${endpoint}`;
  }

  public makeRequest(method: string, endpoint: string, body?: any): Promise<any> {
    const routeKey = this.getRouteKey(method, endpoint);

    let bucket = this.buckets.get(routeKey);
    if (!bucket) {
      bucket = new AsyncBucket();
      this.buckets.set(routeKey, bucket);
    }

    return new Promise((resolve, reject) => {
      bucket!.queue = bucket!.queue.then(async () => {
        try {
          const result = await this.execute(method, endpoint, body, bucket!);
          resolve(result);
        } catch (error) {
          reject(error);
        }
      });
    });
  }

  private async execute(method: string, endpoint: string, body: any, bucket: AsyncBucket): Promise<any> {
    if (!this.token) {
      throw new Error("REST_NOT_READY: You must call client.login() before making API requests.");
    }
    const url = `${this.baseURL}${endpoint}`;

    if (bucket.remaining <= 0 && Date.now() < bucket.resetAt) {
      const waitTime = bucket.resetAt - Date.now();
      this.client.emit("debug", `Bucket [${method}:${endpoint}] exhausted. Waiting ${waitTime}ms proactively...`);
      await sleep(waitTime);
    }

    const options = {
      method: method as any,
      headers: {
        "X-Bot-Token": this.token,
        "Content-Type": "application/json",
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
    };
    const response = await request(url, options);

    const remainingHeader = response.headers["x-ratelimit-remaining"];
    const resetAfterHeader = response.headers["x-ratelimit-reset-after"];

    if (remainingHeader !== undefined && resetAfterHeader !== undefined) {
      bucket.remaining = Number(remainingHeader);
      bucket.resetAt = Date.now() + Number(resetAfterHeader);
    }

    if (response.statusCode === 429) {
      const data = (await response.body.json()) as { retry_after: number };

      const retryMs = data.retry_after || Number(resetAfterHeader) || 5000;

      this.client.emit("debug", `Hit 429 on [${method}:${endpoint}]. Retrying in ${retryMs}ms.`);

      bucket.remaining = 0;
      bucket.resetAt = Date.now() + retryMs;

      await sleep(retryMs);

      return this.execute(method, endpoint, body, bucket);
    }

    const data = await response.body.json();

    if (response.statusCode >= 400) {
      let errorMessage = "Unknown Error";
      if (typeof data === "object" && data !== null && "message" in data) {
        errorMessage = String((data as { message: string }).message);
      }
      throw new Error(`[Stoat API Error ${response.statusCode}]: ${errorMessage}`);
    }

    return data as any;
  }

  /**
   * Uploads a file to Stoat's CDN and returns the File ID
   */
  public async uploadFile(filename: string, fileBuffer: Buffer | Blob): Promise<string> {
    if (!this.token) throw new Error("REST_NOT_READY: No token available.");

    const url = "https://cdn.stoatusercontent.com/attachments";

    const formData = new FormData();
    formData.append("file", new Blob([fileBuffer]), filename);

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "X-Bot-Token": this.token,
      },
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Upload failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json() as {"id": string};

    return data.id;
  }

  public get(endpoint: string) {
    return this.makeRequest("GET", endpoint);
  }
  public post(endpoint: string, body: any) {
    return this.makeRequest("POST", endpoint, body);
  }
  public patch(endpoint: string, body: any) {
    return this.makeRequest("PATCH", endpoint, body);
  }
  public delete(endpoint: string) {
    return this.makeRequest("DELETE", endpoint);
  }
}
