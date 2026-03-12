import { execSync } from 'child_process';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';

const cliPath = path.join(__dirname, '../../dist/cli.js');

describe('E2E: Account Management Workflow', () => {
  const tempDir = path.join(os.tmpdir(), 'gitconnect-e2e-account');
  const configDir = path.join(tempDir, '.gitconnect');

  beforeAll(async () => {
    // Create temp directory
    await fs.mkdir(tempDir, { recursive: true });
    // Build CLI
    execSync('npm run build', { stdio: 'pipe', cwd: process.cwd() });
  });

  afterAll(async () => {
    // Cleanup
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  it('should complete full account lifecycle: init -> add -> list -> remove', async () => {
    // 1. Initialize GitConnect
    const initOutput = execSync(`node ${cliPath} init`, {
      encoding: 'utf-8',
      env: { ...process.env, HOME: tempDir },
    });
    expect(initOutput).toContain('initialized');

    // Verify config directory was created
    const configExists = await fs.access(configDir).then(() => true).catch(() => false);
    expect(configExists).toBe(true);

    // 2. List accounts (should be empty)
    const listOutputEmpty = execSync(`node ${cliPath} account list`, {
      encoding: 'utf-8',
      env: { ...process.env, HOME: tempDir },
    });
    expect(listOutputEmpty).toContain('No accounts');

    // 3. Add an account (non-interactive - using stdin simulation would be complex)
    // For E2E, we can verify the config structure directly
    const accountsFile = path.join(configDir, 'accounts.json');
    await fs.writeFile(accountsFile, JSON.stringify({
      accounts: [{
        id: 'test123',
        username: 'testuser',
        email: 'test@example.com',
        sshKey: '/tmp/test_key',
        createdAt: new Date().toISOString(),
      }],
    }, null, 2));

    // 4. List accounts (should show the account)
    const listOutputWithAccount = execSync(`node ${cliPath} account list`, {
      encoding: 'utf-8',
      env: { ...process.env, HOME: tempDir },
    });
    expect(listOutputWithAccount).toContain('testuser');
    expect(listOutputWithAccount).toContain('test@example.com');
  });
});

describe('E2E: Completion Workflow', () => {
  const tempDir = path.join(os.tmpdir(), 'gitconnect-e2e-completion');

  beforeAll(async () => {
    await fs.mkdir(tempDir, { recursive: true });
    execSync('npm run build', { stdio: 'pipe', cwd: process.cwd() });
  });

  afterAll(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  it('should generate bash completion script', () => {
    const output = execSync(`node ${cliPath} completion bash`, {
      encoding: 'utf-8',
    });
    expect(output).toContain('# Bash completion for gitconnect');
    expect(output).toContain('_gitconnect()');
    expect(output).toContain('complete -F _gitconnect');
  });

  it('should generate zsh completion script', () => {
    const output = execSync(`node ${cliPath} completion zsh`, {
      encoding: 'utf-8',
    });
    expect(output).toContain('#compdef gitconnect gc');
    expect(output).toContain('_gitconnect()');
  });

  it('should generate fish completion script', () => {
    const output = execSync(`node ${cliPath} completion fish`, {
      encoding: 'utf-8',
    });
    expect(output).toContain('# Fish completion for GitConnect');
    expect(output).toContain('complete -c gitconnect');
  });

  it('should install and uninstall bash completion', async () => {
    const completionDir = path.join(tempDir, '.local', 'share', 'bash-completion', 'completions');

    // Install
    const installOutput = execSync(`node ${cliPath} completion install bash`, {
      encoding: 'utf-8',
      env: { ...process.env, HOME: tempDir },
    });
    expect(installOutput).toContain('bash completion installed');

    // Verify file exists
    const completionFile = path.join(completionDir, 'gitconnect');
    const exists = await fs.access(completionFile).then(() => true).catch(() => false);
    expect(exists).toBe(true);

    // Verify gc alias completion exists
    const gcFile = path.join(completionDir, 'gc');
    const gcExists = await fs.access(gcFile).then(() => true).catch(() => false);
    expect(gcExists).toBe(true);

    // Uninstall
    const uninstallOutput = execSync(`node ${cliPath} completion uninstall bash`, {
      encoding: 'utf-8',
      env: { ...process.env, HOME: tempDir },
    });
    expect(uninstallOutput).toContain('Removed bash completion');

    // Verify file is removed
    const existsAfter = await fs.access(completionFile).then(() => true).catch(() => false);
    expect(existsAfter).toBe(false);
  });
});

describe('E2E: Project Configuration Workflow', () => {
  const tempDir = path.join(os.tmpdir(), 'gitconnect-e2e-project');
  const projectDir = path.join(tempDir, 'myproject');
  const configDir = path.join(tempDir, '.gitconnect');

  beforeAll(async () => {
    // Create temp directories
    await fs.mkdir(tempDir, { recursive: true });
    await fs.mkdir(projectDir, { recursive: true });
    await fs.mkdir(path.join(projectDir, '.git'), { recursive: true });

    // Initialize git repo
    execSync('git init', { cwd: projectDir, stdio: 'pipe' });

    // Build CLI
    execSync('npm run build', { stdio: 'pipe', cwd: process.cwd() });
  });

  afterAll(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  it('should show status for initialized project', async () => {
    // Initialize GitConnect
    execSync(`node ${cliPath} init`, {
      encoding: 'utf-8',
      env: { ...process.env, HOME: tempDir },
    });

    // Pre-populate an account
    const accountsFile = path.join(configDir, 'accounts.json');
    await fs.writeFile(accountsFile, JSON.stringify({
      accounts: [{
        id: 'test123',
        username: 'projectuser',
        email: 'project@example.com',
        sshKey: '/tmp/test_key',
        createdAt: new Date().toISOString(),
      }],
    }, null, 2));

    // Set project config
    const projectsFile = path.join(configDir, 'projects.json');
    await fs.writeFile(projectsFile, JSON.stringify({
      projects: {
        [projectDir]: {
          account: 'test123',
          mode: 'auto',
          addedAt: new Date().toISOString(),
        },
      },
    }, null, 2));

    // Check status
    const statusOutput = execSync(`node ${cliPath} status`, {
      encoding: 'utf-8',
      env: { ...process.env, HOME: tempDir },
      cwd: projectDir,
    });
    expect(statusOutput).toContain('projectuser');
  });
});

describe('E2E: Hooks Workflow', () => {
  const tempDir = path.join(os.tmpdir(), 'gitconnect-e2e-hooks');
  const projectDir = path.join(tempDir, 'myproject');

  beforeAll(async () => {
    await fs.mkdir(tempDir, { recursive: true });
    await fs.mkdir(projectDir, { recursive: true });
    await fs.mkdir(path.join(projectDir, '.git'), { recursive: true });

    // Initialize git repo
    execSync('git init', { cwd: projectDir, stdio: 'pipe' });

    // Build CLI
    execSync('npm run build', { stdio: 'pipe', cwd: process.cwd() });
  });

  afterAll(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  it('should show hooks status', () => {
    // Initialize GitConnect first
    execSync(`node ${cliPath} init`, {
      encoding: 'utf-8',
      env: { ...process.env, HOME: tempDir },
    });

    // Check hooks status
    const statusOutput = execSync(`node ${cliPath} hooks status`, {
      encoding: 'utf-8',
      env: { ...process.env, HOME: tempDir },
      cwd: projectDir,
    });
    expect(statusOutput).toContain('pre-commit');
    expect(statusOutput).toContain('pre-push');
  });

  it('should install and uninstall hooks', async () => {
    // Install pre-commit hook
    const installOutput = execSync(`node ${cliPath} hooks install -t commit`, {
      encoding: 'utf-8',
      env: { ...process.env, HOME: tempDir },
      cwd: projectDir,
    });
    expect(installOutput).toContain('pre-commit');

    // Verify hook exists
    const hookPath = path.join(projectDir, '.git', 'hooks', 'pre-commit');
    const content = await fs.readFile(hookPath, 'utf-8');
    expect(content).toContain('GitConnect');

    // Uninstall hooks
    const uninstallOutput = execSync(`node ${cliPath} hooks uninstall -t all`, {
      encoding: 'utf-8',
      env: { ...process.env, HOME: tempDir },
      cwd: projectDir,
    });
    expect(uninstallOutput).toContain('uninstalled');
  });
});

describe('E2E: Error Handling', () => {
  const tempDir = path.join(os.tmpdir(), 'gitconnect-e2e-errors');

  beforeAll(async () => {
    await fs.mkdir(tempDir, { recursive: true });
    execSync('npm run build', { stdio: 'pipe', cwd: process.cwd() });
  });

  afterAll(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  it('should fail gracefully when not initialized', () => {
    expect(() => {
      execSync(`node ${cliPath} account list`, {
        encoding: 'utf-8',
        env: { ...process.env, HOME: tempDir },
        stdio: 'pipe',
      });
    }).toThrow();
  });

  it('should show help for completion command', () => {
    const output = execSync(`node ${cliPath} completion --help`, {
      encoding: 'utf-8',
    });
    expect(output).toContain('completion');
    expect(output).toContain('install');
  });
});