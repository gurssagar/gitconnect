import chalk from 'chalk';
import { ConfigManager } from '../core/config';
import { GitManager } from '../core/git';

export async function useCommand(accountName: string): Promise<void> {
  const config = new ConfigManager();
  const git = new GitManager();
  
  if (!(await config.isInitialized())) {
    console.error(chalk.red('GitConnect not initialized. Run `gitconnect init` first.'));
    process.exit(1);
  }

  const accounts = await config.getAccounts();
  const account = accounts.find(a => a.username === accountName || a.id === accountName);
  
  if (!account) {
    console.error(chalk.red(`Account '${accountName}' not found`));
    console.log(chalk.gray('Available accounts:'));
    accounts.forEach(a => console.log(chalk.gray(`  - ${a.username}`)));
    process.exit(1);
  }

  const gitInfo = await git.getGitInfo();
  
  if (!gitInfo.isGitRepo) {
    console.error(chalk.red('Not in a git repository'));
    process.exit(1);
  }

  // Set local git identity
  await git.setIdentity(account.username, account.email);

  // Update project config if exists
  const projectConfig = await config.getProjectConfig(gitInfo.projectPath);
  if (projectConfig) {
    await config.setProjectConfig(gitInfo.projectPath, {
      ...projectConfig,
      account: account.id,
      addedAt: projectConfig.addedAt,
    });
  }

  console.log(chalk.green(`✓ Now using account '${account.username}'`));
  console.log(chalk.gray(`  Email: ${account.email}`));
  console.log(chalk.gray(`  SSH Key: ${account.sshKey}`));
  
  // Export for shell session (note: only works if user eval's the output)
  console.log(chalk.cyan('\nTo set environment variables for this session:'));
  console.log(chalk.gray('  eval "$(gitconnect use <account>)"'));
}