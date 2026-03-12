/**
 * Role-Based Access Control
 */

export interface Role {
  name: string;
  permissions: string[];
}

export interface User {
  id: string;
  name: string;
  role: string;
}

export const rbacManager = {
  roles: {
    admin: { name: 'admin', permissions: ['read', 'write', 'delete', 'manage'] },
    developer: { name: 'developer', permissions: ['read', 'write'] },
    viewer: { name: 'viewer', permissions: ['read'] },
  } as Record<string, Role>,

  hasPermission(role: string, permission: string): boolean {
    const r = this.roles[role];
    return r ? r.permissions.includes(permission) : false;
  },

  getRole(name: string): Role | null {
    return this.roles[name] || null;
  },

  listRoles(): Role[] {
    return Object.values(this.roles);
  },

  addRole(name: string, permissions: string[]): void {
    this.roles[name] = { name, permissions };
  },
};