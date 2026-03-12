/**
 * Interactive setup wizard for first-time GitConnect users
 */

import inquirer from 'inquirer';
import chalk from 'chalk';
import ora from 'ora';
import { execSync } from 'child_process';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';
import { ConfigManager } from '../core/config';
import { promptValidator, validators } from '../utils/validation';
import { nanoid } from 'nanoid';

export async function setupCommand(): Promise<void> {
  console.log(chalk.cyan.bold('\n🚀 GitConnect Setup Wizard\n'));
  console.log(chalk.gray('This wizard will help you set up GitConnect for managing multiple GitHub accounts.\n'));

  const config = new ConfigManager();
  const isInitialized = await config.isInitialized();

  // Step 1: Check if already initialized
  if (isInitialized) {
    const { reconfigure } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'reconfigure',
        message: 'GitConnect is already configured. Do you want to add another account?',
        default: false,
      },
    ]);

    if (!reconfigure) {
      console.log(chalk.gray('\nSetup cancelled. Run `gitconnect --help` to see available commands.'));
      return;
    }
  } else {
    // Step 2: Initialize GitConnect
    const spinner = ora('Initializing GitConnect...').start();
    await config.init();
    spinner.succeed('GitConnect initialized');
  }

  // Step 3: Add GitHub account
  const { addAccount } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'addAccount',
      message: 'Would you like to add a GitHub account now?',
      default: true,
    },
  ]);

  if (!addAccount) {
    showNextSteps();
    return;
  }

  // Step 4: Collect account details
  console.log(chalk.cyan('\n📋 Account Information\n'));

  const accountInfo = await inquirer.prompt([
    {
      type: 'input',
      name: 'username',
      message: 'GitHub username:',
      validate: promptValidator(validators.username),
    },
    {
      type: 'input',
      name: 'email',
      message: 'Git email address:',
      validate: promptValidator(validators.email),
    },
  ]);

  // Step 5: SSH Key setup
  console.log(chalk.cyan('\n🔑 SSH Key Configuration\n'));

  const { sshOption } = await inquirer.prompt([
    {
      type: 'list',
      name: 'sshOption',
      message: 'How would you like to set up SSH authentication?',
      choices: [
        { name: 'Generate a new SSH key (recommended)', value: 'generate' },
        { name: 'Use an existing SSH key', value: 'existing' },
        { name: 'Skip for now', value: 'skip' },
      ],
    },
  ]);

  let sshKeyPath = '';

  if (sshOption === 'generate') {
    const spinner = ora('Generating SSH key...').start();
    try {
      const sshDir = path.join(os.homedir(), '.ssh');
      const keyPath = path.join(sshDir, `gitconnect_${accountInfo.username}`);

      // Check if key already exists
      try {
        await fs.access(keyPath);
        spinner.info(`SSH key already exists at ${keyPath}`);
        sshKeyPath = keyPath;
      } catch {
        // Generate new key
        execSync(`ssh-keygen -t ed25519 -C "${accountInfo.email}" -f "${keyPath}" -N ""`, { stdio: 'pipe' });
        sshKeyPath = keyPath;
        spinner.succeed('SSH key generated');
      }
    } catch (error) {
      spinner.fail('Failed to generate SSH key');
      console.error(chalk.red(error instanceof Error ? error.message : String(error)));
    }
  } else if (sshOption === 'existing') {
    const { existingPath } = await inquirer.prompt([
      {
        type: 'input',
        name: 'existingPath',
        message: 'Path to existing SSH private key:',
        validate: async (input: string) => {
          try {
            await fs.access(input);
            return true;
          } catch {
            return 'File does not exist. Please enter a valid path.';
          }
        },
      },
    ]);
    sshKeyPath = existingPath;
  }

  // Step 6: Save account
  if (sshKeyPath) {
    const spinner = ora('Saving account...').start();
    const accountId = nanoid(8);

    await config.saveAccount({
      id: accountId,
      username: accountInfo.username,
      email: accountInfo.email,
      sshKey: sshKeyPath,
      createdAt: new Date().toISOString(),
    });

    spinner.succeed(chalk.green(`Account '${accountInfo.username}' saved`));

    // Show public key for GitHub
    try {
      const pubKey = await fs.readFile(`${sshKeyPath}.pub`, 'utf-8');
      console.log(chalk.cyan('\n📎 Add this SSH key to GitHub:\n'));
      console.log(chalk.gray('  1. Go to https://github.com/settings/ssh/new'));
      console.log(chalk.gray('  2. Click "New SSH key"'));
      console.log(chalk.gray('  3. Paste the following key:\n'));
      console.log(chalk.white(pubKey.trim()));
      console.log();
    } catch {
      // Public key might not exist
    }
  }

  // Step 7: Project setup (if in a git repo)
  const projectPath = process.cwd();
  const gitDir = path.join(projectPath, '.git');

  try {
    await fs.access(gitDir);

    const { setupProject } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'setupProject',
        message: 'Set up this project to use the account?',
        default: true,
      },
    ]);

    if (setupProject) {
      const { mode } = await inquirer.prompt([
        {
          type: 'list',
          name: 'mode',
          message: 'How should GitConnect behave for this project?',
          choices: [
            { name: 'Auto - Automatically use this account for all commits', value: 'auto' },
            { name: 'Prompt - Ask which account to use before each commit', value: 'prompt' },
          ],
          default: 'auto',
        },
      ]);

      await config.setProjectConfig(projectPath, {
        account: (await config.getAccounts())[0]?.id || '',
        mode: mode as 'auto' | 'prompt',
        addedAt: new Date().toISOString(),
      });

      console.log(chalk.green('✓ Project configured'));
    }
  } catch {
    // Not in a git repo
  }

  // Step 8: Install hooks (optional)
  try {
    await fs.access(gitDir);

    const { installHooks } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'installHooks',
        message: 'Install GitConnect hooks for this project?',
        default: true,
      },
    ]);

    if (installHooks) {
      const hooksDir = path.join(gitDir, 'hooks');
      await fs.mkdir(hooksDir, { recursive: true });

      const preCommitHook = `#!/bin/sh
# GitConnect pre-commit hook
if command -v gitconnect >/dev/null 2>&1; then
  gitconnect hook-pre-commit
  if [ $? -ne 0 ]; then
    echo "GitConnect: Commit cancelled"
    exit 1
  fi
fi
`;

      await fs.writeFile(path.join(hooksDir, 'pre-commit'), preCommitHook, { mode: 0o755 });
      console.log(chalk.green('✓ Git hooks installed'));
    }
  } catch {
    // Not in a git repo
  }

  showNextSteps();
}

function showNextSteps(): void {
  console.log(chalk.cyan.bold('\n✨ Setup Complete!\n'));
  console.log('Next steps:');
  console.log(chalk.gray('  • Add the SSH key to GitHub (if not done already)'));
  console.log(chalk.gray('  • Run `gitconnect status` to verify setup'));
  console.log(chalk.gray('  • Run `gitconnect --help` to see all commands'));
  console.log();
  console.log(chalk.cyan('Quick commands:'));
  console.log(chalk.gray('  gc account list      - View all accounts'));
  console.log(chalk.gray('  gc account add       - Add another account'));
  console.log(chalk.gray('  gc project set       - Change project account'));
  console.log(chalk.gray('  gc completion install - Install shell completions'));
  console.log();
}