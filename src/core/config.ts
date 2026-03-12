import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';
import { execSync } from 'child_process';
import { Account, ProjectConfig, GitConnectConfig } from '../types';

const CURRENT_VERSION = '1.0.0';

interface MigrationResult {
  migrated: boolean;
  fromVersion?: string;
  toVersion?: string;
  changes: string[];
}

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
    await this.ensureFile(this.accountsFile, { accounts: [], version: CURRENT_VERSION });
    await this.ensureFile(this.projectsFile, { projects: {}, version: CURRENT_VERSION });
    await this.ensureFile(this.settingsFile, { defaultMode: 'prompt', version: CURRENT_VERSION });

    // Run migrations if needed
    await this.runMigrations();

    console.log('✅ GitConnect initialized');
    console.log(`Config directory: ${this.configDir}`);
  }

  private async ensureFile(filePath: string, defaultContent: unknown): Promise<void> {
    try {
      await fs.access(filePath);
    } catch {
      await fs.writeFile(filePath, JSON.stringify(defaultContent, null, 2), { mode: 0o600 });
    }
  }

  /**
   * Run configuration migrations for version upgrades
   */
  async runMigrations(): Promise<MigrationResult> {
    const result: MigrationResult = { migrated: false, changes: [] };

    try {
      const settings = await this.getSettings();
      const currentVersion = settings.version;

      // No version means pre-1.0.0 config
      if (!currentVersion) {
        result.fromVersion = '0.x';
        result.toVersion = CURRENT_VERSION;
        result.migrated = true;

        // Migration: Add version to all config files
        await this.migrate_0_to_1(result.changes);
      }

      // Future migrations would go here:
      // if (currentVersion === '1.0.0') { await this.migrate_1_to_1_1(); }

    } catch {
      // Config not initialized yet, nothing to migrate
    }

    return result;
  }

  /**
   * Migration from pre-1.0.0 to 1.0.0
   */
  private async migrate_0_to_1(changes: string[]): Promise<void> {
    // Add version to accounts file
    try {
      const accountsData = JSON.parse(await fs.readFile(this.accountsFile, 'utf-8'));
      if (!accountsData.version) {
        accountsData.version = CURRENT_VERSION;
        await fs.writeFile(this.accountsFile, JSON.stringify(accountsData, null, 2));
        changes.push('Added version to accounts.json');
      }
    } catch {
      // File doesn't exist
    }

    // Add version to projects file
    try {
      const projectsData = JSON.parse(await fs.readFile(this.projectsFile, 'utf-8'));
      if (!projectsData.version) {
        projectsData.version = CURRENT_VERSION;
        await fs.writeFile(this.projectsFile, JSON.stringify(projectsData, null, 2));
        changes.push('Added version to projects.json');
      }
    } catch {
      // File doesn't exist
    }

    // Add version and silent mode to settings
    try {
      const settingsData = JSON.parse(await fs.readFile(this.settingsFile, 'utf-8'));
      if (!settingsData.version) {
        settingsData.version = CURRENT_VERSION;
        if (settingsData.silent === undefined) {
          settingsData.silent = false;
        }
        await fs.writeFile(this.settingsFile, JSON.stringify(settingsData, null, 2));
        changes.push('Added version to settings.json');
        changes.push('Added silent mode to settings.json');
      }
    } catch {
      // File doesn't exist
    }
  }

  /**
   * Check if migrations are needed
   */
  async needsMigration(): Promise<boolean> {
    try {
      const settings = await this.getSettings();
      return !settings.version || settings.version !== CURRENT_VERSION;
    } catch {
      return false;
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
