/**
 * Automatic Conflict Resolution
 * Automatically resolve common merge conflicts
 */

import { execSync } from 'child_process';

export interface ConflictInfo {
  file: string;
  ours: string;
  theirs: string;
  type: 'content' | 'binary' | 'mode';
}

export interface ResolutionStrategy {
  type: 'ours' | 'theirs' | 'merge' | 'custom';
  rules?: ConflictResolutionRule[];
}

export interface ConflictResolutionRule {
  pattern: string; // glob or regex
  strategy: 'ours' | 'theirs' | 'merge';
}

export const conflictResolution = {
  rules: [] as ConflictResolutionRule[],

  /**
   * Detect conflicts in current merge
   */
  detectConflicts(): ConflictInfo[] {
    const conflicts: ConflictInfo[] = [];

    try {
      const output = execSync('git diff --name-only --diff-filter=U', {
        encoding: 'utf-8',
      });

      const files = output.trim().split('\n').filter(Boolean);
      for (const file of files) {
        conflicts.push({
          file,
          ours: 'HEAD',
          theirs: 'MERGE_HEAD',
          type: 'content',
        });
      }
    } catch {
      // No conflicts or not in merge
    }

    return conflicts;
  },

  /**
   * Add resolution rule
   */
  addRule(pattern: string, strategy: 'ours' | 'theirs' | 'merge'): void {
    this.rules.push({ pattern, strategy });
  },

  /**
   * Get strategy for file
   */
  getStrategyForFile(filename: string): 'ours' | 'theirs' | 'merge' {
    for (const rule of this.rules) {
      const regex = new RegExp(rule.pattern.replace(/\*/g, '.*'));
      if (regex.test(filename)) {
        return rule.strategy;
      }
    }
    return 'merge';
  },

  /**
   * Auto-resolve conflict
   */
  autoResolve(conflict: ConflictInfo): boolean {
    const strategy = this.getStrategyForFile(conflict.file);

    try {
      if (strategy === 'ours') {
        execSync(`git checkout --ours "${conflict.file}"`);
        execSync(`git add "${conflict.file}"`);
        return true;
      } else if (strategy === 'theirs') {
        execSync(`git checkout --theirs "${conflict.file}"`);
        execSync(`git add "${conflict.file}"`);
        return true;
      } else {
        // Try to merge automatically
        // For simple conflicts, this might work
        return false;
      }
    } catch {
      return false;
    }
  },

  /**
   * Auto-resolve all conflicts
   */
  autoResolveAll(): { resolved: number; remaining: number } {
    const conflicts = this.detectConflicts();
    let resolved = 0;

    for (const conflict of conflicts) {
      if (this.autoResolve(conflict)) {
        resolved++;
      }
    }

    return {
      resolved,
      remaining: conflicts.length - resolved,
    };
  },

  /**
   * Generate conflict report
   */
  generateReport(): string {
    const conflicts = this.detectConflicts();
    const lines: string[] = ['# Conflict Report\n'];

    if (conflicts.length === 0) {
      lines.push('No conflicts detected.');
    } else {
      lines.push(`Found ${conflicts.length} conflicts:\n`);
      for (const conflict of conflicts) {
        const strategy = this.getStrategyForFile(conflict.file);
        lines.push(`- ${conflict.file} (${strategy})`);
      }
    }

    return lines.join('\n');
  },

  /**
   * Suggest resolution
   */
  suggestResolution(_conflict: ConflictInfo): string[] {
    return [
      '1. Accept your changes (ours)',
      '2. Accept their changes (theirs)',
      '3. Merge manually',
      '4. Skip this file',
    ];
  },
};