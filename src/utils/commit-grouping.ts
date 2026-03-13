/**
 * Smart Commit Grouping
 * Group related changes into logical commits
 */

import { execSync } from 'child_process';

export interface FileChange {
  path: string;
  additions: number;
  deletions: number;
  status: 'added' | 'modified' | 'deleted' | 'renamed';
}

export interface CommitGroup {
  id: string;
  name: string;
  files: FileChange[];
  suggestedMessage: string;
}

export const commitGrouping = {
  /**
   * Get staged changes
   */
  getStagedChanges(): FileChange[] {
    const changes: FileChange[] = [];

    try {
      const output = execSync('git diff --cached --numstat', { encoding: 'utf-8' });
      const lines = output.trim().split('\n').filter(Boolean);

      for (const line of lines) {
        const [additions, deletions, path] = line.split('\t');
        changes.push({
          path,
          additions: parseInt(additions) || 0,
          deletions: parseInt(deletions) || 0,
          status: 'modified',
        });
      }
    } catch {
      // No staged changes
    }

    return changes;
  },

  /**
   * Group changes by directory
   */
  groupByDirectory(files: FileChange[]): Map<string, FileChange[]> {
    const groups = new Map<string, FileChange[]>();

    for (const file of files) {
      const dir = file.path.split('/').slice(0, -1).join('/') || 'root';
      if (!groups.has(dir)) {
        groups.set(dir, []);
      }
      groups.get(dir)!.push(file);
    }

    return groups;
  },

  /**
   * Group changes by type
   */
  groupByType(files: FileChange[]): Map<string, FileChange[]> {
    const groups = new Map<string, FileChange[]>();

    for (const file of files) {
      const ext = file.path.split('.').pop() || 'unknown';
      const type = this.getTypeForExtension(ext);

      if (!groups.has(type)) {
        groups.set(type, []);
      }
      groups.get(type)!.push(file);
    }

    return groups;
  },

  /**
   * Get type for file extension
   */
  getTypeForExtension(ext: string): string {
    const typeMap: Record<string, string> = {
      ts: 'typescript',
      js: 'javascript',
      json: 'config',
      md: 'docs',
      css: 'styles',
      html: 'templates',
      test: 'tests',
      spec: 'tests',
      yml: 'config',
      yaml: 'config',
    };

    return typeMap[ext] || 'other';
  },

  /**
   * Suggest groups
   */
  suggestGroups(files: FileChange[]): CommitGroup[] {
    const groups: CommitGroup[] = [];

    // Group by type first
    const typeGroups = this.groupByType(files);

    for (const [type, typeFiles] of typeGroups) {
      const name = this.getGroupName(type, typeFiles);
      groups.push({
        id: `group-${type}`,
        name,
        files: typeFiles,
        suggestedMessage: this.generateMessage(type, typeFiles),
      });
    }

    return groups;
  },

  /**
   * Get group name
   */
  getGroupName(type: string, files: FileChange[]): string {
    const typeNames: Record<string, string> = {
      typescript: 'TypeScript Changes',
      javascript: 'JavaScript Changes',
      config: 'Configuration Changes',
      docs: 'Documentation Updates',
      styles: 'Style Changes',
      tests: 'Test Updates',
      templates: 'Template Changes',
      other: 'Other Changes',
    };

    return `${typeNames[type] || type} (${files.length} files)`;
  },

  /**
   * Generate commit message for group
   */
  generateMessage(type: string, files: FileChange[]): string {
    const typeMessages: Record<string, string> = {
      typescript: 'refactor: update TypeScript files',
      javascript: 'refactor: update JavaScript files',
      config: 'chore: update configuration',
      docs: 'docs: update documentation',
      styles: 'style: update styles',
      tests: 'test: update tests',
      templates: 'refactor: update templates',
      other: 'chore: miscellaneous changes',
    };

    const baseMessage = typeMessages[type] || 'chore: update files';
    const totalChanges = files.reduce((sum, f) => sum + f.additions + f.deletions, 0);

    return `${baseMessage} (${totalChanges} lines changed)`;
  },

  /**
   * Apply grouping
   */
  async applyGrouping(groups: CommitGroup[]): Promise<void> {
    for (const group of groups) {
      // Would stage and commit each group
      console.log(`Would commit: ${group.name}`);
      console.log(`  Message: ${group.suggestedMessage}`);
      console.log(`  Files: ${group.files.map(f => f.path).join(', ')}`);
    }
  },
};