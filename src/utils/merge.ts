/**
 * Merge Conflict Resolution Helper
 */

import { execSync } from 'child_process';
import * as fs from 'fs';

export const mergeHelper = {
  /**
   * Check for merge conflicts
   */
  hasConflicts(): boolean {
    try {
      const output = execSync('git diff --name-only --diff-filter=U', { encoding: 'utf-8' });
      return output.trim().length > 0;
    } catch {
      return false;
    }
  },

  /**
   * List conflicted files
   */
  listConflicts(): string[] {
    try {
      const output = execSync('git diff --name-only --diff-filter=U', { encoding: 'utf-8' });
      return output.trim().split('\n').filter(Boolean);
    } catch {
      return [];
    }
  },

  /**
   * Accept ours version
   */
  acceptOurs(file: string): boolean {
    try {
      execSync(`git checkout --ours "${file}"`, { stdio: 'pipe' });
      execSync(`git add "${file}"`, { stdio: 'pipe' });
      return true;
    } catch {
      return false;
    }
  },

  /**
   * Accept theirs version
   */
  acceptTheirs(file: string): boolean {
    try {
      execSync(`git checkout --theirs "${file}"`, { stdio: 'pipe' });
      execSync(`git add "${file}"`, { stdio: 'pipe' });
      return true;
    } catch {
      return false;
    }
  },

  /**
   * Accept ours for all conflicts
   */
  acceptAllOurs(): number {
    const conflicts = this.listConflicts();
    let count = 0;
    for (const file of conflicts) {
      if (this.acceptOurs(file)) count++;
    }
    return count;
  },

  /**
   * Accept theirs for all conflicts
   */
  acceptAllTheirs(): number {
    const conflicts = this.listConflicts();
    let count = 0;
    for (const file of conflicts) {
      if (this.acceptTheirs(file)) count++;
    }
    return count;
  },

  /**
   * Get conflict markers in file
   */
  getConflictMarkers(file: string): { line: number; type: 'ours' | 'theirs' | 'separator' }[] {
    try {
      const content = fs.readFileSync(file, 'utf-8');
      const lines = content.split('\n');
      const markers: { line: number; type: 'ours' | 'theirs' | 'separator' }[] = [];

      lines.forEach((line, index) => {
        if (line.startsWith('<<<<<<<')) markers.push({ line: index + 1, type: 'ours' });
        else if (line.startsWith('=======')) markers.push({ line: index + 1, type: 'separator' });
        else if (line.startsWith('>>>>>>>')) markers.push({ line: index + 1, type: 'theirs' });
      });

      return markers;
    } catch {
      return [];
    }
  },

  /**
   * Complete merge
   */
  completeMerge(message?: string): boolean {
    try {
      if (message) {
        execSync(`git commit -m "${message}"`, { stdio: 'pipe' });
      } else {
        execSync('git commit', { stdio: 'pipe' });
      }
      return true;
    } catch {
      return false;
    }
  },

  /**
   * Abort merge
   */
  abortMerge(): boolean {
    try {
      execSync('git merge --abort', { stdio: 'pipe' });
      return true;
    } catch {
      return false;
    }
  },
};