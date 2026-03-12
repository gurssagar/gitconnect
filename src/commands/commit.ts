import inquirer from 'inquirer';
import chalk from 'chalk';
import ora from 'ora';
import { execSync } from 'child_process';
import { ConfigManager } from '../core/config';
import { GitManager } from '../core/git';

interface CommitOptions {
  message?: string;
  amend?: boolean;
  sign?: boolean;
  account?: string;
}

export async function commitCommand(options: CommitOptions): Promise<void> {
  const config = new ConfigManager();
  const git = new GitManager();
  
  if (!(await config.isInitialized())) {
    console.error(chalk.red('GitConnect not initialized. Run `gitconnect init` first.'));
    process.exit(1);
  }

  const gitInfo = await git.getGitInfo();
  
  if (!gitInfo.isGitRepo) {
    console.error(chalk.red('Not a git repository.'));
    process.exit(1);
  }

  // Get accounts
  const accounts = await config.getAccounts();
  
  if (accounts.length === 0) {
    console.error(chalk.red('No accounts configured.'));
    console.log(chalk.gray('Run `gitconnect account add` to add an account.'));
    process.exit(1);
  }

  // Determine which account to use
  let account;
  
  if (options.account) {
    account = accounts.find(a => a.username === options.account || a.id === options.account);
    if (!account) {
      console.error(chalk.red(`Account '${options.account}' not found`));
      process.exit(1);
    }
  } else {
    // Check project config first
    const projectConfig = await config.getProjectConfig(gitInfo.projectPath);
    
    if (projectConfig && projectConfig.mode === 'auto') {
      account = await config.getAccount(projectConfig.account);
    }
    
    if (!account) {
      // Prompt for account
      const currentIdentity = await git.getIdentity();
      const defaultAccount = currentIdentity 
        ? accounts.find(a => a.email === currentIdentity.email)
        : undefined;

      const { selectedAccount } = await inquirer.prompt([
        {
          type: 'list',
          name: 'selectedAccount',
          message: 'Select account for this commit:',
          choices: accounts.map(a => ({
            name: `${a.username} (${a.email})${currentIdentity?.email === a.email ? ' (current)' : ''}`,
            value: a.id,
          })),
          default: defaultAccount?.id,
        },
      ]);
      
      account = accounts.find(a => a.id === selectedAccount);
    }
  }

  if (!account) {
    console.error(chalk.red('No account selected'));
    process.exit(1);
  }

  // Get commit message if not provided
  let message = options.message;
  
  if (!message) {
    const { inputMessage } = await inquirer.prompt([
      {
        type: 'editor',
        name: 'inputMessage',
        message: 'Enter commit message:',
      },
    ]);
    message = inputMessage;
  }

  if (!message || message.trim().length === 0) {
    console.error(chalk.red('Commit message is required'));
    process.exit(1);
  }

  // Set git identity
  await git.setIdentity(account.username, account.email);

  const spinner = ora(`Committing as ${account.username}...`).start();

  try {
    // Build commit command
    let commitCmd = 'git commit';
    
    if (options.amend) {
      commitCmd += ' --amend';
    }
    
    if (options.sign && account.sshKey) {
      // Configure SSH signing
      execSync('git config commit.gpgsign true', { stdio: 'pipe' });
      execSync('git config gpg.format ssh', { stdio: 'pipe' });
      execSync(`git config user.signingkey ${account.sshKey}.pub`, { stdio: 'pipe' });
    }
    
    // Execute commit
    execSync(`${commitCmd} -m "${message.replace(/"/g, '\\"')}"`, {
      encoding: 'utf-8',
      stdio: 'pipe',
    });

    spinner.succeed(chalk.green('Commit successful!'));
    console.log(chalk.gray(`  Author: ${account.username} <${account.email}>`));
    console.log(chalk.gray(`  Branch: ${gitInfo.currentBranch}`));
    
  } catch (error: unknown) {
    spinner.fail(chalk.red('Commit failed'));

    // Check if it's just "nothing to commit"
    const stderr = error instanceof Error ? (error as Error & { stderr?: Buffer }).stderr?.toString() || '' : '';
    if (stderr.includes('nothing to commit')) {
      console.log(chalk.yellow('Nothing to commit, working tree clean'));
    } else {
      console.error(chalk.red(error instanceof Error ? error.message : String(error)));
    }
    process.exit(1);
  }
}