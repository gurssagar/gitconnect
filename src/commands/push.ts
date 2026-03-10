import inquirer from 'inquirer';
import chalk from 'chalk';
import ora from 'ora';
import { ConfigManager } from '../core/config';
import { GitManager } from '../core/git';
import { PushOptions } from '../types';

export async function pushCommand(options: PushOptions): Promise<void> {
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

  // Check if there's anything to push
  const hasChanges = await git.hasChangesToPush();
  if (!hasChanges) {
    console.log(chalk.yellow('No commits to push. Everything is up to date.'));
    return;
  }

  let account;
  const accounts = await config.getAccounts();

  // Determine which account to use
  if (options.account) {
    // Explicit account specified
    account = accounts.find(a => a.username === options.account || a.id === options.account);
    if (!account) {
      console.error(chalk.red(`Account '${options.account}' not found`));
      process.exit(1);
    }
  } else {
    // Check project config
    const projectConfig = await config.getProjectConfig(gitInfo.projectPath);
    
    if (projectConfig) {
      account = await config.getAccount(projectConfig.account);
      
      // If in prompt mode, ask for confirmation
      if (projectConfig.mode === 'prompt' && !options.auto) {
        const { confirm } = await inquirer.prompt([
          {
            type: 'confirm',
            name: 'confirm',
            message: `Push using account '${account?.username}'?`,
            default: true,
          },
        ]);

        if (!confirm) {
          // Let user select a different account
          const { selectedAccount } = await inquirer.prompt([
            {
              type: 'list',
              name: 'selectedAccount',
              message: 'Select account to use:',
              choices: accounts.map(a => ({
                name: `${a.username} (${a.email})`,
                value: a.id,
              })),
            },
          ]);
          account = accounts.find(a => a.id === selectedAccount);
        }
      }
    } else {
      // No project config, ask user
      if (accounts.length === 0) {
        console.error(chalk.red('No accounts configured.'));
        console.log(chalk.gray('Run `gitconnect account add` to add an account.'));
        process.exit(1);
      }

      const { selectedAccount } = await inquirer.prompt([
        {
          type: 'list',
          name: 'selectedAccount',
          message: 'Select account to push with:',
          choices: accounts.map(a => ({
            name: `${a.username} (${a.email})`,
            value: a.id,
          })),
        },
      ]);
      account = accounts.find(a => a.id === selectedAccount);
    }
  }

  if (!account) {
    console.error(chalk.red('No account available for push'));
    process.exit(1);
  }

  // Set identity before push
  await git.setIdentity(account.username, account.email);

  const spinner = ora(`Pushing as ${account.username}...`).start();

  const result = await git.push({
    remote: options.remote,
    branch: options.branch || gitInfo.currentBranch,
    sshKey: account.sshKey,
  });

  if (result.success) {
    spinner.succeed(chalk.green('Push successful!'));
    console.log(chalk.gray(`  Account: ${account.username}`));
    console.log(chalk.gray(`  Branch: ${gitInfo.currentBranch}`));
  } else {
    spinner.fail(chalk.red('Push failed'));
    console.error(chalk.red(result.error || 'Unknown error'));
    process.exit(1);
  }
}