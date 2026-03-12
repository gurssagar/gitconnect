/**
 * SSH Key Management Utilities
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';
import { execSync } from 'child_process';

export interface SSHKeyInfo {
  path: string;
  publicKey: string;
  type: 'ed25519' | 'rsa' | 'ecdsa' | 'unknown';
  comment?: string;
}

export class SSHManager {
  private sshDir: string;

  constructor() {
    this.sshDir = path.join(os.homedir(), '.ssh');
  }

  /**
   * Generate a new SSH key pair
   */
  async generateKey(options: {
    email: string;
    type?: 'ed25519' | 'rsa' | 'ecdsa';
    outputPath?: string;
    bits?: number;
  }): Promise<SSHKeyInfo> {
    const { email, type = 'ed25519', bits = 4096 } = options;
    
    // Ensure SSH directory exists
    await fs.mkdir(this.sshDir, { recursive: true, mode: 0o700 });

    // Generate key filename
    const keyName = `gitconnect_${email.split('@')[0]}_${Date.now()}`;
    const keyPath = options.outputPath || path.join(this.sshDir, keyName);

    // Build ssh-keygen command
    const typeFlag = type === 'rsa' ? `-t rsa -b ${bits}` : `-t ${type}`;
    const cmd = `ssh-keygen ${typeFlag} -C "${email}" -f "${keyPath}" -N ""`;

    try {
      execSync(cmd, { stdio: 'pipe' });
      
      const publicKey = await fs.readFile(`${keyPath}.pub`, 'utf-8');
      
      return {
        path: keyPath,
        publicKey: publicKey.trim(),
        type,
        comment: email,
      };
    } catch (error: unknown) {
      throw new Error(`Failed to generate SSH key: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Import an existing SSH key
   */
  async importKey(keyPath: string): Promise<SSHKeyInfo> {
    try {
      // Check if key exists
      await fs.access(keyPath);
      
      // Read public key
      const pubKeyPath = `${keyPath}.pub`;
      const publicKey = await fs.readFile(pubKeyPath, 'utf-8');
      
      // Determine key type
      const type = this.detectKeyType(publicKey);
      const comment = this.extractComment(publicKey);

      return {
        path: keyPath,
        publicKey: publicKey.trim(),
        type,
        comment,
      };
    } catch (error: unknown) {
      throw new Error(`Failed to import SSH key: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Validate an SSH key
   */
  async validateKey(keyPath: string): Promise<{ valid: boolean; error?: string }> {
    try {
      // Check if private key exists
      await fs.access(keyPath);
      
      // Check if public key exists
      const pubKeyPath = `${keyPath}.pub`;
      try {
        await fs.access(pubKeyPath);
      } catch {
        return { valid: false, error: 'Public key not found' };
      }

      // Check key permissions (should be 600)
      const stats = await fs.stat(keyPath);
      const mode = stats.mode & 0o777;
      if (mode !== 0o600) {
        return { valid: false, error: `Key has wrong permissions (${mode.toString(8)}). Should be 600.` };
      }

      return { valid: true };
    } catch (_error: unknown) {
      return { valid: false, error: `Key not found: ${keyPath}` };
    }
  }

  /**
   * Test SSH connection to GitHub
   */
  async testGitHubConnection(keyPath: string): Promise<{ success: boolean; username?: string; error?: string }> {
    try {
      const cmd = `ssh -i "${keyPath}" -o IdentitiesOnly=yes -o StrictHostKeyChecking=no -T git@github.com 2>&1`;
      const output = execSync(cmd, { encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'] });
      
      // GitHub returns "Hi username! You've successfully authenticated..."
      const match = output.match(/Hi\s+(\w+)!.*authenticated/);
      if (match) {
        return { success: true, username: match[1] };
      }
      
      return { success: true };
    } catch (error: unknown) {
      // ssh exits with 1 on successful auth (because it's a shell, not a command)
      const execError = error as Error & { stdout?: string; stderr?: string };
      const output = execError.stdout || execError.stderr || (error instanceof Error ? error.message : String(error));
      const match = output.match(/Hi\s+(\w+)!.*authenticated/);
      if (match) {
        return { success: true, username: match[1] };
      }

      // Permission denied
      if (output.includes('Permission denied')) {
        return { success: false, error: 'Permission denied - key not authorized for GitHub' };
      }

      return { success: false, error: output };
    }
  }

  /**
   * Get the public key content
   */
  async getPublicKey(keyPath: string): Promise<string> {
    const pubKeyPath = `${keyPath}.pub`;
    return (await fs.readFile(pubKeyPath, 'utf-8')).trim();
  }

  /**
   * List all SSH keys in ~/.ssh
   */
  async listKeys(): Promise<SSHKeyInfo[]> {
    const keys: SSHKeyInfo[] = [];
    
    try {
      const files = await fs.readdir(this.sshDir);
      
      for (const file of files) {
        // Skip public keys, known_hosts, config, etc.
        if (file.endsWith('.pub') || file === 'known_hosts' || file === 'config' || file.startsWith('.')) {
          continue;
        }
        
        // Check if it's a private key
        const keyPath = path.join(this.sshDir, file);
        try {
          const content = await fs.readFile(keyPath, 'utf-8');
          if (content.includes('BEGIN OPENSSH PRIVATE KEY') || content.includes('BEGIN RSA PRIVATE KEY')) {
            const pubKeyPath = `${keyPath}.pub`;
            let publicKey = '';
            try {
              publicKey = (await fs.readFile(pubKeyPath, 'utf-8')).trim();
            } catch {
              // No public key
            }
            
            keys.push({
              path: keyPath,
              publicKey,
              type: this.detectKeyType(publicKey),
              comment: this.extractComment(publicKey),
            });
          }
        } catch {
          // Not readable or not a key
        }
      }
    } catch {
      // SSH dir doesn't exist
    }

    return keys;
  }

  /**
   * Detect SSH key type from public key
   */
  private detectKeyType(publicKey: string): 'ed25519' | 'rsa' | 'ecdsa' | 'unknown' {
    if (publicKey.startsWith('ssh-ed25519')) return 'ed25519';
    if (publicKey.startsWith('ssh-rsa')) return 'rsa';
    if (publicKey.startsWith('ecdsa-')) return 'ecdsa';
    return 'unknown';
  }

  /**
   * Extract comment from public key
   */
  private extractComment(publicKey: string): string | undefined {
    const parts = publicKey.trim().split(' ');
    return parts.length >= 3 ? parts.slice(2).join(' ') : undefined;
  }
}

export const sshManager = new SSHManager();