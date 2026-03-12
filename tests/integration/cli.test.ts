import { execSync } from 'child_process';
import * as path from 'path';

const cliPath = path.join(__dirname, '../../dist/cli.js');

describe('CLI Integration', () => {
  beforeAll(() => {
    // Ensure CLI is built
    execSync('npm run build', { stdio: 'pipe' });
  });

  describe('help', () => {
    it('should show version with --version flag', () => {
      const output = execSync(`node ${cliPath} --version`, { encoding: 'utf-8' });
      expect(output).toMatch(/\d+\.\d+\.\d+/);
    });

    it('should show help with --help flag', () => {
      const output = execSync(`node ${cliPath} --help`, { encoding: 'utf-8' });
      expect(output).toContain('Usage:');
      expect(output).toContain('Commands:');
    });
  });

  describe('account commands', () => {
    it('should show account help', () => {
      const output = execSync(`node ${cliPath} account --help`, { encoding: 'utf-8' });
      expect(output).toContain('Manage GitHub accounts');
    });
  });

  describe('project commands', () => {
    it('should show project help', () => {
      const output = execSync(`node ${cliPath} project --help`, { encoding: 'utf-8' });
      expect(output).toContain('Manage project settings');
    });
  });

  describe('hooks commands', () => {
    it('should show hooks help', () => {
      const output = execSync(`node ${cliPath} hooks --help`, { encoding: 'utf-8' });
      expect(output).toContain('Manage git hooks');
    });
  });
});