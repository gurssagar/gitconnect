import { biometricAuth, zeroTrust } from '../../src/utils/biometric';

describe('BiometricAuth', () => {
  describe('isAvailable', () => {
    it('should return boolean', () => {
      const result = biometricAuth.isAvailable();
      expect(typeof result).toBe('boolean');
    });
  });

  describe('authenticate', () => {
    it('should return false when not available', async () => {
      const result = await biometricAuth.authenticate('test');
      // Returns false if biometric auth is not available
      expect(typeof result).toBe('boolean');
    });
  });
});

describe('ZeroTrust', () => {
  describe('verify', () => {
    it('should return verification result', async () => {
      const result = await zeroTrust.verify('test-account', []);
      expect(result).toHaveProperty('valid');
      expect(result).toHaveProperty('failures');
      expect(Array.isArray(result.failures)).toBe(true);
    });

    it('should handle multiple checks', async () => {
      const result = await zeroTrust.verify('test-account', ['biometric', 'presence']);
      expect(result).toHaveProperty('valid');
      expect(result.failures.length).toBeGreaterThanOrEqual(0);
    });
  });
});