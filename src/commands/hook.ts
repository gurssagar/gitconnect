import inquirer from 'inquirer';
import chalk from 'chalk';
import { ConfigManager } from '../core/config';
import { GitManager } from '../core/git';

/**
 * Handler for pre-commit hook
 * Called by .git/hooks/pre-commit
 */
export async function preCommitHook(): Promise<void> {
  const config = new ConfigManager();
  const git = new GitManager();
  
  // Check if initialized
  if (!(await config.isInitialized())) {
    // GitConnect not set up, let git proceed normally
    process.exit(0);
  }

  const gitInfo = await git.getGitInfo();
  
  if (!gitInfo.isGitRepo) {
    process.exit(0);
  }

  // Get project config
  const projectConfig = await config.getProjectConfig(gitInfo.projectPath);
  
  // Check if hooks are disabled
  if (projectConfig?.mode === 'off') {
    process.exit(0);
  }

  // Get accounts
  const accounts = await config.getAccounts();
  
  if (accounts.length === 0) {
    console.log(chalk.yellow('No accounts configured. Run `gitconnect account add`'));
    process.exit(0);
  }

  // Determine account
  let account;
  
  if (projectConfig?.mode === 'auto' && projectConfig.account) {
    account = await config.getAccount(projectConfig.account);
  }

  if (!account) {
    // Prompt for account
    const currentIdentity = await git.getIdentity();
    const defaultAccount = currentIdentity
      ? accounts.find(a => a.email === currentIdentity.email)
      : undefined;

    try {
      const { selectedAccount, confirm } = await inquirer.prompt([
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
        {
          type: 'confirm',
          name: 'confirm',
          message: 'Proceed with commit?',
          default: true,
        },
      ]);

      if (!confirm) {
        console.log(chalk.yellow('Commit cancelled'));
        process.exit(1);
      }

      account = accounts.find(a => a.id === selectedAccount);
    } catch (error) {
      // Non-interactive mode or cancelled
      console.log(chalk.yellow('\nCommit cancelled'));
      process.exit(1);
    }
  } else {
    // Auto mode - show which account will be used
    const currentIdentity = await git.getIdentity();
    
    if (currentIdentity?.email !== account.email) {
      console.log(chalk.cyan(`GitConnect: Using account '${account.username}'`));
    }
  }

  if (!account) {
    console.log(chalk.yellow('No account selected'));
    process.exit(1);
  }

  // Set git identity
  try {
    await git.setIdentity(account.username, account.email);
  } catch (error) {
    console.error(chalk.red('Failed to set git identity'));
    process.exit(1);
  }

  // Exit successfully to allow commit
  process.exit(0);
}

/**
 * Handler for pre-push hook
 * Called by .git/hooks/pre-push
 */
export async function prePushHook(): Promise<void> {
  const config = new ConfigManager();
  const git = new GitManager();
  
  // Check if initialized
  if (!(await config.isInitialized())) {
    process.exit(0);
  }

  const gitInfo = await git.getGitInfo();
  
  if (!gitInfo.isGitRepo) {
    process.exit(0);
  }

  // Get project config
  const projectConfig = await config.getProjectConfig(gitInfo.projectPath);
  
  // Check if hooks are disabled
  if (projectConfig?.mode === 'off') {
    process.exit(0);
  }

  // Get accounts
  const accounts = await config.getAccounts();
  
  if (accounts.length === 0) {
    console.log(chalk.yellow('No accounts configured. Run `gitconnect account add`'));
    process.exit(0);
  }

  // Get current identity
  const currentIdentity = await git.getIdentity();
  
  if (!currentIdentity) {
    console.log(chalk.yellow('No git identity set'));
    process.exit(0);
  }

  // Find matching account
  const matchingAccount = accounts.find(a => a.email === currentIdentity.email);
  
  if (matchingAccount) {
    console.log(chalk.cyan(`GitConnect: Pushing as '${matchingAccount.username}'`));
  } else {
    console.log(chalk.yellow(`GitConnect: Current identity (${currentIdentity.email}) not in accounts`));
  }

  // Exit successfully to allow push
  process.exit(0);
}