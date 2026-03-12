import { SSHManager } from '../../src/utils/ssh';
import * as fs from 'fs/promises';
import { execSync } from 'child_process';

// Mock fs/promises
jest.mock('fs/promises');
const mockedFs = fs as jest.Mocked<typeof fs>;

// Mock child_process
jest.mock('child_process', () => ({
  execSync: jest.fn(),
}));

// Mock os.homedir
jest.mock('os', () => ({
  ...jest.requireActual('os'),
  homedir: jest.fn(() => '/home/test'),
}));

describe('SSHManager', () => {
  let sshManager: SSHManager;
  const testHomeDir = '/home/test';
  const sshDir = `${testHomeDir}/.ssh`;

  beforeEach(() => {
    jest.clearAllMocks();
    sshManager = new SSHManager();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('generateKey', () => {
    it('should generate ed25519 key by default', async () => {
      mockedFs.mkdir.mockResolvedValue(undefined);
      (execSync as jest.Mock).mockReturnValue(Buffer.from(''));
      mockedFs.readFile.mockResolvedValue('ssh-ed25519 AAAA... test@example.com');

      const result = await sshManager.generateKey({
        email: 'test@example.com',
      });

      expect(result.type).toBe('ed25519');
      expect(result.publicKey).toBe('ssh-ed25519 AAAA... test@example.com');
      expect(result.comment).toBe('test@example.com');
    });

    it('should generate RSA key with specified bits', async () => {
      mockedFs.mkdir.mockResolvedValue(undefined);
      (execSync as jest.Mock).mockReturnValue(Buffer.from(''));
      mockedFs.readFile.mockResolvedValue('ssh-rsa AAAA... test@example.com');

      const result = await sshManager.generateKey({
        email: 'test@example.com',
        type: 'rsa',
        bits: 4096,
      });

      expect(result.type).toBe('rsa');
      expect(execSync).toHaveBeenCalledWith(
        expect.stringContaining('-t rsa -b 4096'),
        expect.any(Object)
      );
    });

    it('should throw error when ssh-keygen fails', async () => {
      mockedFs.mkdir.mockResolvedValue(undefined);
      (execSync as jest.Mock).mockImplementation(() => {
        const error = new Error('Command failed');
        throw error;
      });

      await expect(sshManager.generateKey({
        email: 'test@example.com',
      })).rejects.toThrow('Failed to generate SSH key');
    });
  });

  describe('importKey', () => {
    it('should import existing key successfully', async () => {
      mockedFs.access.mockResolvedValue(undefined);
      mockedFs.readFile.mockResolvedValue('ssh-ed25519 AAAA... comment test@example.com');

      const result = await sshManager.importKey('/home/test/.ssh/id_ed25519');

      expect(result.path).toBe('/home/test/.ssh/id_ed25519');
      expect(result.type).toBe('ed25519');
      expect(result.comment).toBe('comment test@example.com');
    });

    it('should detect RSA key type', async () => {
      mockedFs.access.mockResolvedValue(undefined);
      mockedFs.readFile.mockResolvedValue('ssh-rsa AAAA... test@example.com');

      const result = await sshManager.importKey('/home/test/.ssh/id_rsa');

      expect(result.type).toBe('rsa');
    });

    it('should detect ECDSA key type', async () => {
      mockedFs.access.mockResolvedValue(undefined);
      mockedFs.readFile.mockResolvedValue('ecdsa-sha2-nistp256 AAAA... test@example.com');

      const result = await sshManager.importKey('/home/test/.ssh/id_ecdsa');

      expect(result.type).toBe('ecdsa');
    });

    it('should throw error when key does not exist', async () => {
      mockedFs.access.mockRejectedValue(new Error('File not found'));

      await expect(sshManager.importKey('/home/test/.ssh/nonexistent'))
        .rejects.toThrow('Failed to import SSH key');
    });
  });

  describe('validateKey', () => {
    it('should return valid for key with correct permissions', async () => {
      mockedFs.access.mockResolvedValue(undefined);
      mockedFs.stat.mockResolvedValue({
        mode: 0o100600,
      } as any);

      const result = await sshManager.validateKey('/home/test/.ssh/id_ed25519');

      expect(result.valid).toBe(true);
    });

    it('should return error for wrong permissions', async () => {
      mockedFs.access.mockResolvedValue(undefined);
      mockedFs.stat.mockResolvedValue({
        mode: 0o100644,
      } as any);

      const result = await sshManager.validateKey('/home/test/.ssh/id_ed25519');

      expect(result.valid).toBe(false);
      expect(result.error).toContain('wrong permissions');
    });

    it('should return error when public key not found', async () => {
      mockedFs.access
        .mockResolvedValueOnce(undefined) // private key exists
        .mockRejectedValueOnce(new Error('Not found')); // public key not found

      const result = await sshManager.validateKey('/home/test/.ssh/id_ed25519');

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Public key not found');
    });

    it('should return error when key not found', async () => {
      mockedFs.access.mockRejectedValue(new Error('Not found'));

      const result = await sshManager.validateKey('/home/test/.ssh/nonexistent');

      expect(result.valid).toBe(false);
      expect(result.error).toContain('Key not found');
    });
  });

  describe('testGitHubConnection', () => {
    it('should return success with username on successful auth', async () => {
      const output = 'Hi testuser! You\'ve successfully authenticated, but GitHub does not provide shell access.';
      (execSync as jest.Mock).mockReturnValue(output);

      const result = await sshManager.testGitHubConnection('/home/test/.ssh/id_ed25519');

      expect(result.success).toBe(true);
      expect(result.username).toBe('testuser');
    });

    it('should return error on permission denied', async () => {
      const error = new Error('Command failed') as any;
      error.stdout = 'Permission denied (publickey).';
      (execSync as jest.Mock).mockImplementation(() => {
        throw error;
      });

      const result = await sshManager.testGitHubConnection('/home/test/.ssh/id_ed25519');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Permission denied');
    });

    it('should extract username from error output (GitHub exits with 1)', async () => {
      const error = new Error('Command failed') as any;
      error.stdout = 'Hi testuser! You\'ve successfully authenticated, but GitHub does not provide shell access.';
      (execSync as jest.Mock).mockImplementation(() => {
        throw error;
      });

      const result = await sshManager.testGitHubConnection('/home/test/.ssh/id_ed25519');

      expect(result.success).toBe(true);
      expect(result.username).toBe('testuser');
    });
  });

  describe('getPublicKey', () => {
    it('should return public key content', async () => {
      mockedFs.readFile.mockResolvedValue('ssh-ed25519 AAAA... test@example.com\n');

      const result = await sshManager.getPublicKey('/home/test/.ssh/id_ed25519');

      expect(result).toBe('ssh-ed25519 AAAA... test@example.com');
    });
  });

  describe('listKeys', () => {
    it('should list all SSH keys', async () => {
      mockedFs.readdir.mockResolvedValue([
        'id_ed25519',
        'id_ed25519.pub',
        'id_rsa',
        'known_hosts',
        'config',
      ] as any);

      mockedFs.readFile
        .mockResolvedValueOnce('-----BEGIN OPENSSH PRIVATE KEY-----\ned25519 key\n-----END OPENSSH PRIVATE KEY-----')
        .mockResolvedValueOnce('ssh-ed25519 AAAA... test@example.com')
        .mockResolvedValueOnce('-----BEGIN RSA PRIVATE KEY-----\nrsa key\n-----END RSA PRIVATE KEY-----')
        .mockResolvedValueOnce('ssh-rsa AAAA... test2@example.com');

      const result = await sshManager.listKeys();

      expect(result).toHaveLength(2);
      expect(result[0].type).toBe('ed25519');
      expect(result[1].type).toBe('rsa');
    });

    it('should return empty array when SSH dir does not exist', async () => {
      mockedFs.readdir.mockRejectedValue(new Error('Directory not found'));

      const result = await sshManager.listKeys();

      expect(result).toEqual([]);
    });
  });
});