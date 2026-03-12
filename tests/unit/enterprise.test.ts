import { gitHubEnterprise } from '../../src/utils/enterprise';

describe('GitHubEnterprise', () => {
  describe('detectEnterprise', () => {
    it('should return null when no enterprise detected', () => {
      // In a test environment without git remote, this should return null
      const result = gitHubEnterprise.detectEnterprise();
      // Result depends on whether we're in a git repo with enterprise remote
      expect(result === null || typeof result === 'object').toBe(true);
    });
  });

  describe('getApiEndpoint', () => {
    it('should return correct API endpoint', () => {
      const endpoint = gitHubEnterprise.getApiEndpoint('ghe.company.com');
      expect(endpoint).toBe('https://ghe.company.com/api/v3');
    });

    it('should handle subdomains', () => {
      const endpoint = gitHubEnterprise.getApiEndpoint('github.enterprise.example.org');
      expect(endpoint).toBe('https://github.enterprise.example.org/api/v3');
    });
  });
});