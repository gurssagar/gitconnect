import { validators, validateOrThrow, promptValidator } from '../../src/utils/validation';

describe('validators', () => {
  describe('username', () => {
    it('should validate correct username', () => {
      const result = validators.username('testuser');
      expect(result.valid).toBe(true);
    });

    it('should validate username with hyphens', () => {
      const result = validators.username('test-user-123');
      expect(result.valid).toBe(true);
    });

    it('should reject empty username', () => {
      const result = validators.username('');
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Username is required');
    });

    it('should reject username with spaces', () => {
      const result = validators.username('test user');
      expect(result.valid).toBe(false);
    });

    it('should reject username longer than 39 characters', () => {
      const longUsername = 'a'.repeat(40);
      const result = validators.username(longUsername);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('39 characters');
    });

    it('should reject username starting with hyphen', () => {
      const result = validators.username('-testuser');
      expect(result.valid).toBe(false);
    });

    it('should reject username ending with hyphen', () => {
      const result = validators.username('testuser-');
      expect(result.valid).toBe(false);
    });
  });

  describe('email', () => {
    it('should validate correct email', () => {
      const result = validators.email('test@example.com');
      expect(result.valid).toBe(true);
    });

    it('should validate email with subdomain', () => {
      const result = validators.email('test@mail.example.com');
      expect(result.valid).toBe(true);
    });

    it('should reject empty email', () => {
      const result = validators.email('');
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Email is required');
    });

    it('should reject email without @', () => {
      const result = validators.email('testexample.com');
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Invalid email format');
    });

    it('should reject email without domain', () => {
      const result = validators.email('test@');
      expect(result.valid).toBe(false);
    });

    it('should reject email with spaces', () => {
      const result = validators.email('test @example.com');
      expect(result.valid).toBe(false);
    });
  });

  describe('accountName', () => {
    it('should validate correct account name', () => {
      const result = validators.accountName('my-account_123');
      expect(result.valid).toBe(true);
    });

    it('should reject empty account name', () => {
      const result = validators.accountName('');
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Account name is required');
    });

    it('should reject account name longer than 50 characters', () => {
      const longName = 'a'.repeat(51);
      const result = validators.accountName(longName);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('50 characters');
    });

    it('should reject account name with special characters', () => {
      const result = validators.accountName('test@account');
      expect(result.valid).toBe(false);
    });
  });

  describe('sshKeyPath', () => {
    it('should validate correct path', () => {
      const result = validators.sshKeyPath('/home/user/.ssh/id_rsa');
      expect(result.valid).toBe(true);
    });

    it('should reject empty path', () => {
      const result = validators.sshKeyPath('');
      expect(result.valid).toBe(false);
      expect(result.error).toBe('SSH key path is required');
    });

    it('should reject path with null byte', () => {
      const result = validators.sshKeyPath('/path/with\0null');
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Invalid path');
    });
  });

  describe('mode', () => {
    it('should validate auto mode', () => {
      const result = validators.mode('auto');
      expect(result.valid).toBe(true);
    });

    it('should validate prompt mode', () => {
      const result = validators.mode('prompt');
      expect(result.valid).toBe(true);
    });

    it('should reject invalid mode', () => {
      const result = validators.mode('invalid');
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Mode must be "auto" or "prompt"');
    });
  });

  describe('gitRemote', () => {
    it('should validate correct remote name', () => {
      const result = validators.gitRemote('origin');
      expect(result.valid).toBe(true);
    });

    it('should validate remote with underscores and hyphens', () => {
      const result = validators.gitRemote('my_remote-1');
      expect(result.valid).toBe(true);
    });

    it('should reject empty remote', () => {
      const result = validators.gitRemote('');
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Remote name is required');
    });

    it('should reject remote with special characters', () => {
      const result = validators.gitRemote('origin@main');
      expect(result.valid).toBe(false);
    });
  });
});

describe('validateOrThrow', () => {
  it('should not throw for valid input', () => {
    expect(() => validateOrThrow(validators.username, 'testuser')).not.toThrow();
  });

  it('should throw for invalid input', () => {
    expect(() => validateOrThrow(validators.username, '')).toThrow('Username is required');
  });
});

describe('promptValidator', () => {
  it('should return true for valid input', () => {
    const validator = promptValidator(validators.username);
    const result = validator('testuser');
    expect(result).toBe(true);
  });

  it('should return error message for invalid input', () => {
    const validator = promptValidator(validators.username);
    const result = validator('');
    expect(result).toBe('Username is required');
  });
});