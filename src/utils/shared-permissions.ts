/**
 * Shared Repository Permissions
 * Manage shared repository access across team
 */

export interface RepositoryPermission {
  repository: string;
  userId: string;
  account: string;
  permission: 'read' | 'write' | 'admin';
  grantedAt: string;
  grantedBy: string;
}

export const sharedPermissions = {
  permissions: new Map<string, RepositoryPermission[]>(),

  /**
   * Grant permission
   */
  grantPermission(
    repository: string,
    userId: string,
    account: string,
    permission: RepositoryPermission['permission'],
    grantedBy: string
  ): RepositoryPermission {
    const perm: RepositoryPermission = {
      repository,
      userId,
      account,
      permission,
      grantedAt: new Date().toISOString(),
      grantedBy,
    };

    const repoPerms = this.permissions.get(repository) || [];
    repoPerms.push(perm);
    this.permissions.set(repository, repoPerms);

    return perm;
  },

  /**
   * Revoke permission
   */
  revokePermission(repository: string, userId: string): boolean {
    const repoPerms = this.permissions.get(repository);
    if (!repoPerms) return false;

    const index = repoPerms.findIndex(p => p.userId === userId);
    if (index === -1) return false;

    repoPerms.splice(index, 1);
    return true;
  },

  /**
   * Get permissions for repository
   */
  getRepositoryPermissions(repository: string): RepositoryPermission[] {
    return this.permissions.get(repository) || [];
  },

  /**
   * Get user permissions
   */
  getUserPermissions(userId: string): RepositoryPermission[] {
    const all: RepositoryPermission[] = [];
    for (const perms of this.permissions.values()) {
      all.push(...perms.filter(p => p.userId === userId));
    }
    return all;
  },

  /**
   * Check if user has permission
   */
  hasPermission(
    repository: string,
    userId: string,
    requiredPermission: RepositoryPermission['permission']
  ): boolean {
    const perms = this.permissions.get(repository);
    if (!perms) return false;

    const userPerm = perms.find(p => p.userId === userId);
    if (!userPerm) return false;

    const levels = { read: 1, write: 2, admin: 3 };
    return levels[userPerm.permission] >= levels[requiredPermission];
  },

  /**
   * Transfer ownership
   */
  transferOwnership(repository: string, newOwner: string): boolean {
    const perms = this.permissions.get(repository);
    if (!perms) return false;

    const adminPerm = perms.find(p => p.permission === 'admin');
    if (adminPerm) {
      adminPerm.userId = newOwner;
      adminPerm.grantedAt = new Date().toISOString();
    }

    return true;
  },

  /**
   * List shared repositories
   */
  listSharedRepositories(): string[] {
    return Array.from(this.permissions.keys());
  },
};