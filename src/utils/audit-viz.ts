/**
 * Audit Trail Visualization
 * Visualize audit logs and activity trails
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';

export interface AuditNode {
  id: string;
  type: 'commit' | 'account-switch' | 'key-operation' | 'config-change';
  timestamp: string;
  user: string;
  account: string;
  details: Record<string, unknown>;
}

export interface AuditEdge {
  from: string;
  to: string;
  relationship: string;
}

export interface AuditGraph {
  nodes: AuditNode[];
  edges: AuditEdge[];
}

export const auditVisualization = {
  auditDir: path.join(os.homedir(), '.gitconnect', 'audit'),

  /**
   * Load audit events
   */
  async loadAuditEvents(days: number = 30): Promise<AuditNode[]> {
    const events: AuditNode[] = [];
    const cutoff = Date.now() - days * 86400000;

    try {
      const files = await fs.readdir(this.auditDir);
      for (const file of files) {
        if (file.endsWith('.json')) {
          const content = await fs.readFile(path.join(this.auditDir, file), 'utf-8');
          const data = JSON.parse(content);
          if (new Date(data.timestamp).getTime() > cutoff) {
            events.push(data as AuditNode);
          }
        }
      }
    } catch {
      // No audit files yet
    }

    return events.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  },

  /**
   * Build audit graph
   */
  buildGraph(events: AuditNode[]): AuditGraph {
    const nodes = events;
    const edges: AuditEdge[] = [];

    // Connect related events
    for (let i = 0; i < events.length - 1; i++) {
      if (events[i].account === events[i + 1].account) {
        edges.push({
          from: events[i + 1].id,
          to: events[i].id,
          relationship: 'same-account',
        });
      }
      if (events[i].user === events[i + 1].user) {
        edges.push({
          from: events[i + 1].id,
          to: events[i].id,
          relationship: 'same-user',
        });
      }
    }

    return { nodes, edges };
  },

  /**
   * Generate timeline visualization
   */
  generateTimeline(events: AuditNode[]): string {
    const lines: string[] = ['# Audit Timeline\n'];

    for (const event of events) {
      const date = new Date(event.timestamp).toLocaleString();
      lines.push(`## ${date}`);
      lines.push(`- **Type**: ${event.type}`);
      lines.push(`- **User**: ${event.user}`);
      lines.push(`- **Account**: ${event.account}`);
      lines.push(`- **Details**: ${JSON.stringify(event.details)}`);
      lines.push('');
    }

    return lines.join('\n');
  },

  /**
   * Generate activity heatmap
   */
  generateHeatmap(events: AuditNode[]): Record<string, number> {
    const heatmap: Record<string, number> = {};

    for (const event of events) {
      const date = new Date(event.timestamp).toISOString().split('T')[0];
      heatmap[date] = (heatmap[date] || 0) + 1;
    }

    return heatmap;
  },

  /**
   * Export as JSON
   */
  async exportJSON(outputPath: string, events: AuditNode[]): Promise<void> {
    await fs.writeFile(outputPath, JSON.stringify(events, null, 2));
  },

  /**
   * Export as CSV
   */
  async exportCSV(outputPath: string, events: AuditNode[]): Promise<void> {
    const headers = 'id,type,timestamp,user,account,details\n';
    const rows = events.map(e =>
      `${e.id},${e.type},${e.timestamp},${e.user},${e.account},"${JSON.stringify(e.details)}"`
    );
    await fs.writeFile(outputPath, headers + rows.join('\n'));
  },

  /**
   * Generate summary report
   */
  generateSummary(events: AuditNode[]): {
    totalEvents: number;
    byType: Record<string, number>;
    byUser: Record<string, number>;
    byAccount: Record<string, number>;
  } {
    const byType: Record<string, number> = {};
    const byUser: Record<string, number> = {};
    const byAccount: Record<string, number> = {};

    for (const event of events) {
      byType[event.type] = (byType[event.type] || 0) + 1;
      byUser[event.user] = (byUser[event.user] || 0) + 1;
      byAccount[event.account] = (byAccount[event.account] || 0) + 1;
    }

    return {
      totalEvents: events.length,
      byType,
      byUser,
      byAccount,
    };
  },
};