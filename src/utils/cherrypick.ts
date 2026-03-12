/**
 * Cherry-pick Across Accounts
 */

import { execSync } from 'child_process';

export const cherryPickManager = {
  /**
   * Cherry-pick a commit with account switch
   */
  cherryPick(commitSha: string, targetAccount: string): { success: boolean; message: string } {
    try {
      // Cherry-pick the commit
      execSync(`git cherry-pick ${commitSha}`, { stdio: 'pipe' });

      // Update author to target account
      execSync(`git commit --amend --author="${targetAccount}" --no-edit`, { stdio: 'pipe' });

      return { success: true, message: `Cherry-picked ${commitSha} as ${targetAccount}` };
    } catch (error) {
      const err = error as Error & { stdout?: string };
      return { success: false, message: err.stdout || 'Cherry-pick failed' };
    }
  },

  /**
   * Cherry-pick range of commits
   */
  cherryPickRange(startSha: string, endSha: string, account: string): { success: boolean; count: number } {
    try {
      const commits = execSync(`git log --oneline ${startSha}^..${endSha}`, { encoding: 'utf-8' })
        .trim()
        .split('\n')
        .filter(Boolean)
        .reverse();

      let count = 0;
      for (const line of commits) {
        const sha = line.split(' ')[0];
        if (this.cherryPick(sha, account).success) {
          count++;
        }
      }

      return { success: true, count };
    } catch {
      return { success: false, count: 0 };
    }
  },

  /**
   * Abort cherry-pick
   */
  abort(): boolean {
    try {
      execSync('git cherry-pick --abort', { stdio: 'pipe' });
      return true;
    } catch {
      return false;
    }
  },

  /**
   * Continue cherry-pick after resolving conflicts
   */
  continueCherryPick(): boolean {
    try {
      execSync('git cherry-pick --continue', { stdio: 'pipe' });
      return true;
    } catch {
      return false;
    }
  },
};