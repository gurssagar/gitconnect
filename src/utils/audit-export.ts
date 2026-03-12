/**
 * Audit Log Export for SIEM Integration
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';

export interface AuditEntry {
  timestamp: string;
  action: string;
  account?: string;
  project?: string;
  details: Record<string, unknown>;
  result: 'success' | 'failure';
}

export const auditExporter = {
  auditDir: path.join(os.homedir(), '.gitconnect', 'audit'),

  /**
   * Initialize audit directory
   */
  async init(): Promise<void> {
    await fs.mkdir(this.auditDir, { recursive: true, mode: 0o700 });
  },

  /**
   * Log an audit entry
   */
  async log(entry: Omit<AuditEntry, 'timestamp'>): Promise<void> {
    await this.init();
    const auditEntry: AuditEntry = { ...entry, timestamp: new Date().toISOString() };
    const logPath = path.join(this.auditDir, `audit-${new Date().toISOString().split('T')[0]}.jsonl`);
    await fs.appendFile(logPath, JSON.stringify(auditEntry) + '\n', 'utf-8');
  },

  /**
   * Export audit logs as JSON
   */
  async exportJSON(outputPath: string, startDate?: Date, endDate?: Date): Promise<number> {
    const entries = await this.getEntries(startDate, endDate);
    await fs.writeFile(outputPath, JSON.stringify(entries, null, 2), 'utf-8');
    return entries.length;
  },

  /**
   * Export audit logs as CSV
   */
  async exportCSV(outputPath: string, startDate?: Date, endDate?: Date): Promise<number> {
    const entries = await this.getEntries(startDate, endDate);
    const headers = ['timestamp', 'action', 'account', 'project', 'result', 'details'];
    const rows = entries.map(e => [e.timestamp, e.action, e.account || '', e.project || '', e.result, JSON.stringify(e.details)]);
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    await fs.writeFile(outputPath, csv, 'utf-8');
    return entries.length;
  },

  /**
   * Export as CEF (Common Event Format) for SIEM
   */
  async exportCEF(outputPath: string, startDate?: Date, endDate?: Date): Promise<number> {
    const entries = await this.getEntries(startDate, endDate);
    const lines = entries.map(e => {
      const severity = e.result === 'success' ? 'Low' : 'Medium';
      return `CEF:0|GitConnect|GitConnect|1.1.0|${e.action}|${e.account || 'unknown'}|${severity}|timestamp=${e.timestamp} project=${e.project || ''} result=${e.result}`;
    });
    await fs.writeFile(outputPath, lines.join('\n'), 'utf-8');
    return entries.length;
  },

  /**
   * Get audit entries within date range
   */
  async getEntries(startDate?: Date, endDate?: Date): Promise<AuditEntry[]> {
    await this.init();
    const entries: AuditEntry[] = [];
    const files = await fs.readdir(this.auditDir);

    for (const file of files.filter(f => f.endsWith('.jsonl'))) {
      const content = await fs.readFile(path.join(this.auditDir, file), 'utf-8');
      for (const line of content.trim().split('\n').filter(Boolean)) {
        const entry = JSON.parse(line) as AuditEntry;
        const entryDate = new Date(entry.timestamp);
        if ((!startDate || entryDate >= startDate) && (!endDate || entryDate <= endDate)) {
          entries.push(entry);
        }
      }
    }

    return entries.sort((a, b) => a.timestamp.localeCompare(b.timestamp));
  },

  /**
   * Prune old audit logs
   */
  async prune(daysToKeep: number = 90): Promise<number> {
    await this.init();
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - daysToKeep);
    const files = await fs.readdir(this.auditDir);
    let removed = 0;

    for (const file of files) {
      const fileDate = new Date(file.replace('audit-', '').replace('.jsonl', ''));
      if (fileDate < cutoff) {
        await fs.unlink(path.join(this.auditDir, file));
        removed++;
      }
    }

    return removed;
  },
};