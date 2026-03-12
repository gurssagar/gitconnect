/**
 * Stash Management Per Account
 */

import { execSync } from 'child_process';

export interface StashEntry {
  index: number;
  branch: string;
  message: string;
  account?: string;
}

export const stashManager = {
  /**
   * List all stashes
   */
  listStashes(): StashEntry[] {
    try {
      const output = execSync('git stash list --format=%gd:%gs', { encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'] });
      const lines = output.trim().split('\n').filter(Boolean);
      const stashes: StashEntry[] = [];

      for (const line of lines) {
        const match = line.match(/stash@\{(\d+)\}:(.+): (.+)/);
        if (match) {
          stashes.push({
            index: parseInt(match[1]),
            branch: match[2],
            message: match[3],
          });
        }
      }

      return stashes;
    } catch {
      return [];
    }
  },

  /**
   * Create a stash with account tag
   */
  stash(account: string, message?: string): boolean {
    try {
      const stashMessage = message ? `[${account}] ${message}` : `[${account}]`;
      execSync(`git stash push -m "${stashMessage}"`, { stdio: 'pipe' });
      return true;
    } catch {
      return false;
    }
  },

  /**
   * Pop a stash
   */
  pop(index: number = 0): boolean {
    try {
      execSync(`git stash pop stash@{${index}}`, { stdio: 'pipe' });
      return true;
    } catch {
      return false;
    }
  },

  /**
   * Apply a stash without removing it
   */
  apply(index: number = 0): boolean {
    try {
      execSync(`git stash apply stash@{${index}}`, { stdio: 'pipe' });
      return true;
    } catch {
      return false;
    }
  },

  /**
   * Drop a stash
   */
  drop(index: number): boolean {
    try {
      execSync(`git stash drop stash@{${index}}`, { stdio: 'pipe' });
      return true;
    } catch {
      return false;
    }
  },

  /**
   * Clear all stashes
   */
  clear(): boolean {
    try {
      execSync('git stash clear', { stdio: 'pipe' });
      return true;
    } catch {
      return false;
    }
  },

  /**
   * Get stashes for a specific account
   */
  getStashesByAccount(account: string): StashEntry[] {
    const stashes = this.listStashes();
    return stashes.filter(s => s.message.includes(`[${account}]`));
  },
};