/**
 * Worktree Support for GitConnect
 * Manage git worktrees with account-specific configurations
 */

import { execSync } from 'child_process';
import * as path from 'path';
import * as fs from 'fs';

export interface WorktreeInfo {
  path: string;
  branch: string;
  commit: string;
  isMain: boolean;
  account?: string;
}

export const worktreeManager = {
  /**
   * List all worktrees
   */
  listWorktrees(): WorktreeInfo[] {
    try {
      const output = execSync('git worktree list --porcelain', { encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'] });
      const worktrees: WorktreeInfo[] = [];
      const lines = output.trim().split('\n');

      let current: Partial<WorktreeInfo> = {};

      for (const line of lines) {
        if (line.startsWith('worktree ')) {
          if (current.path) {
            worktrees.push(this.finalizeWorktree(current));
          }
          current = { path: line.substring(9), isMain: worktrees.length === 0 };
        } else if (line.startsWith('HEAD ')) {
          current.commit = line.substring(5);
        } else if (line.startsWith('branch ')) {
          current.branch = line.substring(7);
        }
      }

      if (current.path) {
        worktrees.push(this.finalizeWorktree(current));
      }

      return worktrees;
    } catch {
      return [];
    }
  },

  /**
   * Finalize worktree info with account detection
   */
  finalizeWorktree(info: Partial<WorktreeInfo>): WorktreeInfo {
    const worktree: WorktreeInfo = {
      path: info.path || '',
      branch: info.branch || 'detached',
      commit: info.commit || '',
      isMain: info.isMain || false,
    };

    // Try to detect account from worktree config
    try {
      const configPath = path.join(info.path || '', '.gitconnect');
      if (fs.existsSync(configPath)) {
        const config = JSON.parse(fs.readFileSync(path.join(configPath, 'project.json'), 'utf-8'));
        worktree.account = config.account;
      }
    } catch {
      // No config found
    }

    return worktree;
  },

  /**
   * Create a new worktree with account binding
   */
  createWorktree(branch: string, targetPath: string, account?: string): boolean {
    try {
      // Create worktree
      execSync(`git worktree add "${targetPath}" -b ${branch}`, { stdio: 'pipe' });

      // Configure account if specified
      if (account) {
        const configDir = path.join(targetPath, '.gitconnect');
        fs.mkdirSync(configDir, { recursive: true, mode: 0o700 });
        fs.writeFileSync(
          path.join(configDir, 'project.json'),
          JSON.stringify({ account, mode: 'auto' }, null, 2),
          { mode: 0o600 }
        );
      }

      return true;
    } catch {
      return false;
    }
  },

  /**
   * Remove a worktree
   */
  removeWorktree(worktreePath: string, force: boolean = false): boolean {
    try {
      const cmd = force
        ? `git worktree remove --force "${worktreePath}"`
        : `git worktree remove "${worktreePath}"`;
      execSync(cmd, { stdio: 'pipe' });
      return true;
    } catch {
      return false;
    }
  },

  /**
   * Prune deleted worktrees
   */
  pruneWorktrees(): boolean {
    try {
      execSync('git worktree prune', { stdio: 'pipe' });
      return true;
    } catch {
      return false;
    }
  },

  /**
   * Get current worktree
   */
  getCurrentWorktree(): WorktreeInfo | null {
    const worktrees = this.listWorktrees();
    const cwd = process.cwd();
    return worktrees.find(w => cwd.startsWith(w.path)) || null;
  },

  /**
   * Switch to a worktree
   */
  switchToWorktree(worktreePath: string): { success: boolean; message: string } {
    if (!fs.existsSync(worktreePath)) {
      return { success: false, message: 'Worktree path does not exist' };
    }

    // Return instruction for user to cd to the path
    return { success: true, message: `cd "${worktreePath}"` };
  },
};