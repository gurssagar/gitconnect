import chalk from 'chalk';
import ora from 'ora';
import { ConfigManager } from '../core/config';

export async function initCommand(): Promise<void> {
  const spinner = ora('Initializing GitConnect...').start();
  
  try {
    const config = new ConfigManager();
    await config.init();
    
    spinner.succeed('GitConnect initialized successfully!');
    
    console.log('\nNext steps:');
    console.log(chalk.cyan('  gitconnect account add') + '  - Add a GitHub account');
    console.log(chalk.cyan('  gitconnect project set') + '  - Set account for current project');
    console.log(chalk.cyan('  gitconnect status') + '        - View current status');
  } catch (error: unknown) {
    spinner.fail('Initialization failed');
    console.error(chalk.red(error instanceof Error ? error.message : String(error)));
    process.exit(1);
  }
}