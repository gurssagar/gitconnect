import { platformManager } from '../../src/utils/platforms';

describe('PlatformManager', () => {
  describe('detectPlatform', () => {
    it('should detect GitHub from SSH URL', () => {
      const platform = platformManager.detectPlatform('git@github.com:org/repo.git');
      expect(platform).toBe('github');
    });

    it('should detect GitHub from HTTPS URL', () => {
      const platform = platformManager.detectPlatform('https://github.com/org/repo.git');
      expect(platform).toBe('github');
    });

    it('should detect GitLab from SSH URL', () => {
      const platform = platformManager.detectPlatform('git@gitlab.com:org/repo.git');
      expect(platform).toBe('gitlab');
    });

    it('should detect GitLab from HTTPS URL', () => {
      const platform = platformManager.detectPlatform('https://gitlab.com/org/repo.git');
      expect(platform).toBe('gitlab');
    });

    it('should detect Bitbucket from SSH URL', () => {
      const platform = platformManager.detectPlatform('git@bitbucket.org:org/repo.git');
      expect(platform).toBe('bitbucket');
    });

    it('should detect Bitbucket from HTTPS URL', () => {
      const platform = platformManager.detectPlatform('https://bitbucket.org/org/repo.git');
      expect(platform).toBe('bitbucket');
    });

    it('should return github-enterprise for unrecognized URLs', () => {
      const platform = platformManager.detectPlatform('git@unknown.com:org/repo.git');
      expect(platform).toBe('github-enterprise');
    });
  });

  describe('getPlatform', () => {
    it('should return GitHub config', () => {
      const config = platformManager.getPlatform('github');
      expect(config).toBeDefined();
      expect(config?.name).toBe('GitHub');
    });

    it('should return GitLab config', () => {
      const config = platformManager.getPlatform('gitlab');
      expect(config).toBeDefined();
      expect(config?.name).toBe('GitLab');
    });

    it('should return Bitbucket config', () => {
      const config = platformManager.getPlatform('bitbucket');
      expect(config).toBeDefined();
      expect(config?.name).toBe('Bitbucket');
    });

    it('should return null for invalid platform', () => {
      const config = platformManager.getPlatform('invalid' as 'github');
      expect(config).toBeNull();
    });
  });

  describe('getAddKeyURL', () => {
    it('should return GitHub key URL', () => {
      const url = platformManager.getAddKeyUrl('github');
      expect(url).toContain('github.com');
      expect(url).toContain('ssh');
    });

    it('should return GitLab key URL', () => {
      const url = platformManager.getAddKeyUrl('gitlab');
      expect(url).toContain('gitlab.com');
      expect(url).toContain('keys');
    });

    it('should return Bitbucket key URL', () => {
      const url = platformManager.getAddKeyUrl('bitbucket');
      expect(url).toContain('bitbucket.org');
      expect(url).toContain('ssh-keys');
    });
  });
});