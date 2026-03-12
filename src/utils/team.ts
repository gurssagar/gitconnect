/**
 * Team Configuration Sharing
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';
import { execSync } from 'child_process';

export interface TeamConfig {
  name: string;
  accounts: Array<{ username: string; email: string }>;
  templates: Record<string, string>;
  createdAt: string;
}

export const teamManager = {
  /**
   * Export team configuration
   */
  async exportConfig(outputPath: string): Promise<void> {
    const configDir = path.join(os.homedir(), '.gitconnect');
    const accounts = JSON.parse(await fs.readFile(path.join(configDir, 'accounts.json'), 'utf-8'));
    const templates: Record<string, string> = {};
    const templatesDir = path.join(configDir, 'templates');
    try {
      const files = await fs.readdir(templatesDir);
      for (const f of files.filter(f => f.endsWith('.txt'))) {
        templates[f.replace('.txt', '')] = await fs.readFile(path.join(templatesDir, f), 'utf-8');
      }
    } catch { /* no templates */ }
    const teamConfig: TeamConfig = { name: 'team-config', accounts: accounts.accounts, templates, createdAt: new Date().toISOString() };
    await fs.writeFile(outputPath, JSON.stringify(teamConfig, null, 2));
  },

  /**
   * Import team configuration
   */
  async importConfig(inputPath: string): Promise<number> {
    const config = JSON.parse(await fs.readFile(inputPath, 'utf-8')) as TeamConfig;
    let imported = 0;
    for (const account of config.accounts) {
      try { execSync('gitconnect account add', { input: JSON.stringify(account), stdio: 'pipe' }); imported++; } catch { /* skip */ }
    }
    return imported;
  },
};