import simpleGit, { SimpleGit } from 'simple-git';
import * as path from 'path';
import { GitInfo, PushResult } from '../types';

export class GitManager {
  private git: SimpleGit;
  private projectPath: string;

  constructor(projectPath: string = process.cwd()) {
    this.projectPath = projectPath;
    this.git = simpleGit(projectPath);
  }

  async getGitInfo(): Promise<GitInfo> {
    try {
      const isRepo = await this.git.checkIsRepo();
      
      if (!isRepo) {
        return {
          isGitRepo: false,
          projectPath: this.projectPath,
        };
      }

      const remotes = await this.git.getRemotes(true);
      const status = await this.git.status();
      
      const originRemote = remotes.find(r => r.name === 'origin');
      
      return {
        isGitRepo: true,
        remoteUrl: originRemote?.refs?.fetch,
        currentBranch: status.current,
        projectPath: this.projectPath,
      };
    } catch (error) {
      return {
        isGitRepo: false,
        projectPath: this.projectPath,
      };
    }
  }

  async setIdentity(username: string, email: string): Promise<void> {
    await this.git.addConfig('user.name', username, false, 'local');
    await this.git.addConfig('user.email', email, false, 'local');
  }

  async getIdentity(): Promise<{ name: string; email: string } | null> {
    try {
      const name = await this.git.getConfig('user.name');
      const email = await this.git.getConfig('user.email');
      
      if (name.value && email.value) {
        return {
          name: name.value,
          email: email.value,
        };
      }
      return null;
    } catch {
      return null;
    }
  }

  async push(options: {
    remote?: string;
    branch?: string;
    sshKey?: string;
  } = {}): Promise<PushResult> {
    const { remote = 'origin', branch, sshKey } = options;
    
    try {
      let pushOptions: string[] = [];
      
      if (branch) {
        pushOptions.push(remote, branch);
      } else {
        pushOptions.push(remote);
      }

      // If SSH key provided, use it
      if (sshKey) {
        const env = {
          ...process.env,
          GIT_SSH_COMMAND: `ssh -i ${sshKey} -o IdentitiesOnly=yes`,
        };
        
        const result = await this.git.push(remote, branch, {
          '--set-upstream': null,
        });
        
        return {
          success: true,
          output: result.pushed?.[0]?.local || 'Pushed successfully',
        };
      }

      const result = await this.git.push(remote, branch);
      
      return {
        success: true,
        output: result.pushed?.[0]?.local || 'Pushed successfully',
      };
    } catch (error: any) {
      return {
        success: false,
        output: '',
        error: error.message,
      };
    }
  }

  async detectGitHubOwner(): Promise<string | null> {
    try {
      const remotes = await this.git.getRemotes(true);
      const origin = remotes.find(r => r.name === 'origin');
      
      if (!origin?.refs?.fetch) return null;
      
      // Parse GitHub URL
      const url = origin.refs.fetch;
      
      // Handle HTTPS: https://github.com/owner/repo.git
      if (url.includes('github.com')) {
        const match = url.match(/github\.com[:/]([^/]+)/);
        return match?.[1] || null;
      }
      
      // Handle SSH: git@github.com:owner/repo.git
      if (url.includes('git@github.com')) {
        const match = url.match(/:([^/]+)/);
        return match?.[1] || null;
      }
      
      return null;
    } catch {
      return null;
    }
  }

  async hasChangesToPush(): Promise<boolean> {
    try {
      const status = await this.git.status();
      return status.ahead > 0;
    } catch {
      return false;
    }
  }
}
