import chalk from 'chalk';
import inquirer from 'inquirer';
import * as fs from 'fs/promises';
import * as path from 'path';
import { ConfigManager } from '../core/config';
import { GitManager } from '../core/git';

interface HookOptions {
  type?: 'commit' | 'push' | 'all';
  mode?: 'prompt' | 'auto' | 'off';
}

const PRE_COMMIT_HOOK = `#!/bin/sh
# GitConnect pre-commit hook
# This hook prompts for account selection before each commit

if command -v gitconnect >/dev/null 2>&1; then
  gitconnect hook-pre-commit
  if [ $? -ne 0 ]; then
    echo "GitConnect: Commit cancelled"
    exit 1
  fi
fi
`;

const PRE_PUSH_HOOK = `#!/bin/sh
# GitConnect pre-push hook
# This hook ensures the correct account is used for push

if command -v gitconnect >/dev/null 2>&1; then
  gitconnect hook-pre-push
  if [ $? -ne 0 ]; then
    echo "GitConnect: Push cancelled"
    exit 1
  fi
fi
`;

export async function hooksCommand(action: string, options: HookOptions): Promise<void> {
  const config = new ConfigManager();
  const git = new GitManager();
  
  if (!(await config.isInitialized())) {
    console.error(chalk.red('GitConnect not initialized. Run `gitconnect init` first.'));
    process.exit(1);
  }

  const gitInfo = await git.getGitInfo();
  
  if (!gitInfo.isGitRepo) {
    console.error(chalk.red('Not a git repository. Navigate to a git project first.'));
    process.exit(1);
  }

  switch (action) {
  case 'install':
    await installHooks(gitInfo.projectPath, options);
    break;
  case 'uninstall':
    await uninstallHooks(gitInfo.projectPath, options);
    break;
  case 'status':
    await showHookStatus(gitInfo.projectPath);
    break;
  case 'mode':
    await setHookMode(config, gitInfo.projectPath, options.mode);
    break;
  default:
    console.error(chalk.red(`Unknown action: ${action}`));
    console.log(chalk.gray('Available actions: install, uninstall, status, mode'));
    process.exit(1);
  }
}

async function installHooks(projectPath: string, options: HookOptions): Promise<void> {
  const hooksDir = path.join(projectPath, '.git', 'hooks');
  
  // Ensure hooks directory exists
  await fs.mkdir(hooksDir, { recursive: true });

  const hooksToInstall: string[] = [];
  
  if (options.type === 'all') {
    hooksToInstall.push('pre-commit', 'pre-push');
  } else if (options.type === 'commit') {
    hooksToInstall.push('pre-commit');
  } else if (options.type === 'push') {
    hooksToInstall.push('pre-push');
  } else {
    // Ask user which hooks to install
    const { selectedHooks } = await inquirer.prompt([
      {
        type: 'checkbox',
        name: 'selectedHooks',
        message: 'Select hooks to install:',
        choices: [
          { name: 'pre-commit (prompt for account before commit)', value: 'pre-commit', checked: true },
          { name: 'pre-push (verify account before push)', value: 'pre-push' },
        ],
      },
    ]);
    hooksToInstall.push(...selectedHooks);
  }

  for (const hookName of hooksToInstall) {
    const hookPath = path.join(hooksDir, hookName);
    const hookContent = hookName === 'pre-commit' ? PRE_COMMIT_HOOK : PRE_PUSH_HOOK;
    
    // Check if hook already exists
    try {
      const existing = await fs.readFile(hookPath, 'utf-8');
      if (existing.includes('GitConnect')) {
        console.log(chalk.yellow(`  ${hookName} already installed`));
        continue;
      }
      
      // Backup existing hook
      await fs.rename(hookPath, `${hookPath}.backup`);
      console.log(chalk.gray(`  Backed up existing ${hookName} to ${hookName}.backup`));
    } catch {
      // Hook doesn't exist, that's fine
    }

    // Write new hook
    await fs.writeFile(hookPath, hookContent, { mode: 0o755 });
    console.log(chalk.green(`✓ Installed ${hookName} hook`));
  }

  console.log(chalk.cyan('\nHooks installed!'));
  console.log(chalk.gray('  Run `gitconnect hooks mode <mode>` to configure behavior'));
  console.log(chalk.gray('  Modes: prompt (ask every time), auto (use config), off (disabled)'));
}

async function uninstallHooks(projectPath: string, options: HookOptions): Promise<void> {
  const hooksDir = path.join(projectPath, '.git', 'hooks');
  
  const hooksToUninstall: string[] = [];
  
  if (options.type === 'all') {
    hooksToUninstall.push('pre-commit', 'pre-push');
  } else if (options.type === 'commit') {
    hooksToUninstall.push('pre-commit');
  } else if (options.type === 'push') {
    hooksToUninstall.push('pre-push');
  } else {
    hooksToUninstall.push('pre-commit', 'pre-push');
  }

  for (const hookName of hooksToUninstall) {
    const hookPath = path.join(hooksDir, hookName);
    
    try {
      const content = await fs.readFile(hookPath, 'utf-8');
      if (content.includes('GitConnect')) {
        await fs.unlink(hookPath);
        console.log(chalk.green(`✓ Removed ${hookName} hook`));
        
        // Restore backup if exists
        try {
          await fs.access(`${hookPath}.backup`);
          await fs.rename(`${hookPath}.backup`, hookPath);
          console.log(chalk.gray(`  Restored original ${hookName}`));
        } catch {
          // No backup
        }
      } else {
        console.log(chalk.yellow(`  ${hookName} is not a GitConnect hook`));
      }
    } catch {
      console.log(chalk.gray(`  ${hookName} not found`));
    }
  }

  console.log(chalk.cyan('\nHooks uninstalled!'));
}

async function showHookStatus(projectPath: string): Promise<void> {
  const hooksDir = path.join(projectPath, '.git', 'hooks');
  
  console.log(chalk.cyan('\n🔗 Git Hook Status\n'));

  const hooks = ['pre-commit', 'pre-push'];
  
  for (const hookName of hooks) {
    const hookPath = path.join(hooksDir, hookName);
    
    try {
      const content = await fs.readFile(hookPath, 'utf-8');
      if (content.includes('GitConnect')) {
        console.log(`  ${chalk.green('✓')} ${hookName}: GitConnect hook installed`);
      } else {
        console.log(`  ${chalk.gray('○')} ${hookName}: Other hook (not GitConnect)`);
      }
    } catch {
      console.log(`  ${chalk.gray('○')} ${hookName}: Not installed`);
    }
  }

  // Show current hook mode
  const config = new ConfigManager();
  const projectConfig = await config.getProjectConfig(projectPath);
  
  console.log(chalk.cyan('\n  Hook Mode:'));
  if (projectConfig) {
    console.log(`    ${projectConfig.mode === 'prompt' ? '🔵' : '🟢'} ${projectConfig.mode}`);
  } else {
    console.log(chalk.gray('    Not configured (will prompt for account)'));
  }

  console.log(chalk.gray('\n  Run `gitconnect hooks mode <prompt|auto|off>` to change'));
}

async function setHookMode(
  config: ConfigManager,
  projectPath: string,
  mode?: 'prompt' | 'auto' | 'off'
): Promise<void> {
  if (!mode || !['prompt', 'auto', 'off'].includes(mode)) {
    const { selectedMode } = await inquirer.prompt([
      {
        type: 'list',
        name: 'selectedMode',
        message: 'Select hook mode:',
        choices: [
          { name: 'prompt - Ask for account before each commit/push', value: 'prompt' },
          { name: 'auto - Use configured account automatically', value: 'auto' },
          { name: 'off - Disable GitConnect hooks temporarily', value: 'off' },
        ],
      },
    ]);
    mode = selectedMode;
  }

  const projectConfig = await config.getProjectConfig(projectPath);
  
  if (projectConfig) {
    await config.setProjectConfig(projectPath, {
      ...projectConfig,
      mode: mode as 'prompt' | 'auto',
      addedAt: projectConfig.addedAt,
    });
  } else {
    // Need to set an account first for auto mode
    if (mode === 'auto') {
      const accounts = await config.getAccounts();
      
      if (accounts.length === 0) {
        console.error(chalk.red('No accounts configured. Run `gitconnect account add` first.'));
        process.exit(1);
      }

      const { selectedAccount } = await inquirer.prompt([
        {
          type: 'list',
          name: 'selectedAccount',
          message: 'Select account for this project:',
          choices: accounts.map(a => ({
            name: `${a.username} (${a.email})`,
            value: a.id,
          })),
        },
      ]);

      await config.setProjectConfig(projectPath, {
        account: selectedAccount,
        mode: 'auto',
        addedAt: new Date().toISOString(),
      });
    } else {
      await config.setProjectConfig(projectPath, {
        account: '',
        mode: mode as 'prompt' | 'auto',
        addedAt: new Date().toISOString(),
      });
    }
  }

  console.log(chalk.green(`✓ Hook mode set to '${mode}'`));
}