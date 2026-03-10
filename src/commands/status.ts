import chalk from 'chalk';
import { execSync } from 'child_process';
import { ConfigManager } from '../core/config';
import { GitManager } from '../core/git';

export async function statusCommand(): Promise<void> {
  const config = new ConfigManager();
  const git = new GitManager();
  
  console.log(chalk.cyan('\n🔗 GitConnect Status\n'));

  // Check initialization
  const isInitialized = await config.isInitialized();
  if (!isInitialized) {
    console.log(chalk.yellow('GitConnect is not initialized.'));
    console.log(chalk.gray('Run `gitconnect init` to get started.'));
    return;
  }

  console.log(chalk.green('✓ GitConnect initialized'));

  // Show accounts
  const accounts = await config.getAccounts();
  console.log(`\n${chalk.bold('Accounts:')} ${accounts.length}`);
  
  if (accounts.length > 0) {
    for (const account of accounts) {
      console.log(`  ${chalk.green('•')} ${account.username} (${account.email})`);
    }
  } else {
    console.log(chalk.gray('  No accounts configured'));
    console.log(chalk.gray('  Run `gitconnect account add` to add an account'));
  }

  // Show settings
  const settings = await config.getSettings();
  console.log(`\n${chalk.bold('Settings:')}`);
  console.log(`  Default mode: ${settings.defaultMode}`);

  // Show git status
  const gitInfo = await git.getGitInfo();
  console.log(`\n${chalk.bold('Current Project:')}`);
  
  if (gitInfo.isGitRepo) {
    console.log(`  Path: ${gitInfo.projectPath}`);
    console.log(`  Branch: ${gitInfo.currentBranch || 'unknown'}`);
    
    if (gitInfo.remoteUrl) {
      console.log(`  Remote: ${gitInfo.remoteUrl}`);
    }

    // Show project config
    const projectConfig = await config.getProjectConfig(gitInfo.projectPath);
    if (projectConfig) {
      const account = await config.getAccount(projectConfig.account);
      console.log(`\n  ${chalk.bold('GitConnect Config:')}`);
      console.log(`    Account: ${account?.username || 'unknown'}`);
      console.log(`    Mode: ${projectConfig.mode}`);
    } else {
      console.log(chalk.yellow('\n  Project not configured with GitConnect'));
      console.log(chalk.gray('  Run `gitconnect project set` to configure'));
    }

    // Show local git identity
    const identity = await git.getIdentity();
    if (identity) {
      console.log(`\n  ${chalk.bold('Local Git Identity:')}`);
      console.log(`    Name: ${identity.name}`);
      console.log(`    Email: ${identity.email}`);
    }

    // Show push status
    const hasChanges = await git.hasChangesToPush();
    if (hasChanges) {
      console.log(chalk.cyan('\n  📤 Commits ready to push'));
    } else {
      console.log(chalk.gray('\n  ✓ Nothing to push'));
    }
  } else {
    console.log(chalk.gray('  Not in a git repository'));
  }

  // Show git hook status
  try {
    const alias = execSync('git config --global alias.push', { encoding: 'utf-8' }).trim();
    if (alias.includes('gitconnect')) {
      console.log(chalk.green('\n✓ Git hook installed'));
    } else {
      console.log(chalk.gray('\nGit hook not installed'));
      console.log(chalk.gray('Run `gitconnect install-hook` to enable automatic GitConnect'));
    }
  } catch {
    console.log(chalk.gray('\nGit hook not installed'));
    console.log(chalk.gray('Run `gitconnect install-hook` to enable automatic GitConnect'));
  }
}