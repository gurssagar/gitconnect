import { GitManager } from '../../src/core/git';
import simpleGit from 'simple-git';

// Mock simple-git
jest.mock('simple-git');

describe('GitManager', () => {
  let gitManager: GitManager;
  let mockGit: {
    checkIsRepo: jest.Mock;
    getRemotes: jest.Mock;
    status: jest.Mock;
    addConfig: jest.Mock;
    getConfig: jest.Mock;
    push: jest.Mock;
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockGit = {
      checkIsRepo: jest.fn(),
      getRemotes: jest.fn(),
      status: jest.fn(),
      addConfig: jest.fn(),
      getConfig: jest.fn(),
      push: jest.fn(),
    };
    (simpleGit as jest.Mock).mockReturnValue(mockGit);
    gitManager = new GitManager('/test/project');
  });

  describe('getGitInfo', () => {
    it('should return git info for a valid repo', async () => {
      mockGit.checkIsRepo.mockResolvedValue(true);
      mockGit.getRemotes.mockResolvedValue([
        { name: 'origin', refs: { fetch: 'https://github.com/user/repo.git' } },
      ]);
      mockGit.status.mockResolvedValue({ current: 'main' });

      const result = await gitManager.getGitInfo();

      expect(result).toEqual({
        isGitRepo: true,
        remoteUrl: 'https://github.com/user/repo.git',
        currentBranch: 'main',
        projectPath: '/test/project',
      });
    });

    it('should return isGitRepo false for non-git directory', async () => {
      mockGit.checkIsRepo.mockResolvedValue(false);

      const result = await gitManager.getGitInfo();

      expect(result).toEqual({
        isGitRepo: false,
        projectPath: '/test/project',
      });
    });

    it('should handle errors gracefully', async () => {
      mockGit.checkIsRepo.mockRejectedValue(new Error('Git error'));

      const result = await gitManager.getGitInfo();

      expect(result.isGitRepo).toBe(false);
    });
  });

  describe('setIdentity', () => {
    it('should set local git user.name and user.email', async () => {
      mockGit.addConfig.mockResolvedValue(undefined);

      await gitManager.setIdentity('testuser', 'test@example.com');

      expect(mockGit.addConfig).toHaveBeenCalledWith(
        'user.name',
        'testuser',
        false,
        'local'
      );
      expect(mockGit.addConfig).toHaveBeenCalledWith(
        'user.email',
        'test@example.com',
        false,
        'local'
      );
    });
  });

  describe('getIdentity', () => {
    it('should return identity when configured', async () => {
      mockGit.getConfig
        .mockResolvedValueOnce({ value: 'Test User' })
        .mockResolvedValueOnce({ value: 'test@example.com' });

      const result = await gitManager.getIdentity();

      expect(result).toEqual({
        name: 'Test User',
        email: 'test@example.com',
      });
    });

    it('should return null when not configured', async () => {
      mockGit.getConfig
        .mockResolvedValueOnce({ value: null })
        .mockResolvedValueOnce({ value: null });

      const result = await gitManager.getIdentity();

      expect(result).toBeNull();
    });

    it('should handle errors gracefully', async () => {
      mockGit.getConfig.mockRejectedValue(new Error('Git error'));

      const result = await gitManager.getIdentity();

      expect(result).toBeNull();
    });
  });

  describe('push', () => {
    it('should push successfully', async () => {
      mockGit.push.mockResolvedValue({
        pushed: [{ local: 'main', remote: 'origin/main' }],
      });

      const result = await gitManager.push({ remote: 'origin', branch: 'main' });

      expect(result.success).toBe(true);
      expect(result.output).toBeTruthy();
    });

    it('should return error on push failure', async () => {
      mockGit.push.mockRejectedValue(new Error('Push failed'));

      const result = await gitManager.push({ remote: 'origin', branch: 'main' });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Push failed');
    });
  });

  describe('detectGitHubOwner', () => {
    it('should detect owner from HTTPS URL', async () => {
      mockGit.getRemotes.mockResolvedValue([
        { name: 'origin', refs: { fetch: 'https://github.com/testowner/repo.git' } },
      ]);

      const result = await gitManager.detectGitHubOwner();

      expect(result).toBe('testowner');
    });

    it('should detect owner from SSH URL', async () => {
      mockGit.getRemotes.mockResolvedValue([
        { name: 'origin', refs: { fetch: 'git@github.com:testowner/repo.git' } },
      ]);

      const result = await gitManager.detectGitHubOwner();

      expect(result).toBe('testowner');
    });

    it('should return undefined for non-GitHub remotes', async () => {
      mockGit.getRemotes.mockResolvedValue([
        { name: 'origin', refs: { fetch: 'https://gitlab.com/user/repo.git' } },
      ]);

      const result = await gitManager.detectGitHubOwner();

      expect(result).toBeUndefined();
    });

    it('should return undefined when no remotes', async () => {
      mockGit.getRemotes.mockResolvedValue([]);

      const result = await gitManager.detectGitHubOwner();

      expect(result).toBeUndefined();
    });

    it('should handle errors gracefully', async () => {
      mockGit.getRemotes.mockRejectedValue(new Error('Git error'));

      const result = await gitManager.detectGitHubOwner();

      expect(result).toBeUndefined();
    });
  });

  describe('hasChangesToPush', () => {
    it('should return true when there are commits to push', async () => {
      mockGit.status.mockResolvedValue({ ahead: 3 });

      const result = await gitManager.hasChangesToPush();

      expect(result).toBe(true);
    });

    it('should return false when no commits to push', async () => {
      mockGit.status.mockResolvedValue({ ahead: 0 });

      const result = await gitManager.hasChangesToPush();

      expect(result).toBe(false);
    });

    it('should handle errors gracefully', async () => {
      mockGit.status.mockRejectedValue(new Error('Git error'));

      const result = await gitManager.hasChangesToPush();

      expect(result).toBe(false);
    });
  });
});