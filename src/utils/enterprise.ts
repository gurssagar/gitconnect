/**
 * GitHub Enterprise Server Support
 */

import { execSync } from 'child_process';

export interface GitHubEnterpriseConfig {
  host: string;
  apiBase: string;
  sshHost: string;
}

export const gitHubEnterprise = {
  /**
   * Detect if running in GitHub Enterprise
   */
  detectEnterprise(): GitHubEnterpriseConfig | null {
    try {
      const remoteUrl = execSync('git remote get-url origin', { encoding: 'utf-8' }).trim();

      // Check for enterprise SSH format: git@ghe.company.com:org/repo.git
      const sshMatch = remoteUrl.match(/git@([^:]+):/);
      if (sshMatch && !sshMatch[1].includes('github.com')) {
        const host = sshMatch[1];
        return {
          host,
          apiBase: `https://${host}/api/v3`,
          sshHost: host,
        };
      }

      // Check for enterprise HTTPS format: https://ghe.company.com/org/repo.git
      const httpsMatch = remoteUrl.match(/https?:\/\/([^/]+)/);
      if (httpsMatch && !httpsMatch[1].includes('github.com')) {
        const host = httpsMatch[1];
        return {
          host,
          apiBase: `https://${host}/api/v3`,
          sshHost: host,
        };
      }

      return null;
    } catch {
      return null;
    }
  },

  /**
   * Test SSH connection to GitHub Enterprise
   */
  async testConnection(host: string, keyPath: string): Promise<{ success: boolean; error?: string }> {
    try {
      const cmd = `ssh -i "${keyPath}" -o IdentitiesOnly=yes -o StrictHostKeyChecking=no -T git@${host} 2>&1`;
      execSync(cmd, { encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'] });
      return { success: true };
    } catch (error: unknown) {
      const execError = error as Error & { stdout?: string; stderr?: string };
      const output = execError.stdout || execError.stderr || '';
      if (output.includes('authenticated')) {
        return { success: true };
      }
      return { success: false, error: output || 'Connection failed' };
    }
  },

  /**
   * Get API endpoint for enterprise host
   */
  getApiEndpoint(host: string): string {
    return `https://${host}/api/v3`;
  },

  /**
   * Configure git for enterprise host
   */
  configureForEnterprise(host: string, keyPath: string): void {
    // Add SSH config entry
    const sshConfig = `Host ${host}
  HostName ${host}
  User git
  IdentityFile ${keyPath}
  IdentitiesOnly yes
`;
    // Note: In production, this would append to ~/.ssh/config
  },
};