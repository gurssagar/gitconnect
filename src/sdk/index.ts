/**
 * GitConnect SDK for programmatic access
 */

import { execSync } from 'child_process';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';

export interface Account {
  id: string;
  username: string;
  email: string;
}

export interface CommitOptions {
  message: string;
  account?: string;
  sign?: boolean;
}

export interface BranchOptions {
  type: 'feature' | 'bugfix' | 'hotfix' | 'release' | 'chore';
  description: string;
  ticket?: string;
}

export class GitConnectSDK {
  private configDir: string;

  constructor() {
    this.configDir = path.join(os.homedir(), '.gitconnect');
  }

  /**
   * Check if GitConnect is initialized
   */
  async isInitialized(): Promise<boolean> {
    try {
      await fs.access(this.configDir);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get all accounts
   */
  async getAccounts(): Promise<Account[]> {
    try {
      const data = await fs.readFile(path.join(this.configDir, 'accounts.json'), 'utf-8');
      const config = JSON.parse(data);
      return config.accounts || [];
    } catch {
      return [];
    }
  }

  /**
   * Get account by username or ID
   */
  async getAccount(identifier: string): Promise<Account | null> {
    const accounts = await this.getAccounts();
    return accounts.find(a => a.username === identifier || a.id === identifier) || null;
  }

  /**
   * Commit with GitConnect
   */
  async commit(options: CommitOptions): Promise<{ success: boolean; output: string }> {
    try {
      let cmd = 'gitconnect commit';
      if (options.account) cmd += ` -a "${options.account}"`;
      if (options.sign) cmd += ' --sign';
      cmd += ` -m "${options.message.replace(/"/g, '\\"')}"`;

      const output = execSync(cmd, { encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'] });
      return { success: true, output };
    } catch (error: unknown) {
      const execError = error as Error & { stdout?: string; stderr?: string };
      return { success: false, output: execError.stdout || execError.stderr || (error as Error).message };
    }
  }

  /**
   * Push with GitConnect
   */
  async push(account?: string): Promise<{ success: boolean; output: string }> {
    try {
      const cmd = account ? `gitconnect push -a "${account}"` : 'gitconnect push';
      const output = execSync(cmd, { encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'] });
      return { success: true, output };
    } catch (error: unknown) {
      const execError = error as Error & { stdout?: string; stderr?: string };
      return { success: false, output: execError.stdout || execError.stderr || (error as Error).message };
    }
  }

  /**
   * Create branch with naming convention
   */
  async createBranch(options: BranchOptions, username: string): Promise<{ success: boolean; branchName: string }> {
    const parts: string[] = [options.type];
    parts.push(username.toLowerCase().replace(/[^a-z0-9]/g, '-'));
    if (options.ticket) parts.push(options.ticket);
    parts.push(options.description.toLowerCase().replace(/[^a-z0-9]/g, '-').slice(0, 40));
    const branchName = parts.join('/');

    try {
      execSync(`git checkout -b ${branchName}`, { stdio: 'pipe' });
      return { success: true, branchName };
    } catch {
      return { success: false, branchName };
    }
  }

  /**
   * Get current git identity
   */
  getCurrentIdentity(): { name: string; email: string } | null {
    try {
      const name = execSync('git config user.name', { encoding: 'utf-8' }).trim();
      const email = execSync('git config user.email', { encoding: 'utf-8' }).trim();
      return { name, email };
    } catch {
      return null;
    }
  }

  /**
   * Set git identity
   */
  setIdentity(name: string, email: string): void {
    execSync(`git config user.name "${name}"`, { stdio: 'pipe' });
    execSync(`git config user.email "${email}"`, { stdio: 'pipe' });
  }
}

// Singleton instance
export const gitconnect = new GitConnectSDK();

// Default export
export default gitconnect;