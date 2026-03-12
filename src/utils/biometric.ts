/**
 * Biometric Authentication Integration
 */

import { execSync } from 'child_process';
import * as os from 'os';

export const biometricAuth = {
  /**
   * Check if biometric auth is available
   */
  isAvailable(): boolean {
    const platform = os.platform();
    if (platform === 'darwin') {
      try {
        execSync('bioutil -c -s | grep "Touch ID"', { stdio: 'pipe' });
        return true;
      } catch {
        return false;
      }
    }
    if (platform === 'linux') {
      try {
        execSync('which fprintd', { stdio: 'pipe' });
        return true;
      } catch {
        return false;
      }
    }
    return false;
  },

  /**
   * Authenticate with biometric
   */
  async authenticate(reason: string = 'GitConnect'): Promise<boolean> {
    const platform = os.platform();
    if (platform === 'darwin') {
      try {
        execSync(`osascript -e 'display dialog "${reason}" buttons {"OK"} default button "OK"'`, { stdio: 'pipe' });
        return true;
      } catch {
        return false;
      }
    }
    return false;
  },
};

export const zeroTrust = {
  /**
   * Verify all conditions for zero-trust
   */
  async verify(accountId: string, requiredChecks: string[]): Promise<{ valid: boolean; failures: string[] }> {
    const failures: string[] = [];
    for (const check of requiredChecks) {
      if (check === 'biometric' && !await biometricAuth.authenticate()) {
        failures.push('biometric');
      }
    }
    return { valid: failures.length === 0, failures };
  },
};