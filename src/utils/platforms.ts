/**
 * Multi-Platform Git Support (GitLab, Bitbucket)
 */

import { execSync } from 'child_process';

export type GitPlatform = 'github' | 'gitlab' | 'bitbucket' | 'github-enterprise';

export interface PlatformConfig {
  name: string;
  sshHost: string;
  apiBase: string;
  webBase: string;
}

export const platforms: Record<string, PlatformConfig> = {
  github: {
    name: 'GitHub',
    sshHost: 'github.com',
    apiBase: 'https://api.github.com',
    webBase: 'https://github.com',
  },
  gitlab: {
    name: 'GitLab',
    sshHost: 'gitlab.com',
    apiBase: 'https://gitlab.com/api/v4',
    webBase: 'https://gitlab.com',
  },
  bitbucket: {
    name: 'Bitbucket',
    sshHost: 'bitbucket.org',
    apiBase: 'https://api.bitbucket.org/2.0',
    webBase: 'https://bitbucket.org',
  },
};

export const platformManager = {
  /**
   * Detect platform from remote URL
   */
  detectPlatform(remoteUrl: string): GitPlatform {
    if (remoteUrl.includes('github.com')) return 'github';
    if (remoteUrl.includes('gitlab.com')) return 'gitlab';
    if (remoteUrl.includes('bitbucket.org')) return 'bitbucket';
    return 'github-enterprise';
  },

  /**
   * Get platform config
   */
  getPlatform(platform: GitPlatform): PlatformConfig | null {
    if (platform === 'github-enterprise') return null;
    return platforms[platform] || null;
  },

  /**
   * Test SSH connection to platform
   */
  async testConnection(platform: GitPlatform, keyPath: string, host?: string): Promise<{ success: boolean; username?: string }> {
    const sshHost = host || platforms[platform]?.sshHost || 'github.com';

    try {
      const cmd = `ssh -i "${keyPath}" -o IdentitiesOnly=yes -o StrictHostKeyChecking=no -T git@${sshHost} 2>&1`;
      execSync(cmd, { encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'] });
      return { success: true };
    } catch (error: unknown) {
      const execError = error as Error & { stdout?: string; stderr?: string };
      const output = execError.stdout || execError.stderr || '';

      // GitHub: "Hi username! You've successfully authenticated"
      const ghMatch = output.match(/Hi\s+(\w+)!.*authenticated/);
      if (ghMatch) return { success: true, username: ghMatch[1] };

      // GitLab: "Welcome to GitLab, @username!"
      const glMatch = output.match(/Welcome to GitLab, @(\w+)/);
      if (glMatch) return { success: true, username: glMatch[1] };

      // Bitbucket: "logged in as username"
      const bbMatch = output.match(/logged in as (\w+)/);
      if (bbMatch) return { success: true, username: bbMatch[1] };

      if (output.includes('authenticated') || output.includes('logged in')) {
        return { success: true };
      }

      return { success: false };
    }
  },

  /**
   * Get SSH key URL for adding to platform
   */
  getAddKeyUrl(platform: GitPlatform, host?: string): string {
    switch (platform) {
    case 'github':
      return 'https://github.com/settings/ssh/new';
    case 'gitlab':
      return 'https://gitlab.com/-/profile/keys';
    case 'bitbucket':
      return 'https://bitbucket.org/account/settings/ssh-keys/';
    default:
      return host ? `https://${host}/settings/ssh` : '';
    }
  },
};