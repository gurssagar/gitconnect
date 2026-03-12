/**
 * Branch Naming Convention Utilities
 */

import { execSync } from 'child_process';

export interface BranchPattern {
  prefix: string;
  includeUsername: boolean;
  includeTicket: boolean;
  separator: string;
}

export const defaultPatterns: Record<string, BranchPattern> = {
  feature: { prefix: 'feature', includeUsername: true, includeTicket: true, separator: '/' },
  bugfix: { prefix: 'bugfix', includeUsername: true, includeTicket: true, separator: '/' },
  hotfix: { prefix: 'hotfix', includeUsername: false, includeTicket: true, separator: '/' },
  release: { prefix: 'release', includeUsername: false, includeTicket: false, separator: '/' },
  chore: { prefix: 'chore', includeUsername: true, includeTicket: false, separator: '/' },
};

export const branchManager = {
  /**
   * Generate a branch name following convention
   */
  generateBranchName(
    type: keyof typeof defaultPatterns,
    username: string,
    description: string,
    ticketId?: string
  ): string {
    const pattern = defaultPatterns[type] || defaultPatterns.feature;
    const parts: string[] = [pattern.prefix];

    if (pattern.includeUsername) {
      parts.push(username.toLowerCase().replace(/[^a-z0-9]/g, '-'));
    }

    if (pattern.includeTicket && ticketId) {
      parts.push(ticketId);
    }

    const slug = description
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .slice(0, 40);
    parts.push(slug);

    return parts.join(pattern.separator);
  },

  /**
   * Parse a branch name to extract components
   */
  parseBranchName(branchName: string): { type: string; username?: string; ticketId?: string; description: string } | null {
    const match = branchName.match(/^(\w+)\/(?:([^-]+)-)?(?:([A-Z]+-\d+)-)?(.+)$/);
    if (!match) return null;

    return {
      type: match[1],
      username: match[2],
      ticketId: match[3],
      description: match[4].replace(/-/g, ' '),
    };
  },

  /**
   * Create a new branch with convention
   */
  createBranch(branchName: string): boolean {
    try {
      execSync(`git checkout -b ${branchName}`, { stdio: 'pipe' });
      return true;
    } catch {
      return false;
    }
  },

  /**
   * Get current branch name
   */
  getCurrentBranch(): string | null {
    try {
      return execSync('git branch --show-current', { encoding: 'utf-8' }).trim();
    } catch {
      return null;
    }
  },

  /**
   * Validate branch name follows convention
   */
  isValidBranchName(branchName: string): boolean {
    const validPrefixes = Object.keys(defaultPatterns);
    const prefix = branchName.split('/')[0];
    return validPrefixes.includes(prefix);
  },
};