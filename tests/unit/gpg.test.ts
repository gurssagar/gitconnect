import { gpgManager } from '../../src/utils/gpg';

describe('GPGManager', () => {
  describe('isAvailable', () => {
    it('should return boolean', () => {
      const result = gpgManager.isAvailable();
      expect(typeof result).toBe('boolean');
    });
  });

  describe('listKeys', () => {
    it('should return an array', () => {
      const keys = gpgManager.listKeys();
      expect(Array.isArray(keys)).toBe(true);
    });
  });

  describe('getKeyForEmail', () => {
    it('should return null for non-existent email', () => {
      const key = gpgManager.getKeyForEmail('nonexistent@example.com');
      expect(key).toBeNull();
    });
  });

  describe('exportPublicKey', () => {
    it('should return string or null for invalid key ID', () => {
      const exported = gpgManager.exportPublicKey('INVALIDKEY');
      // Returns null on error, or empty string if gpg succeeds but finds nothing
      expect(exported === null || typeof exported === 'string').toBe(true);
    });
  });
});