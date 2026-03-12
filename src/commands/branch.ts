import chalk from 'chalk';
import { ConfigManager } from '../core/config';
import { branchManager } from '../utils/branch';

interface BranchOptions {
  ticket?: string;
  account?: string;
}

export async function branchCommand(
  type: string,
  description: string,
  options: BranchOptions
): Promise<void> {
  const config = new ConfigManager();

  if (!(await config.isInitialized())) {
    console.error(chalk.red('GitConnect not initialized. Run `gitconnect init` first.'));
    process.exit(1);
  }

  const accounts = await config.getAccounts();
  if (accounts.length === 0) {
    console.error(chalk.red('No accounts configured.'));
    process.exit(1);
  }

  let account = options.account
    ? accounts.find(a => a.username === options.account || a.id === options.account)
    : accounts[0];

  if (!account) {
    console.error(chalk.red(`Account '${options.account}' not found`));
    process.exit(1);
  }

  const validTypes = ['feature', 'bugfix', 'hotfix', 'release', 'chore'];
  if (!validTypes.includes(type)) {
    console.error(chalk.red(`Invalid branch type. Use: ${validTypes.join(', ')}`));
    process.exit(1);
  }

  const branchName = branchManager.generateBranchName(
    type as 'feature' | 'bugfix' | 'hotfix' | 'release' | 'chore',
    account.username,
    description,
    options.ticket
  );

  console.log(chalk.cyan(`\nCreating branch: ${chalk.bold(branchName)}\n`));

  const success = branchManager.createBranch(branchName);
  if (success) {
    console.log(chalk.green('✓ Branch created successfully'));
  } else {
    console.error(chalk.red('Failed to create branch'));
    process.exit(1);
  }
}