import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';
import { teamManager } from '../../src/utils/team';

// Mock fs/promises
jest.mock('fs/promises');

describe('TeamManager', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('exportConfig', () => {
    it('should create team configuration', async () => {
      (fs.readFile as jest.Mock).mockResolvedValue(JSON.stringify({ accounts: [] }));
      (fs.readdir as jest.Mock).mockRejectedValue(new Error('No templates'));
      (fs.writeFile as jest.Mock).mockResolvedValue(undefined);

      await teamManager.exportConfig('/tmp/test-config.json');

      expect(fs.writeFile).toHaveBeenCalled();
      const writtenContent = (fs.writeFile as jest.Mock).mock.calls[0][1];
      const config = JSON.parse(writtenContent);
      expect(config).toHaveProperty('name', 'team-config');
      expect(config).toHaveProperty('accounts');
      expect(config).toHaveProperty('templates');
      expect(config).toHaveProperty('createdAt');
    });
  });

  describe('importConfig', () => {
    it('should return count of imported accounts', async () => {
      const testConfig = {
        name: 'team-config',
        accounts: [
          { username: 'user1', email: 'user1@example.com' },
          { username: 'user2', email: 'user2@example.com' },
        ],
        templates: {},
        createdAt: new Date().toISOString(),
      };

      (fs.readFile as jest.Mock).mockResolvedValue(JSON.stringify(testConfig));

      // Mock execSync - this would normally call gitconnect account add
      const execSync = require('child_process').execSync;
      jest.spyOn(require('child_process'), 'execSync').mockImplementation(() => '');

      const count = await teamManager.importConfig('/tmp/test-config.json');
      expect(typeof count).toBe('number');
    });
  });
});