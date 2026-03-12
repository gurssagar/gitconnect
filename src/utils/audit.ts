/**
 * Audit logging for GitConnect operations
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';

export interface AuditEntry {
  timestamp: string;
  action: string;
  account?: string;
  project?: string;
  details?: Record<string, unknown>;
  success: boolean;
}

export class AuditLogger {
  private logFile: string;

  constructor() {
    const configDir = path.join(os.homedir(), '.gitconnect');
    this.logFile = path.join(configDir, 'audit.log');
  }

  /**
   * Log an audit entry
   */
  async log(entry: Omit<AuditEntry, 'timestamp'>): Promise<void> {
    const fullEntry: AuditEntry = {
      ...entry,
      timestamp: new Date().toISOString(),
    };

    const logLine = JSON.stringify(fullEntry) + '\n';

    try {
      await fs.appendFile(this.logFile, logLine, { encoding: 'utf-8' });
    } catch {
      // Silently fail if logging isn't possible
    }
  }

  /**
   * Get recent audit entries
   */
  async getRecent(limit: number = 50): Promise<AuditEntry[]> {
    try {
      const content = await fs.readFile(this.logFile, 'utf-8');
      const lines = content.trim().split('\n').filter(Boolean);

      return lines
        .slice(-limit)
        .map(line => {
          try {
            return JSON.parse(line) as AuditEntry;
          } catch {
            return null;
          }
        })
        .filter((e): e is AuditEntry => e !== null);
    } catch {
      return [];
    }
  }

  /**
   * Get entries by action type
   */
  async getByAction(action: string): Promise<AuditEntry[]> {
    const entries = await this.getRecent(1000);
    return entries.filter(e => e.action === action);
  }

  /**
   * Get entries for a specific account
   */
  async getByAccount(account: string): Promise<AuditEntry[]> {
    const entries = await this.getRecent(1000);
    return entries.filter(e => e.account === account);
  }

  /**
   * Clear old audit entries (keep last N days)
   */
  async clearOld(daysToKeep: number = 30): Promise<number> {
    try {
      const content = await fs.readFile(this.logFile, 'utf-8');
      const lines = content.trim().split('\n').filter(Boolean);

      const cutoff = Date.now() - daysToKeep * 24 * 60 * 60 * 1000;
      const recentLines = lines.filter(line => {
        try {
          const entry = JSON.parse(line) as AuditEntry;
          return new Date(entry.timestamp).getTime() > cutoff;
        } catch {
          return false;
        }
      });

      await fs.writeFile(this.logFile, recentLines.join('\n') + '\n', { encoding: 'utf-8' });
      return lines.length - recentLines.length;
    } catch {
      return 0;
    }
  }
}

// Audit action types
export const AuditActions = {
  ACCOUNT_ADD: 'account.add',
  ACCOUNT_REMOVE: 'account.remove',
  ACCOUNT_SWITCH: 'account.switch',
  PROJECT_SET: 'project.set',
  PROJECT_MODE: 'project.mode',
  HOOK_INSTALL: 'hook.install',
  HOOK_UNINSTALL: 'hook.uninstall',
  KEY_GENERATE: 'key.generate',
  KEY_ROTATE: 'key.rotate',
  COMMIT: 'commit',
  PUSH: 'push',
} as const;

export const auditLogger = new AuditLogger();