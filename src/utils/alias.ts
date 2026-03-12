/**
 * Git Alias Management
 * Manage git aliases for GitConnect commands
 */

import { execSync } from 'child_process';
import * as fs from 'fs';

export interface GitAlias {
  name: string;
  command: string;
  description: string;
}

export const defaultAliases: GitAlias[] = [
  { name: 'gc-init', command: '!gitconnect init', description: 'Initialize GitConnect' },
  { name: 'gc-add', command: '!gitconnect account add', description: 'Add a new account' },
  { name: 'gc-list', command: '!gitconnect account list', description: 'List all accounts' },
  { name: 'gc-use', command: '!gitconnect use', description: 'Switch account' },
  { name: 'gc-status', command: '!gitconnect status', description: 'Show GitConnect status' },
  { name: 'gc-commit', command: '!gitconnect commit', description: 'Commit with account selection' },
  { name: 'gc-push', command: '!gitconnect push', description: 'Push with account verification' },
  { name: 'gc-branch', command: '!gitconnect branch', description: 'Create branch with naming convention' },
  { name: 'gc-template', command: '!gitconnect template list', description: 'List commit templates' },
  { name: 'gc-hooks', command: '!gitconnect hooks status', description: 'Show hooks status' },
];

export const aliasManager = {
  /**
   * List all git aliases
   */
  listAliases(): GitAlias[] {
    try {
      const output = execSync('git config --get-regexp "^alias\\."', { encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'] });
      const aliases: GitAlias[] = [];
      const lines = output.trim().split('\n').filter(Boolean);

      for (const line of lines) {
        const match = line.match(/^alias\.(\S+)\s+(.+)$/);
        if (match) {
          aliases.push({
            name: match[1],
            command: match[2],
            description: this.getAliasDescription(match[1]),
          });
        }
      }

      return aliases;
    } catch {
      return [];
    }
  },

  /**
   * Get description for a known alias
   */
  getAliasDescription(name: string): string {
    const found = defaultAliases.find(a => a.name === name);
    return found?.description || 'Custom alias';
  },

  /**
   * Set a git alias
   */
  setAlias(name: string, command: string): boolean {
    try {
      execSync(`git config --global alias.${name} "${command}"`, { stdio: 'pipe' });
      return true;
    } catch {
      return false;
    }
  },

  /**
   * Remove a git alias
   */
  removeAlias(name: string): boolean {
    try {
      execSync(`git config --global --unset alias.${name}`, { stdio: 'pipe' });
      return true;
    } catch {
      return false;
    }
  },

  /**
   * Check if alias exists
   */
  hasAlias(name: string): boolean {
    try {
      execSync(`git config --global --get alias.${name}`, { stdio: 'pipe' });
      return true;
    } catch {
      return false;
    }
  },

  /**
   * Install all default GitConnect aliases
   */
  installDefaultAliases(): { installed: string[]; failed: string[] } {
    const installed: string[] = [];
    const failed: string[] = [];

    for (const alias of defaultAliases) {
      if (this.setAlias(alias.name, alias.command)) {
        installed.push(alias.name);
      } else {
        failed.push(alias.name);
      }
    }

    return { installed, failed };
  },

  /**
   * Remove all GitConnect aliases
   */
  uninstallAliases(): { removed: string[]; failed: string[] } {
    const removed: string[] = [];
    const failed: string[] = [];

    for (const alias of defaultAliases) {
      if (this.hasAlias(alias.name)) {
        if (this.removeAlias(alias.name)) {
          removed.push(alias.name);
        } else {
          failed.push(alias.name);
        }
      }
    }

    return { removed, failed };
  },

  /**
   * Export aliases to a file
   */
  exportAliases(outputPath: string): boolean {
    try {
      const aliases = this.listAliases();
      const content = aliases.map(a => `git config --global alias.${a.name} "${a.command}"`).join('\n');
      fs.writeFileSync(outputPath, content, 'utf-8');
      return true;
    } catch {
      return false;
    }
  },

  /**
   * Import aliases from a file
   */
  importAliases(inputPath: string): { imported: string[]; failed: string[] } {
    const imported: string[] = [];
    const failed: string[] = [];

    try {
      const content = fs.readFileSync(inputPath, 'utf-8');
      const lines = content.split('\n').filter(Boolean);

      for (const line of lines) {
        const match = line.match(/git config --global alias\.(\S+)\s+"(.+)"$/);
        if (match) {
          if (this.setAlias(match[1], match[2])) {
            imported.push(match[1]);
          } else {
            failed.push(match[1]);
          }
        }
      }
    } catch {
      // File read error
    }

    return { imported, failed };
  },

  /**
   * Get common git aliases (non-GitConnect)
   */
  getCommonAliases(): Record<string, string> {
    return {
      co: 'checkout',
      br: 'branch',
      ci: 'commit',
      st: 'status',
      unstage: 'reset HEAD --',
      last: 'log -1 HEAD',
      visual: '!gitk',
      lg: 'log --graph --pretty=format:%Cred%h%Creset -%C(yellow)%d%Creset %s %Cgreen(%cr) %C(bold blue)<%an>%Creset --abbrev-commit',
    };
  },

  /**
   * Install common helpful aliases
   */
  installCommonAliases(): { installed: string[]; failed: string[] } {
    const installed: string[] = [];
    const failed: string[] = [];
    const common = this.getCommonAliases();

    for (const [name, command] of Object.entries(common)) {
      if (this.setAlias(name, command)) {
        installed.push(name);
      } else {
        failed.push(name);
      }
    }

    return { installed, failed };
  },
};