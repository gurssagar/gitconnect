/**
 * Predictive Branch Management
 * Predict and suggest branch operations
 */

import { execSync } from 'child_process';

export interface BranchPrediction {
  branchName: string;
  confidence: number;
  reasoning: string;
}

export interface BranchPattern {
  prefix: string;
  description: string;
  examples: string[];
}

export const predictiveBranch = {
  patterns: [] as BranchPattern[],

  /**
   * Initialize patterns
   */
  init(): void {
    this.patterns = [
      { prefix: 'feature/', description: 'New feature development', examples: ['feature/add-auth', 'feature/user-dashboard'] },
      { prefix: 'bugfix/', description: 'Bug fixes', examples: ['bugfix/login-crash', 'bugfix/memory-leak'] },
      { prefix: 'hotfix/', description: 'Critical production fixes', examples: ['hotfix/security-patch', 'hotfix/data-loss'] },
      { prefix: 'release/', description: 'Release preparation', examples: ['release/v1.0.0', 'release/v2.0.0'] },
      { prefix: 'docs/', description: 'Documentation updates', examples: ['docs/api-reference', 'docs/getting-started'] },
      { prefix: 'refactor/', description: 'Code refactoring', examples: ['refactor/auth-module', 'refactor/database-layer'] },
      { prefix: 'test/', description: 'Test additions/updates', examples: ['test/unit-tests', 'test/integration'] },
      { prefix: 'chore/', description: 'Maintenance tasks', examples: ['chore/update-deps', 'chore/cleanup'] },
    ];
  },

  /**
   * Get current branch
   */
  getCurrentBranch(): string {
    try {
      return execSync('git rev-parse --abbrev-ref HEAD', { encoding: 'utf-8' }).trim();
    } catch {
      return 'main';
    }
  },

  /**
   * Predict next branch name
   */
  predictBranch(context: {
    taskType?: string;
    taskId?: string;
    description?: string;
  }): BranchPrediction[] {
    const predictions: BranchPrediction[] = [];

    if (context.taskType) {
      const pattern = this.patterns.find(p => context.taskType?.toLowerCase().includes(p.prefix.replace('/', '')));
      if (pattern) {
        const branchName = context.taskId
          ? `${pattern.prefix}${context.taskId}-${this.slugify(context.description || 'task')}`
          : `${pattern.prefix}${this.slugify(context.description || 'new-task')}`;

        predictions.push({
          branchName,
          confidence: 0.8,
          reasoning: `Based on task type '${context.taskType}'`,
        });
      }
    }

    // Default suggestions
    for (const pattern of this.patterns.slice(0, 3)) {
      if (predictions.length >= 3) break;

      predictions.push({
        branchName: `${pattern.prefix}${this.slugify(context.description || 'new-branch')}`,
        confidence: 0.3,
        reasoning: pattern.description,
      });
    }

    return predictions;
  },

  /**
   * Slugify text for branch name
   */
  slugify(text: string): string {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 50);
  },

  /**
   * Suggest branch to merge
   */
  suggestMergeTarget(branch: string): string {
    if (branch.startsWith('feature/') || branch.startsWith('bugfix/')) {
      return 'develop';
    }
    if (branch.startsWith('hotfix/')) {
      return 'main';
    }
    if (branch.startsWith('release/')) {
      return 'main';
    }
    return 'main';
  },

  /**
   * Check if branch is stale
   */
  isBranchStale(branch: string): { stale: boolean; daysSinceUpdate: number } {
    try {
      const output = execSync(`git log -1 --format=%ct ${branch}`, { encoding: 'utf-8' });
      const timestamp = parseInt(output.trim());
      const daysSinceUpdate = (Date.now() / 1000 - timestamp) / 86400;

      return {
        stale: daysSinceUpdate > 30,
        daysSinceUpdate: Math.floor(daysSinceUpdate),
      };
    } catch {
      return { stale: false, daysSinceUpdate: 0 };
    }
  },

  /**
   * List stale branches
   */
  listStaleBranches(maxDays: number = 30): Array<{ branch: string; daysSinceUpdate: number }> {
    const staleBranches: Array<{ branch: string; daysSinceUpdate: number }> = [];

    try {
      const output = execSync('git branch --format=%(refname:short)', { encoding: 'utf-8' });
      const branches = output.trim().split('\n').filter(Boolean);

      for (const branch of branches) {
        const { stale, daysSinceUpdate } = this.isBranchStale(branch);
        if (stale || daysSinceUpdate > maxDays) {
          staleBranches.push({ branch, daysSinceUpdate });
        }
      }
    } catch {
      // Error listing branches
    }

    return staleBranches.sort((a, b) => b.daysSinceUpdate - a.daysSinceUpdate);
  },

  /**
   * Suggest cleanup
   */
  suggestCleanup(): Array<{ action: string; branch: string; reason: string }> {
    const suggestions: Array<{ action: string; branch: string; reason: string }> = [];
    const staleBranches = this.listStaleBranches();

    for (const { branch, daysSinceUpdate } of staleBranches) {
      suggestions.push({
        action: 'delete',
        branch,
        reason: `Not updated for ${daysSinceUpdate} days`,
      });
    }

    return suggestions;
  },
};

// Initialize on load
predictiveBranch.init();