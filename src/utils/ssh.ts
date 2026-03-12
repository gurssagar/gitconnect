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
  inAgent?: boolean;
}

export interface AgentKeyInfo {
  fingerprint: string;
  type: string;
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
   * Validate multiple SSH keys in parallel
   */
  async validateKeysParallel(keyPaths: string[]): Promise<Record<string, { valid: boolean; error?: string }>> {
    const validationPromises = keyPaths.map(async (keyPath) => {
      const result = await this.validateKey(keyPath);
      return [keyPath, result] as const;
    });

    const results = await Promise.all(validationPromises);
    return Object.fromEntries(results);
  }

  /**
   * Test SSH connections to GitHub in parallel
   */
  async testGitHubConnectionsParallel(keyPaths: string[]): Promise<Record<string, { success: boolean; username?: string; error?: string }>> {
    const testPromises = keyPaths.map(async (keyPath) => {
      const result = await this.testGitHubConnection(keyPath);
      return [keyPath, result] as const;
    });

    const results = await Promise.all(testPromises);
    return Object.fromEntries(results);
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

/**
 * SSH Agent integration functions
 */
export const sshAgent = {
  /**
   * Check if SSH agent is running
   */
  isRunning(): boolean {
    try {
      execSync('ssh-add -l', { stdio: 'pipe' });
      return true;
    } catch (error) {
      const err = error as Error & { status?: number };
      // Exit code 1 means agent running but no keys, 2 means agent not running
      return err.status === 1;
    }
  },

  /**
   * List keys currently in SSH agent
   */
  listKeys(): AgentKeyInfo[] {
    try {
      const output = execSync('ssh-add -l', { encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'] });
      return output.trim().split('\n').filter(Boolean).map(line => {
        const parts = line.split(' ');
        return {
          fingerprint: parts[1] || '',
          type: parts[0]?.replace(/[()]/g, '') || '',
          comment: parts.slice(2).join(' ') || undefined,
        };
      });
    } catch {
      return [];
    }
  },

  /**
   * Add a key to SSH agent
   */
  addKey(keyPath: string, ttl?: number): boolean {
    try {
      const ttlFlag = ttl ? `-t ${ttl}` : '';
      execSync(`ssh-add ${ttlFlag} "${keyPath}"`, { stdio: 'pipe' });
      return true;
    } catch {
      return false;
    }
  },

  /**
   * Remove a key from SSH agent
   */
  removeKey(keyPath: string): boolean {
    try {
      execSync(`ssh-add -d "${keyPath}"`, { stdio: 'pipe' });
      return true;
    } catch {
      return false;
    }
  },

  /**
   * Remove all keys from SSH agent
   */
  removeAllKeys(): boolean {
    try {
      execSync('ssh-add -D', { stdio: 'pipe' });
      return true;
    } catch {
      return false;
    }
  },

  /**
   * Check if a specific key is in the agent
   */
  hasKey(keyPath: string): boolean {
    try {
      const output = execSync('ssh-add -l', { encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'] });
      // Get fingerprint of the key file
      const fingerprint = execSync(`ssh-keygen -lf "${keyPath}"`, { encoding: 'utf-8' }).split(' ')[1];
      return output.includes(fingerprint);
    } catch {
      return false;
    }
  },
};

/**
 * Encrypted SSH key storage utilities
 */
export const encryptedKeyStorage = {
  /**
   * Encrypt an SSH key with a passphrase
   */
  async encryptKey(keyPath: string, passphrase: string): Promise<boolean> {
    try {
      // Read the key
      const keyContent = await fs.readFile(keyPath, 'utf-8');

      // Check if already encrypted
      if (keyContent.includes('ENCRYPTED')) {
        return true; // Already encrypted
      }

      // Use ssh-keygen to add a passphrase
      const tempPath = `${keyPath}.tmp`;
      execSync(`ssh-keygen -p -P "" -N "${passphrase}" -f "${keyPath}"`, { stdio: 'pipe' });
      return true;
    } catch {
      return false;
    }
  },

  /**
   * Decrypt an SSH key (remove passphrase)
   */
  async decryptKey(keyPath: string, passphrase: string): Promise<boolean> {
    try {
      execSync(`ssh-keygen -p -P "${passphrase}" -N "" -f "${keyPath}"`, { stdio: 'pipe' });
      return true;
    } catch {
      return false;
    }
  },

  /**
   * Check if a key is encrypted
   */
  async isEncrypted(keyPath: string): Promise<boolean> {
    try {
      const content = await fs.readFile(keyPath, 'utf-8');
      return content.includes('ENCRYPTED');
    } catch {
      return false;
    }
  },

  /**
   * Change passphrase on an encrypted key
   */
  async changePassphrase(keyPath: string, oldPassphrase: string, newPassphrase: string): Promise<boolean> {
    try {
      execSync(`ssh-keygen -p -P "${oldPassphrase}" -N "${newPassphrase}" -f "${keyPath}"`, { stdio: 'pipe' });
      return true;
    } catch {
      return false;
    }
  },
};

/**
 * Key rotation utilities
 */
export const keyRotation = {
  /**
   * Generate a new key to replace an existing one
   */
  async rotateKey(options: {
    oldKeyPath: string;
    email: string;
    username: string;
    backup?: boolean;
  }): Promise<{ newPath: string; publicKey: string; backupPath?: string }> {
    const { oldKeyPath, email, username, backup = true } = options;

    // Backup old key if requested
    let backupPath: string | undefined;
    if (backup) {
      backupPath = `${oldKeyPath}.backup.${Date.now()}`;
      await fs.copyFile(oldKeyPath, backupPath);
      await fs.copyFile(`${oldKeyPath}.pub`, `${backupPath}.pub`);
    }

    // Generate new key with timestamp
    const sshDir = path.dirname(oldKeyPath);
    const newKeyPath = path.join(sshDir, `gitconnect_${username}_${Date.now()}`);

    // Generate new key
    execSync(`ssh-keygen -t ed25519 -C "${email}" -f "${newKeyPath}" -N ""`, { stdio: 'pipe' });

    // Read public key
    const publicKey = (await fs.readFile(`${newKeyPath}.pub`, 'utf-8')).trim();

    return { newPath: newKeyPath, publicKey, backupPath };
  },

  /**
   * Get key age in days
   */
  async getKeyAge(keyPath: string): Promise<number | null> {
    try {
      const stats = await fs.stat(keyPath);
      const ageMs = Date.now() - stats.mtimeMs;
      return Math.floor(ageMs / (1000 * 60 * 60 * 24));
    } catch {
      return null;
    }
  },

  /**
   * Check if key should be rotated based on age
   */
  async shouldRotate(keyPath: string, maxAgeDays: number = 90): Promise<boolean> {
    const age = await this.getKeyAge(keyPath);
    return age !== null && age > maxAgeDays;
  },

  /**
   * List keys that need rotation
   */
  async listKeysNeedingRotation(keys: string[], maxAgeDays: number = 90): Promise<Array<{ path: string; age: number }>> {
    const result: Array<{ path: string; age: number }> = [];

    for (const keyPath of keys) {
      const age = await this.getKeyAge(keyPath);
      if (age !== null && age > maxAgeDays) {
        result.push({ path: keyPath, age });
      }
    }

    return result;
  },

  /**
   * Clean up old backup keys
   */
  async cleanupBackups(keyPath: string, keepCount: number = 3): Promise<number> {
    const dir = path.dirname(keyPath);
    const baseName = path.basename(keyPath);
    const files = await fs.readdir(dir);

    // Find backup files
    const backups = files
      .filter(f => f.startsWith(`${baseName}.backup.`))
      .sort()
      .reverse();

    // Remove old backups
    let removed = 0;
    for (let i = keepCount; i < backups.length; i++) {
      await fs.unlink(path.join(dir, backups[i]));
      await fs.unlink(path.join(dir, `${backups[i]}.pub`)).catch(() => {});
      removed++;
    }

    return removed;
  },
};

/**
 * Platform-specific secure storage
 */
export const secureStorage = {
  /**
   * Store passphrase in macOS Keychain
   */
  async storePassphraseMacOS(keyPath: string, passphrase: string): Promise<boolean> {
    try {
      const serviceName = 'gitconnect';
      const accountName = path.basename(keyPath);
      execSync(`security add-generic-password -s "${serviceName}" -a "${accountName}" -w "${passphrase}" -U`, { stdio: 'pipe' });
      return true;
    } catch {
      return false;
    }
  },

  /**
   * Retrieve passphrase from macOS Keychain
   */
  async getPassphraseMacOS(keyPath: string): Promise<string | null> {
    try {
      const serviceName = 'gitconnect';
      const accountName = path.basename(keyPath);
      const output = execSync(`security find-generic-password -s "${serviceName}" -a "${accountName}" -w`, { encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'] });
      return output.trim();
    } catch {
      return null;
    }
  },

  /**
   * Delete passphrase from macOS Keychain
   */
  async deletePassphraseMacOS(keyPath: string): Promise<boolean> {
    try {
      const serviceName = 'gitconnect';
      const accountName = path.basename(keyPath);
      execSync(`security delete-generic-password -s "${serviceName}" -a "${accountName}"`, { stdio: 'pipe' });
      return true;
    } catch {
      return false;
    }
  },

  /**
   * Store passphrase in Linux secret service (via secret-tool)
   */
  async storePassphraseLinux(keyPath: string, passphrase: string): Promise<boolean> {
    try {
      const label = `gitconnect:${path.basename(keyPath)}`;
      execSync(`echo "${passphrase}" | secret-tool store --label="${label}" service gitconnect key "${path.basename(keyPath)}"`, { stdio: 'pipe' });
      return true;
    } catch {
      return false;
    }
  },

  /**
   * Retrieve passphrase from Linux secret service
   */
  async getPassphraseLinux(keyPath: string): Promise<string | null> {
    try {
      const output = execSync(`secret-tool lookup service gitconnect key "${path.basename(keyPath)}"`, { encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'] });
      return output.trim() || null;
    } catch {
      return null;
    }
  },

  /**
   * Delete passphrase from Linux secret service
   */
  async deletePassphraseLinux(keyPath: string): Promise<boolean> {
    try {
      execSync(`secret-tool clear service gitconnect key "${path.basename(keyPath)}"`, { stdio: 'pipe' });
      return true;
    } catch {
      return false;
    }
  },

  /**
   * Detect platform and store passphrase appropriately
   */
  async storePassphrase(keyPath: string, passphrase: string): Promise<boolean> {
    const platform = os.platform();
    if (platform === 'darwin') {
      return this.storePassphraseMacOS(keyPath, passphrase);
    } else if (platform === 'linux') {
      return this.storePassphraseLinux(keyPath, passphrase);
    }
    return false;
  },

  /**
   * Detect platform and retrieve passphrase
   */
  async getPassphrase(keyPath: string): Promise<string | null> {
    const platform = os.platform();
    if (platform === 'darwin') {
      return this.getPassphraseMacOS(keyPath);
    } else if (platform === 'linux') {
      return this.getPassphraseLinux(keyPath);
    }
    return null;
  },

  /**
   * Detect platform and delete passphrase
   */
  async deletePassphrase(keyPath: string): Promise<boolean> {
    const platform = os.platform();
    if (platform === 'darwin') {
      return this.deletePassphraseMacOS(keyPath);
    } else if (platform === 'linux') {
      return this.deletePassphraseLinux(keyPath);
    }
    return false;
  },
};