import { ConfigManager } from '../../src/core/config';
import * as fs from 'fs/promises';
import * as path from 'path';

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

describe('ConfigManager', () => {
  let configManager: ConfigManager;
  const testHomeDir = '/home/test';
  const configDir = path.join(testHomeDir, '.gitconnect');

  beforeEach(() => {
    jest.clearAllMocks();
    configManager = new ConfigManager();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('init', () => {
    it('should create config directory with correct permissions', async () => {
      mockedFs.mkdir.mockResolvedValue(undefined);
      mockedFs.access.mockRejectedValue(new Error('File not found'));
      mockedFs.writeFile.mockResolvedValue(undefined);

      await configManager.init();

      expect(mockedFs.mkdir).toHaveBeenCalledWith(configDir, {
        recursive: true,
        mode: 0o700,
      });
    });

    it('should create ssh directory', async () => {
      mockedFs.mkdir.mockResolvedValue(undefined);
      mockedFs.access.mockRejectedValue(new Error('File not found'));
      mockedFs.writeFile.mockResolvedValue(undefined);

      await configManager.init();

      const sshDir = path.join(configDir, 'ssh');
      expect(mockedFs.mkdir).toHaveBeenCalledWith(sshDir, {
        recursive: true,
        mode: 0o700,
      });
    });

    it('should initialize empty config files', async () => {
      mockedFs.mkdir.mockResolvedValue(undefined);
      mockedFs.access.mockRejectedValue(new Error('File not found'));
      mockedFs.writeFile.mockResolvedValue(undefined);

      await configManager.init();

      // Check accounts file includes version
      expect(mockedFs.writeFile).toHaveBeenCalledWith(
        path.join(configDir, 'accounts.json'),
        JSON.stringify({ accounts: [], version: '1.0.0' }, null, 2),
        { mode: 0o600 }
      );

      // Check projects file includes version
      expect(mockedFs.writeFile).toHaveBeenCalledWith(
        path.join(configDir, 'projects.json'),
        JSON.stringify({ projects: {}, version: '1.0.0' }, null, 2),
        { mode: 0o600 }
      );

      // Check settings file includes version
      expect(mockedFs.writeFile).toHaveBeenCalledWith(
        path.join(configDir, 'settings.json'),
        JSON.stringify({ defaultMode: 'prompt', version: '1.0.0' }, null, 2),
        { mode: 0o600 }
      );
    });
  });

  describe('getAccounts', () => {
    it('should return empty array when no accounts', async () => {
      mockedFs.readFile.mockResolvedValue(JSON.stringify({ accounts: [] }));

      const accounts = await configManager.getAccounts();

      expect(accounts).toEqual([]);
    });

    it('should return stored accounts', async () => {
      const mockAccounts = [
        {
          id: 'abc123',
          username: 'testuser',
          email: 'test@example.com',
          sshKey: '/path/to/key',
          createdAt: '2024-01-01T00:00:00.000Z',
        },
      ];
      mockedFs.readFile.mockResolvedValue(JSON.stringify({ accounts: mockAccounts }));

      const accounts = await configManager.getAccounts();

      expect(accounts).toEqual(mockAccounts);
    });
  });

  describe('saveAccount', () => {
    it('should add new account', async () => {
      const newAccount = {
        id: 'new123',
        username: 'newuser',
        email: 'new@example.com',
        sshKey: '/path/to/new/key',
        createdAt: new Date().toISOString(),
      };

      mockedFs.readFile.mockResolvedValue(JSON.stringify({ accounts: [] }));
      mockedFs.writeFile.mockResolvedValue(undefined);

      await configManager.saveAccount(newAccount);

      expect(mockedFs.writeFile).toHaveBeenCalledWith(
        path.join(configDir, 'accounts.json'),
        JSON.stringify({ accounts: [newAccount], version: '1.0.0' }, null, 2)
      );
    });

    it('should update existing account', async () => {
      const existingAccount = {
        id: 'abc123',
        username: 'testuser',
        email: 'test@example.com',
        sshKey: '/path/to/key',
        createdAt: '2024-01-01T00:00:00.000Z',
      };

      const updatedAccount = {
        ...existingAccount,
        email: 'updated@example.com',
      };

      mockedFs.readFile.mockResolvedValue(
        JSON.stringify({ accounts: [existingAccount] })
      );
      mockedFs.writeFile.mockResolvedValue(undefined);

      await configManager.saveAccount(updatedAccount);

      expect(mockedFs.writeFile).toHaveBeenCalledWith(
        path.join(configDir, 'accounts.json'),
        JSON.stringify({ accounts: [updatedAccount], version: '1.0.0' }, null, 2)
      );
    });
  });

  describe('removeAccount', () => {
    it('should remove account by id', async () => {
      const account = {
        id: 'abc123',
        username: 'testuser',
        email: 'test@example.com',
        sshKey: '/path/to/key',
        createdAt: '2024-01-01T00:00:00.000Z',
      };

      mockedFs.readFile.mockResolvedValue(
        JSON.stringify({ accounts: [account] })
      );
      mockedFs.writeFile.mockResolvedValue(undefined);

      const result = await configManager.removeAccount('abc123');

      expect(result).toBe(true);
      expect(mockedFs.writeFile).toHaveBeenCalledWith(
        path.join(configDir, 'accounts.json'),
        JSON.stringify({ accounts: [], version: '1.0.0' }, null, 2)
      );
    });

    it('should return false when account not found', async () => {
      mockedFs.readFile.mockResolvedValue(JSON.stringify({ accounts: [] }));

      const result = await configManager.removeAccount('nonexistent');

      expect(result).toBe(false);
    });
  });

  describe('getAccount', () => {
    it('should return account by id', async () => {
      const account = {
        id: 'abc123',
        username: 'testuser',
        email: 'test@example.com',
        sshKey: '/path/to/key',
        createdAt: '2024-01-01T00:00:00.000Z',
      };

      mockedFs.readFile.mockResolvedValue(
        JSON.stringify({ accounts: [account] })
      );

      const result = await configManager.getAccount('abc123');

      expect(result).toEqual(account);
    });

    it('should return undefined when account not found', async () => {
      mockedFs.readFile.mockResolvedValue(JSON.stringify({ accounts: [] }));

      const result = await configManager.getAccount('nonexistent');

      expect(result).toBeUndefined();
    });
  });

  describe('getProjectConfig', () => {
    it('should return project config', async () => {
      const projectConfig = {
        account: 'abc123',
        mode: 'auto' as const,
        addedAt: '2024-01-01T00:00:00.000Z',
      };

      mockedFs.readFile.mockResolvedValue(
        JSON.stringify({ projects: { '/path/to/project': projectConfig } })
      );

      const result = await configManager.getProjectConfig('/path/to/project');

      expect(result).toEqual(projectConfig);
    });

    it('should return undefined when project not configured', async () => {
      mockedFs.readFile.mockResolvedValue(JSON.stringify({ projects: {} }));

      const result = await configManager.getProjectConfig('/path/to/project');

      expect(result).toBeUndefined();
    });
  });

  describe('setProjectConfig', () => {
    it('should save project config', async () => {
      const projectConfig = {
        account: 'abc123',
        mode: 'auto' as const,
        addedAt: new Date().toISOString(),
      };

      mockedFs.readFile.mockResolvedValue(JSON.stringify({ projects: {} }));
      mockedFs.writeFile.mockResolvedValue(undefined);

      await configManager.setProjectConfig('/path/to/project', projectConfig);

      expect(mockedFs.writeFile).toHaveBeenCalledWith(
        path.join(configDir, 'projects.json'),
        JSON.stringify(
          { projects: { '/path/to/project': projectConfig }, version: '1.0.0' },
          null,
          2
        )
      );
    });
  });

  describe('getSettings', () => {
    it('should return settings', async () => {
      const settings = { defaultMode: 'auto' as const };
      mockedFs.readFile.mockResolvedValue(JSON.stringify(settings));

      const result = await configManager.getSettings();

      expect(result).toEqual(settings);
    });
  });

  describe('isInitialized', () => {
    it('should return true when config dir exists', async () => {
      mockedFs.access.mockResolvedValue(undefined);

      const result = await configManager.isInitialized();

      expect(result).toBe(true);
    });

    it('should return false when config dir does not exist', async () => {
      mockedFs.access.mockRejectedValue(new Error('Not found'));

      const result = await configManager.isInitialized();

      expect(result).toBe(false);
    });
  });

  describe('getSSHKeyPath', () => {
    it('should return correct ssh key path', () => {
      const accountId = 'abc123';
      const expectedPath = path.join(configDir, 'ssh', accountId);

      const result = configManager.getSSHKeyPath(accountId);

      expect(result).toBe(expectedPath);
    });
  });
});