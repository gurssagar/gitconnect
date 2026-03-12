/**
 * GPG Key Management Utilities
 */

import { execSync } from 'child_process';

export interface GPGKeyInfo {
  keyId: string;
  userId: string;
  email: string;
  createdAt: string;
  expiresAt?: string;
}

export const gpgManager = {
  /**
   * List all GPG keys
   */
  listKeys(): GPGKeyInfo[] {
    try {
      const output = execSync('gpg --list-keys --keyid-format LONG', { encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'] });
      const keys: GPGKeyInfo[] = [];
      const lines = output.split('\n');

      let currentKey: Partial<GPGKeyInfo> | null = null;

      for (const line of lines) {
        // Match key line: sec   ed25519/ABC123... 2024-01-01 [SC] [expires: 2026-01-01]
        const keyMatch = line.match(/^sec\s+\w+\/([A-F0-9]+)\s+(\d{4}-\d{2}-\d{2})/);
        if (keyMatch) {
          if (currentKey?.keyId) {
            keys.push(currentKey as GPGKeyInfo);
          }
          currentKey = {
            keyId: keyMatch[1],
            createdAt: keyMatch[2],
          };
          // Check for expiration
          const expiresMatch = line.match(/\[expires:\s*(\d{4}-\d{2}-\d{2})\]/);
          if (expiresMatch) {
            currentKey.expiresAt = expiresMatch[1];
          }
          continue;
        }

        // Match uid line: uid        [ultimate] John Doe <john@example.com>
        const uidMatch = line.match(/^uid\s+\[.*\]\s+(.+?)\s+<(.+?)>/);
        if (uidMatch && currentKey) {
          currentKey.userId = uidMatch[1];
          currentKey.email = uidMatch[2];
        }
      }

      if (currentKey?.keyId) {
        keys.push(currentKey as GPGKeyInfo);
      }

      return keys;
    } catch {
      return [];
    }
  },

  /**
   * Get GPG key for an email
   */
  getKeyForEmail(email: string): GPGKeyInfo | null {
    const keys = this.listKeys();
    return keys.find(k => k.email === email) || null;
  },

  /**
   * Export public key
   */
  exportPublicKey(keyId: string): string | null {
    try {
      return execSync(`gpg --armor --export ${keyId}`, { encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'] });
    } catch {
      return null;
    }
  },

  /**
   * Sign a commit with GPG
   */
  signCommit(keyId: string): void {
    execSync(`git config user.signingkey ${keyId}`, { stdio: 'pipe' });
    execSync('git config commit.gpgsign true', { stdio: 'pipe' });
    execSync('git config gpg.program gpg', { stdio: 'pipe' });
  },

  /**
   * Disable GPG signing
   */
  disableSigning(): void {
    execSync('git config --unset commit.gpgsign', { stdio: 'pipe' });
  },

  /**
   * Check if GPG is available
   */
  isAvailable(): boolean {
    try {
      execSync('gpg --version', { stdio: 'pipe' });
      return true;
    } catch {
      return false;
    }
  },

  /**
   * Generate a new GPG key
   */
  generateKey(name: string, email: string, passphrase?: string): string | null {
    try {
      const batch = `
%echo Generating GPG key
Key-Type: eddsa
Key-Curve: ed25519
Key-Usage: sign
Subkey-Type: ecdh
Subkey-Curve: cv25519
Subkey-Usage: encrypt
Name-Real: ${name}
Name-Email: ${email}
${passphrase ? `Passphrase: ${passphrase}` : '%no-protection'}
Expire-Date: 2y
%commit
%echo Done
`;
      execSync('gpg --batch --generate-key', { input: batch, encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'] });

      // Get the new key ID
      const keys = this.listKeys();
      const newKey = keys.find(k => k.email === email);
      return newKey?.keyId || null;
    } catch {
      return null;
    }
  },
};