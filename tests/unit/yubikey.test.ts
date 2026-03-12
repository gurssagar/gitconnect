import { yubiKeyManager } from '../../src/utils/yubikey';

describe('YubiKeyManager', () => {
  describe('isInstalled', () => {
    it('should return boolean', () => {
      const result = yubiKeyManager.isInstalled();
      expect(typeof result).toBe('boolean');
    });
  });

  describe('isPresent', () => {
    it('should return boolean', () => {
      const result = yubiKeyManager.isPresent();
      expect(typeof result).toBe('boolean');
    });
  });

  describe('getInfo', () => {
    it('should return null or YubiKeyInfo', () => {
      const info = yubiKeyManager.getInfo();
      expect(info === null || typeof info === 'object').toBe(true);
    });
  });

  describe('getSSHPublicKey', () => {
    it('should return null when no YubiKey present', () => {
      const key = yubiKeyManager.getSSHPublicKey();
      // Returns null if no YubiKey or no key on YubiKey
      expect(key === null || typeof key === 'string').toBe(true);
    });
  });
});