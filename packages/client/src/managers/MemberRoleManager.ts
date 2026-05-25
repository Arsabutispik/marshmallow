import type { Member } from "../structures/Member";
import type { Role } from "../structures/Role";
import { Collection } from "../utils/Collection";
import type { RoleResolvable } from "./RoleManager";

export class MemberRoleManager {
  public member: Member;
  constructor(member: Member) {
    this.member = member;
  }

  /**
   * Gets a Collection of the actual Role objects this member has.
   * This dynamically pulls from the Server's role cache so references are always up to date
   */
  public get cache(): Collection<string, Role> {
    const fetched = new Collection<string, Role>();
    const server = this.member.server;

    if (!server) return fetched;

    for (const roleId of this.member.roleIds) {
      const role = server.roles.cache.get(roleId);
      if (role) fetched.set(role.id, role);
    }

    return fetched;
  }

  /**
   * Checks if the member has a specific role.
   * @param role The RoleResolvable to check for.
   */
  public has(role: RoleResolvable): boolean {
    const server = this.member.server;
    if (!server) return false;

    const id = server.roles.resolveId(role);
    return this.member.roleIds.includes(id);
  }

  /**
   * Adds a role to the member.
   * @param role The RoleResolvable to add.
   * @returns A promise that resolves to the updated Member.
   */
  public async add(role: RoleResolvable): Promise<Member> {
    const server = this.member.server;
    if (!server) throw new Error("Server not cached, cannot add role.");

    const id = server.roles.resolveId(role);

    if (this.member.roleIds.includes(id)) return this.member;

    const newRoles = [...this.member.roleIds, id];

    return this.member.edit({ roles: newRoles });
  }

  /**
   * Removes a role from the member.
   * @param role The RoleResolvable to remove.
   * @returns A promise that resolves to the updated Member.
   */
  public async remove(role: RoleResolvable): Promise<Member> {
    const server = this.member.server;
    if (!server) throw new Error("Server not cached, cannot remove role.");

    const id = server.roles.resolveId(role);

    if (!this.member.roleIds.includes(id)) return this.member;

    const newRoles = this.member.roleIds.filter((rId) => rId !== id);

    return this.member.edit({ roles: newRoles });
  }

  /**
   * Overwrites all roles on the member with a completely new array.
   * @param roles An array of RoleResolvables.
   * @returns A promise that resolves to the updated Member.
   */
  public async set(roles: RoleResolvable[]): Promise<Member> {
    const server = this.member.server;
    if (!server) throw new Error("Server not cached, cannot set roles.");

    const newRoles = roles.map((r) => server.roles.resolveId(r));

    return this.member.edit({ roles: newRoles });
  }
}
