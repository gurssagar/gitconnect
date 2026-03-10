import inquirer from 'inquirer';
import chalk from 'chalk';
import { ConfigManager } from '../core/config';
import { GitManager } from '../core/git';

export async function projectCommand(action: string, mode?: string): Promise<void> {
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
    case 'set':
      await setProjectAccount(config, git, gitInfo.projectPath);
      break;
    case 'mode':
      await setProjectMode(config, gitInfo.projectPath, mode);
      break;
    case 'info':
      await showProjectInfo(config, git, gitInfo);
      break;
    default:
      console.error(chalk.red(`Unknown action: ${action}`));
      process.exit(1);
  }
}

async function setProjectAccount(
  config: ConfigManager,
  git: GitManager,
  projectPath: string
): Promise<void> {
  const accounts = await config.getAccounts();
  
  if (accounts.length === 0) {
    console.log(chalk.yellow('No accounts configured.'));
    console.log(chalk.gray('Run `gitconnect account add` to add an account.'));
    return;
  }

  const detectedOwner = await git.detectGitHubOwner();
  
  const { selectedAccount } = await inquirer.prompt([
    {
      type: 'list',
      name: 'selectedAccount',
      message: 'Select account for this project:',
      choices: accounts.map(a => ({
        name: `${a.username} (${a.email})`,
        value: a.id,
      })),
      default: accounts.find(a => a.username === detectedOwner)?.id,
    },
  ]);

  const { projectMode } = await inquirer.prompt([
    {
      type: 'list',
      name: 'projectMode',
      message: 'Select project mode:',
      choices: [
        { name: 'Prompt - Ask before each push', value: 'prompt' },
        { name: 'Auto - Use configured account automatically', value: 'auto' },
      ],
      default: 'prompt',
    },
  ]);

  const account = accounts.find(a => a.id === selectedAccount)!;
  
  await config.setProjectConfig(projectPath, {
    account: selectedAccount,
    mode: projectMode as 'auto' | 'prompt',
    addedAt: new Date().toISOString(),
  });

  // Set local git identity
  await git.setIdentity(account.username, account.email);

  console.log(chalk.green(`\n✓ Project configured with account '${account.username}'`));
  console.log(chalk.gray(`  Mode: ${projectMode}`));
}

async function setProjectMode(
  config: ConfigManager,
  projectPath: string,
  mode?: string
): Promise<void> {
  const projectConfig = await config.getProjectConfig(projectPath);
  
  if (!projectConfig) {
    console.error(chalk.red('Project not configured. Run `gitconnect project set` first.'));
    process.exit(1);
  }

  if (!mode || !['auto', 'prompt'].includes(mode)) {
    const answers = await inquirer.prompt([
      {
        type: 'list',
        name: 'mode',
        message: 'Select project mode:',
        choices: [
          { name: 'Prompt - Ask before each push', value: 'prompt' },
          { name: 'Auto - Use configured account automatically', value: 'auto' },
        ],
        default: projectConfig.mode,
      },
    ]);
    mode = answers.mode;
  }

  await config.setProjectConfig(projectPath, {
    ...projectConfig,
    mode: mode as 'auto' | 'prompt',
    addedAt: projectConfig.addedAt,
  });

  console.log(chalk.green(`✓ Project mode set to '${mode}'`));
}

async function showProjectInfo(
  config: ConfigManager,
  git: GitManager,
  gitInfo: any
): Promise<void> {
  console.log(chalk.cyan('\n📁 Project Info\n'));
  
  console.log(`  Path: ${gitInfo.projectPath}`);
  console.log(`  Branch: ${gitInfo.currentBranch || 'unknown'}`);
  console.log(`  Remote: ${gitInfo.remoteUrl || 'none'}`);

  const projectConfig = await config.getProjectConfig(gitInfo.projectPath);
  
  if (projectConfig) {
    const account = await config.getAccount(projectConfig.account);
    console.log(`\n  ${chalk.bold('GitConnect Config:')}`);
    console.log(`    Account: ${account?.username || 'unknown'}`);
    console.log(`    Email: ${account?.email || 'unknown'}`);
    console.log(`    Mode: ${projectConfig.mode}`);
    console.log(`    Added: ${new Date(projectConfig.addedAt).toLocaleDateString()}`);
  } else {
    console.log(chalk.yellow('\n  Project not configured with GitConnect'));
    console.log(chalk.gray('  Run `gitconnect project set` to configure'));
  }

  const identity = await git.getIdentity();
  if (identity) {
    console.log(`\n  ${chalk.bold('Local Git Identity:')}`);
    console.log(`    Name: ${identity.name}`);
    console.log(`    Email: ${identity.email}`);
  }
}