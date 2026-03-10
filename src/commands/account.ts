import inquirer from 'inquirer';
import chalk from 'chalk';
import ora from 'ora';
import { execSync } from 'child_process';
import { ConfigManager } from '../core/config';
import { promptValidator, validators } from '../utils/validation';
import { nanoid } from 'nanoid';
import * as fs from 'fs/promises';
import * as path from 'path';

export async function accountCommand(action: string, name?: string): Promise<void> {
  const config = new ConfigManager();
  
  if (!(await config.isInitialized())) {
    console.error(chalk.red('GitConnect not initialized. Run `gitconnect init` first.'));
    process.exit(1);
  }

  switch (action) {
    case 'add':
      await addAccount(config);
      break;
    case 'list':
      await listAccounts(config);
      break;
    case 'remove':
      if (!name) {
        console.error(chalk.red('Account name required for remove'));
        process.exit(1);
      }
      await removeAccount(config, name);
      break;
    default:
      console.error(chalk.red(`Unknown action: ${action}`));
      process.exit(1);
  }
}

async function addAccount(config: ConfigManager): Promise<void> {
  console.log(chalk.cyan('\n🔐 Add GitHub Account\n'));
  
  const answers = await inquirer.prompt([
    {
      type: 'input',
      name: 'username',
      message: 'GitHub username:',
      validate: promptValidator(validators.username),
    },
    {
      type: 'input',
      name: 'email',
      message: 'Git email:',
      validate: promptValidator(validators.email),
    },
    {
      type: 'input',
      name: 'sshKeyPath',
      message: 'SSH key path (leave empty to generate):',
      default: '',
    },
  ]);

  const spinner = ora('Setting up account...').start();
  
  try {
    const accountId = nanoid(8);
    let sshKeyPath = answers.sshKeyPath;
    
    // If no SSH key provided, prompt to create one
    if (!sshKeyPath) {
      const sshDir = path.join(process.env.HOME || '~', '.ssh');
      const keyPath = path.join(sshDir, `gitconnect_${answers.username}`);
      
      // Check if key already exists
      try {
        await fs.access(keyPath);
        sshKeyPath = keyPath;
      } catch {
        // Generate new key
        execSync(`ssh-keygen -t ed25519 -C "${answers.email}" -f "${keyPath}" -N ""`, { stdio: 'pipe' });
        sshKeyPath = keyPath;
        
        spinner.info(`SSH key generated: ${keyPath}`);
        spinner.start('Saving account...');
      }
    }

    const account = {
      id: accountId,
      username: answers.username,
      email: answers.email,
      sshKey: sshKeyPath,
      createdAt: new Date().toISOString(),
    };

    await config.saveAccount(account);
    
    spinner.succeed(chalk.green(`Account '${answers.username}' added successfully!`));
    
    // Show public key for GitHub
    try {
      const pubKey = await fs.readFile(`${sshKeyPath}.pub`, 'utf-8');
      console.log(chalk.gray('\nAdd this key to GitHub (Settings → SSH Keys):'));
      console.log(chalk.cyan(pubKey.trim()));
    } catch {
      // Key might not have .pub extension
    }
  } catch (error: any) {
    spinner.fail(chalk.red('Failed to add account'));
    console.error(error.message);
    process.exit(1);
  }
}

async function listAccounts(config: ConfigManager): Promise<void> {
  const accounts = await config.getAccounts();
  
  if (accounts.length === 0) {
    console.log(chalk.yellow('No accounts configured.'));
    console.log(chalk.gray('Run `gitconnect account add` to add an account.'));
    return;
  }

  console.log(chalk.cyan('\n📋 Configured Accounts\n'));
  
  for (const account of accounts) {
    console.log(`  ${chalk.green('•')} ${chalk.bold(account.username)}`);
    console.log(`    Email: ${account.email}`);
    console.log(`    SSH Key: ${account.sshKey}`);
    console.log(`    Added: ${new Date(account.createdAt).toLocaleDateString()}`);
    console.log();
  }
}

async function removeAccount(config: ConfigManager, name: string): Promise<void> {
  const accounts = await config.getAccounts();
  const account = accounts.find(a => a.username === name || a.id === name);
  
  if (!account) {
    console.error(chalk.red(`Account '${name}' not found`));
    process.exit(1);
  }

  const { confirm } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'confirm',
      message: `Remove account '${account.username}'?`,
      default: false,
    },
  ]);

  if (confirm) {
    const removed = await config.removeAccount(account.id);
    if (removed) {
      console.log(chalk.green(`✓ Account '${account.username}' removed`));
    } else {
      console.error(chalk.red('Failed to remove account'));
    }
  }
}