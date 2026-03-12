/**
 * Hardware Security Key (YubiKey) Support
 */

import { execSync } from 'child_process';

export interface YubiKeyInfo {
  serial?: string;
  version?: string;
  slots: YubiKeySlot[];
}

export interface YubiKeySlot {
  slot: number;
  type: 'piv' | 'openpgp' | 'fido2';
  loaded: boolean;
}

export const yubiKeyManager = {
  /**
   * Check if YubiKey is connected
   */
  isPresent(): boolean {
    try {
      execSync('ykman info', { stdio: 'pipe' });
      return true;
    } catch {
      return false;
    }
  },

  /**
   * Get YubiKey information
   */
  getInfo(): YubiKeyInfo | null {
    try {
      const output = execSync('ykman info', { encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'] });
      const serialMatch = output.match(/Serial:\s*(\d+)/);
      const versionMatch = output.match(/Firmware version:\s*([\d.]+)/);

      return {
        serial: serialMatch?.[1],
        version: versionMatch?.[1],
        slots: [
          { slot: 1, type: 'piv', loaded: output.includes('PIV') },
          { slot: 2, type: 'openpgp', loaded: output.includes('OpenPGP') },
          { slot: 3, type: 'fido2', loaded: output.includes('FIDO2') },
        ],
      };
    } catch {
      return null;
    }
  },

  /**
   * Generate SSH key on YubiKey
   */
  generateSSHKey(slot: string = '9a', comment?: string): string | null {
    try {
      const cmd = `ykman piv keys generate --algorithm ed25519 ${slot} -`;
      const output = execSync(cmd, { encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'] });
      return comment ? `${output.trim()} ${comment}` : output.trim();
    } catch {
      return null;
    }
  },

  /**
   * Get SSH public key from YubiKey
   */
  getSSHPublicKey(): string | null {
    try {
      const output = execSync('ssh-keygen -D /usr/lib/libykcs11.so', { encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'] });
      return output.trim();
    } catch {
      return null;
    }
  },

  /**
   * Check if ykman is installed
   */
  isInstalled(): boolean {
    try {
      execSync('ykman --version', { stdio: 'pipe' });
      return true;
    } catch {
      return false;
    }
  },
};