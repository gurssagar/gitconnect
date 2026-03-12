/**
 * AI-Powered Git Assistance
 * Provides intelligent suggestions for commits, branches, and reviews
 */

import { execSync } from 'child_process';

export const aiAssistant = {
  /**
   * Generate commit message suggestion based on diff
   */
  suggestCommitMessage(): string {
    try {
      const diff = execSync('git diff --cached', { encoding: 'utf-8' });
      const lines = diff.split('\n').filter(l => l.startsWith('+') && !l.startsWith('+++'));

      // Simple heuristic-based suggestions
      if (lines.some(l => l.includes('function') || l.includes('const'))) {
        return 'feat: add new functionality';
      }
      if (lines.some(l => l.includes('fix') || l.includes('bug'))) {
        return 'fix: resolve issue';
      }
      if (lines.some(l => l.includes('test'))) {
        return 'test: add test coverage';
      }
      if (lines.some(l => l.includes('docs'))) {
        return 'docs: update documentation';
      }

      return 'chore: update codebase';
    } catch {
      return 'chore: update codebase';
    }
  },

  /**
   * Generate branch name from description
   */
  suggestBranchName(description: string): string {
    const words = description.toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .split(/\s+/)
      .slice(0, 5)
      .join('-');

    return `feature/${words}`;
  },

  /**
   * Analyze code changes for review
   */
  analyzeChanges(): { files: number; additions: number; deletions: number } {
    try {
      const stat = execSync('git diff --cached --stat', { encoding: 'utf-8' });
      const match = stat.match(/(\d+) files? changed, (\d+) insertions?\(\+\), (\d+) deletions?\(-\)/);
      if (match) {
        return {
          files: parseInt(match[1]),
          additions: parseInt(match[2]),
          deletions: parseInt(match[3]),
        };
      }
    } catch { /* ignore */ }
    return { files: 0, additions: 0, deletions: 0 };
  },

  /**
   * Generate PR description
   */
  generatePRDescription(title: string): string {
    const stats = this.analyzeChanges();
    return `## ${title}

### Changes
- Files changed: ${stats.files}
- Additions: +${stats.additions}
- Deletions: -${stats.deletions}

### Checklist
- [ ] Tests added/updated
- [ ] Documentation updated
- [ ] Ready for review
`;
  },
};