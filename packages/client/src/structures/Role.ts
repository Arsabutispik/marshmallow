import { Base } from "./Base";
import type { Client } from "../client/Client";
import type { Server } from "./Server";
import * as util from "node:util";
import { Permissions, type PermissionResolvable } from "../utils/permissions";
import type { RoleEditOptions, RolePermissionOptions } from "../managers/RoleManager";

export class Role extends Base {
  public serverId: string;
  public name!: string;
  public color: string | null = null;
  public hoist: boolean = false;
  public rank: number = 0;
  public permissions: bigint = 0n;

  constructor(client: Client, data: any, serverId: string) {
    super(client, data);
    this.serverId = serverId;
    this._patch(data);
  }

  /**
   * Updates the role instance with new data without losing the object reference.
   * @internal
   */
  public _patch(data: any) {
    if (data.name !== undefined) this.name = data.name;
    if (data.color !== undefined) this.color = data.color;
    if (data.hoist !== undefined) this.hoist = data.hoist;
    if (data.rank !== undefined) this.rank = data.rank;
    if (data.permissions !== undefined) {
      try {
        if (typeof data.permissions === "object" && data.permissions !== null) {
          const allowPerms = data.permissions.a ?? data.permissions[0] ?? 0;
          this.permissions = BigInt(allowPerms);
        } else {
          this.permissions = BigInt(data.permissions);
        }
      } catch {
        this.permissions = 0n;
      }
    }
  }

  /**
   * The server this role belongs to.
   * Pulls dynamically from the cache to prevent massive memory duplication.
   */
  public get server(): Server | undefined {
    return this.client.servers.cache.get(this.serverId);
  }

  /**
   * Checks whether this role has a specific permission.
   * @param permission The permission to check for.
   * @returns True if the role has the permission.
   */
  public hasPermission(permission: PermissionResolvable): boolean {
    return Permissions.has(this.permissions, permission);
  }

  /**
   * Fetches this role directly from the API to ensure data is up to date.
   * @param force Whether to skip the cache check and force a direct API request. Defaults to false.
   * @returns A promise that resolves to the fetched Role object.
   * @throws {TypeError} If an invalid RoleResolvable is provided.
   * @throws {Error} If the API request fails (e.g., the role does not exist).
   * @example
   * // Refresh the role's data from the API
   * await role.fetch();
   * console.log(`Role updated, current name: ${role.name}`);
   */
  public async fetch(force: boolean = true): Promise<this> {
    let server = this.server;

    if (!server) {
      server = await this.client.servers.fetch(this.serverId);
    }

    return (await server.roles.fetch(this.id, force)) as this;
  }

  /**
   * Edits the role with the given options. Only the fields provided in the options will be updated; all other fields will remain unchanged.
   * @param options The fields to update.
   * @returns A promise that resolves to the updated Role.
   * @throws {TypeError} If invalid options or RoleResolvable are provided.
   * @throws {Error} If the API request fails (e.g., lack of permissions).
   * @example
   * // Change the role's name and color
   * await role.edit({ name: "Senior Admin", colour: "#FFD700" });
   *
   * // Remove the custom color from the role
   * await role.edit({ colour: null });
   */
  public async edit(options: RoleEditOptions): Promise<this> {
    let server = this.server;
    if (!server) server = await this.client.servers.fetch(this.serverId);

    return (await server.roles.edit(this.id, options)) as this;
  }

  /**
   * Deletes this Role from the server.
   * @throws {Error} If the role cannot be deleted (e.g., lack of permissions).
   * @example
   * // Delete a role by its ID
   * await role.delete();
   */
  public async delete(): Promise<void> {
    let server = this.server;

    if (!server) {
      server = await this.client.servers.fetch(this.serverId);
    }

    await server.roles.delete(this.id);
  }

  /**
   * Updates the permissions for this role.
   * @param options The allow and deny permissions to set.
   * @returns A promise that resolves to the updated Role object.
   * @throws {TypeError} If invalid options are provided.
   * @throws {Error} If the API request fails.
   * @example
   * // Grant the role permission to manage channels and send messages
   * await role.setPermissions({
   *   allow: ["ManageChannel", "SendMessage"]
   * });
   */
  public async setPermissions(options: RolePermissionOptions): Promise<this> {
    let server = this.server;
    if (!server) server = await this.client.servers.fetch(this.serverId);

    return (await server.roles.setPermissions(this.id, options)) as this;
  }

  /**
   * Updates the hierarchical position of this role.
   * Automatically reconstructs the role array and performs a bulk update.
   * @param newPosition The new rank/position for this role (0-indexed).
   * @returns A promise that resolves to this updated Role object.
   * @throws {Error} If API request fails.
   * @example
   * // Move this role to position 2 in the hierarchy
   * await role.setPosition(2);
   * console.log(`Role moved to rank: ${role.rank}`);
   */
  public async setPosition(newPosition: number): Promise<this> {
    let server = this.server;
    if (!server) server = await this.client.servers.fetch(this.serverId);

    const sortedRoles = Array.from(server.roles.cache.values()).sort((a, b) => a.rank - b.rank);

    const filteredRoles = sortedRoles.filter((r) => r.id !== this.id);

    const clampedPosition = Math.max(0, Math.min(newPosition, filteredRoles.length));

    filteredRoles.splice(clampedPosition, 0, this);

    await server.roles.setRanks(filteredRoles);

    return this;
  }

  /**
   * Customizer for Node.js `console.log` and `util.inspect`.
   * Hides the cyclic client reference and raw serverId for a cleaner output.
   * @internal
   */
  [util.inspect.custom]() {
    const { client, serverId, ...props } = this;
    return `${this.constructor.name} ${util.inspect(props)}`;
  }
}
