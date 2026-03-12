import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';
import { execSync } from 'child_process';
import { Account, ProjectConfig, GitConnectConfig } from '../types';

export class ConfigManager {
  private configDir: string;
  private accountsFile: string;
  private projectsFile: string;
  private settingsFile: string;
  private sshDir: string;

  constructor() {
    this.configDir = path.join(os.homedir(), '.gitconnect');
    this.accountsFile = path.join(this.configDir, 'accounts.json');
    this.projectsFile = path.join(this.configDir, 'projects.json');
    this.settingsFile = path.join(this.configDir, 'settings.json');
    this.sshDir = path.join(this.configDir, 'ssh');
  }

  async init(): Promise<void> {
    // Create config directory
    await fs.mkdir(this.configDir, { recursive: true, mode: 0o700 });
    await fs.mkdir(this.sshDir, { recursive: true, mode: 0o700 });

    // Initialize empty config files
    await this.ensureFile(this.accountsFile, { accounts: [] });
    await this.ensureFile(this.projectsFile, { projects: {} });
    await this.ensureFile(this.settingsFile, { defaultMode: 'prompt' });

    console.log('✅ GitConnect initialized');
    console.log(`Config directory: ${this.configDir}`);
  }

  private async ensureFile(filePath: string, defaultContent: any): Promise<void> {
    try {
      await fs.access(filePath);
    } catch {
      await fs.writeFile(filePath, JSON.stringify(defaultContent, null, 2), { mode: 0o600 });
    }
  }

  async getAccounts(): Promise<Account[]> {
    const data = await fs.readFile(this.accountsFile, 'utf-8');
    const config = JSON.parse(data);
    return config.accounts;
  }

  async saveAccount(account: Account): Promise<void> {
    const accounts = await this.getAccounts();
    const existingIndex = accounts.findIndex(a => a.id === account.id);
    
    if (existingIndex >= 0) {
      accounts[existingIndex] = account;
    } else {
      accounts.push(account);
    }

    await fs.writeFile(this.accountsFile, JSON.stringify({ accounts }, null, 2));
  }

  async removeAccount(accountId: string): Promise<boolean> {
    const accounts = await this.getAccounts();
    const filtered = accounts.filter(a => a.id !== accountId);
    
    if (filtered.length === accounts.length) {
      return false;
    }

    await fs.writeFile(this.accountsFile, JSON.stringify({ accounts: filtered }, null, 2));
    return true;
  }

  async getAccount(accountId: string): Promise<Account | undefined> {
    const accounts = await this.getAccounts();
    return accounts.find(a => a.id === accountId);
  }

  async getProjects(): Promise<Record<string, ProjectConfig>> {
    const data = await fs.readFile(this.projectsFile, 'utf-8');
    const config = JSON.parse(data);
    return config.projects;
  }

  async getProjectConfig(projectPath: string): Promise<ProjectConfig | undefined> {
    const projects = await this.getProjects();
    return projects[projectPath];
  }

  async setProjectConfig(projectPath: string, config: ProjectConfig): Promise<void> {
    const projects = await this.getProjects();
    projects[projectPath] = config;
    await fs.writeFile(this.projectsFile, JSON.stringify({ projects }, null, 2));
  }

  async getSettings(): Promise<GitConnectConfig> {
    const data = await fs.readFile(this.settingsFile, 'utf-8');
    return JSON.parse(data);
  }

  async saveSettings(settings: GitConnectConfig): Promise<void> {
    await fs.writeFile(this.settingsFile, JSON.stringify(settings, null, 2));
  }

  getSSHKeyPath(accountId: string): string {
    return path.join(this.sshDir, accountId);
  }

  async installGitHook(): Promise<void> {
    // Install as git alias
    try {
      execSync('git config --global alias.push "!gitconnect push"');
    } catch (_e) {
      throw new Error('Failed to install git alias');
    }
  }

  async uninstallGitHook(): Promise<void> {
    try {
      execSync('git config --global --unset alias.push');
    } catch (_e) {
      // Alias might not exist
    }
  }

  async isInitialized(): Promise<boolean> {
    try {
      await fs.access(this.configDir);
      return true;
    } catch {
      return false;
    }
  }
}
