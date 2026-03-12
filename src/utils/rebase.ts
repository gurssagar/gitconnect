/**
 * Interactive Rebase with Account Switching
 */

import { execSync } from 'child_process';

export const rebaseManager = {
  /**
   * Start interactive rebase
   */
  startInteractive(baseBranch: string = 'main'): boolean {
    try {
      execSync(`git rebase -i ${baseBranch}`, { stdio: 'inherit' });
      return true;
    } catch {
      return false;
    }
  },

  /**
   * Set author for specific commit during rebase
   */
  setCommitAuthor(commitSha: string, name: string, email: string): boolean {
    try {
      execSync(`git commit --amend --author="${name} <${email}>" --no-edit`, { stdio: 'pipe' });
      return true;
    } catch {
      return false;
    }
  },

  /**
   * Continue rebase
   */
  continueRebase(): boolean {
    try {
      execSync('git rebase --continue', { stdio: 'pipe' });
      return true;
    } catch {
      return false;
    }
  },

  /**
   * Abort rebase
   */
  abortRebase(): boolean {
    try {
      execSync('git rebase --abort', { stdio: 'pipe' });
      return true;
    } catch {
      return false;
    }
  },

  /**
   * Skip current commit during rebase
   */
  skipCommit(): boolean {
    try {
      execSync('git rebase --skip', { stdio: 'pipe' });
      return true;
    } catch {
      return false;
    }
  },

  /**
   * Check if rebase is in progress
   */
  isRebasing(): boolean {
    try {
      execSync('git test -d .git/rebase-merge || test -d .git/rebase-apply', { stdio: 'pipe' });
      return true;
    } catch {
      return false;
    }
  },

  /**
   * Reword commit message
   */
  rewordCommit(message: string): boolean {
    try {
      execSync(`git commit --amend -m "${message}"`, { stdio: 'pipe' });
      return true;
    } catch {
      return false;
    }
  },
};