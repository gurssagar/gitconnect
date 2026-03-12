import { branchManager } from '../../src/utils/branch';

describe('BranchManager', () => {
  describe('generateBranchName', () => {
    it('should generate feature branch name', () => {
      const name = branchManager.generateBranchName('feature', 'john', 'add login');
      expect(name).toBe('feature/john/add-login');
    });

    it('should generate bugfix branch name', () => {
      const name = branchManager.generateBranchName('bugfix', 'jane', 'fix crash');
      expect(name).toBe('bugfix/jane/fix-crash');
    });

    it('should generate branch with ticket ID', () => {
      const name = branchManager.generateBranchName('feature', 'john', 'add login', 'PROJ-123');
      expect(name).toBe('feature/john/PROJ-123/add-login');
    });

    it('should handle special characters in description', () => {
      const name = branchManager.generateBranchName('feature', 'john', 'Add new feature! @#$');
      // Special characters are removed, leaving clean slug
      expect(name).toMatch(/^feature\/john\/[\w-]+$/);
    });

    it('should generate hotfix branch name (no username)', () => {
      const name = branchManager.generateBranchName('hotfix', 'admin', 'urgent fix');
      expect(name).toBe('hotfix/urgent-fix');
    });

    it('should generate release branch name (no username)', () => {
      const name = branchManager.generateBranchName('release', 'team', 'v1.0.0');
      // Dots are removed from the slug
      expect(name).toBe('release/v100');
    });

    it('should generate chore branch name', () => {
      const name = branchManager.generateBranchName('chore', 'dev', 'update deps');
      expect(name).toBe('chore/dev/update-deps');
    });
  });

  describe('parseBranchName', () => {
    it('should parse branch with username and description', () => {
      const result = branchManager.parseBranchName('feature/john-add-login');
      expect(result).not.toBeNull();
      expect(result?.type).toBe('feature');
      expect(result?.username).toBe('john');
      expect(result?.description).toBe('add login');
    });

    it('should parse branch with ticket ID', () => {
      const result = branchManager.parseBranchName('feature/john-PROJ-123-add-login');
      expect(result).not.toBeNull();
      expect(result?.type).toBe('feature');
      expect(result?.ticketId).toBe('PROJ-123');
    });

    it('should return null for invalid branch name', () => {
      const result = branchManager.parseBranchName('invalid-branch');
      expect(result).toBeNull();
    });

    it('should return null for main branch', () => {
      const result = branchManager.parseBranchName('main');
      expect(result).toBeNull();
    });
  });

  describe('isValidBranchName', () => {
    it('should validate correct branch names', () => {
      expect(branchManager.isValidBranchName('feature/john/add-login')).toBe(true);
      expect(branchManager.isValidBranchName('bugfix/jane/fix-issue')).toBe(true);
      expect(branchManager.isValidBranchName('hotfix/admin/urgent')).toBe(true);
    });

    it('should reject invalid branch names', () => {
      expect(branchManager.isValidBranchName('')).toBe(false);
      expect(branchManager.isValidBranchName('invalid')).toBe(false);
    });
  });
});