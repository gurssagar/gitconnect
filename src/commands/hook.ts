import inquirer from 'inquirer';
import chalk from 'chalk';
import { ConfigManager } from '../core/config';
import { GitManager } from '../core/git';

/**
 * Check if silent mode is enabled
 */
async function isSilentMode(): Promise<boolean> {
  try {
    const config = new ConfigManager();
    const settings = await config.getSettings();
    return settings.silent === true;
  } catch {
    return false;
  }
}

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

    const _silent = await isSilentMode();

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
    } catch (_error) {
      // Non-interactive mode or cancelled
      console.log(chalk.yellow('\nCommit cancelled'));
      process.exit(1);
    }
  } else {
    // Auto mode - show which account will be used
    const currentIdentity = await git.getIdentity();
    const silent = await isSilentMode();

    if (!silent && currentIdentity?.email !== account.email) {
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
  } catch (_error) {
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

  // In prompt mode, ask user to confirm the push
  if (projectConfig?.mode === 'prompt') {
    const currentIdentity = await git.getIdentity();
    const matchingAccount = accounts.find(a => a.email === currentIdentity?.email);

    try {
      const { confirm } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'confirm',
          message: matchingAccount
            ? `Push as '${matchingAccount.username}' (${matchingAccount.email})?`
            : `Push with current identity (${currentIdentity?.name} <${currentIdentity?.email}>)?`,
          default: true,
        },
      ]);

      if (!confirm) {
        console.log(chalk.yellow('Push cancelled'));
        process.exit(1);
      }
    } catch (_error) {
      // Non-interactive mode or cancelled
      console.log(chalk.yellow('\nPush cancelled'));
      process.exit(1);
    }
  } else {
    // Auto mode - show which account will push
    const currentIdentity = await git.getIdentity();
    const matchingAccount = accounts.find(a => a.email === currentIdentity?.email);
    const silent = await isSilentMode();

    if (!silent) {
      if (matchingAccount) {
        console.log(chalk.cyan(`GitConnect: Pushing as '${matchingAccount.username}'`));
      } else if (currentIdentity) {
        console.log(chalk.yellow(`GitConnect: Current identity (${currentIdentity.email}) not in accounts`));
      }
    }
  }

  // Exit successfully to allow push
  process.exit(0);
}