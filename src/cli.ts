#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import { initCommand } from './commands/init';
import { accountCommand } from './commands/account';
import { projectCommand } from './commands/project';
import { pushCommand } from './commands/push';
import { useCommand } from './commands/use';
import { statusCommand } from './commands/status';
import { commitCommand } from './commands/commit';
import { hooksCommand } from './commands/hooks';
import { preCommitHook, prePushHook } from './commands/hook';
import { ConfigManager } from './core/config';

// Global error handlers
process.on('uncaughtException', (error: Error) => {
  console.error(chalk.red.bold('Fatal Error:'), error.message);
  if (process.env.GITCONNECT_DEBUG === 'true') {
    console.error(chalk.gray(error.stack));
  }
  process.exit(1);
});

process.on('unhandledRejection', (reason: unknown) => {
  const message = reason instanceof Error ? reason.message : String(reason);
  console.error(chalk.red.bold('Unhandled Promise Rejection:'), message);
  if (process.env.GITCONNECT_DEBUG === 'true' && reason instanceof Error) {
    console.error(chalk.gray(reason.stack));
  }
  process.exit(1);
});

const program = new Command();

program
  .name('gitconnect')
  .alias('gc')
  .description('Multi-GitHub Account Manager - Auto & Explicit Mode')
  .version('1.0.0');

// Initialize
program
  .command('init')
  .description('Initialize GitConnect configuration')
  .action(initCommand);

// Account management
const account = program
  .command('account')
  .description('Manage GitHub accounts');

account
  .command('add')
  .description('Add a new GitHub account')
  .action(() => accountCommand('add'));

account
  .command('list')
  .description('List all accounts')
  .action(() => accountCommand('list'));

account
  .command('remove <name>')
  .description('Remove an account')
  .action((name) => accountCommand('remove', name));

// Project management
const project = program
  .command('project')
  .description('Manage project settings');

project
  .command('set')
  .description('Set account for current project')
  .action(() => projectCommand('set'));

project
  .command('mode <mode>')
  .description('Set project mode (auto/prompt)')
  .action((mode) => projectCommand('mode', mode));

project
  .command('info')
  .description('Show current project info')
  .action(() => projectCommand('info'));

// Commit with account selection
program
  .command('commit')
  .description('Commit with GitConnect (prompts for account)')
  .option('-m, --message <message>', 'Commit message')
  .option('--amend', 'Amend previous commit')
  .option('-s, --sign', 'Sign commit with SSH key')
  .option('-a, --account <name>', 'Use specific account')
  .action(commitCommand);

// Push with explicit control
program
  .command('push')
  .description('Push with GitConnect (explicit mode)')
  .option('-a, --account <name>', 'Use specific account')
  .option('--auto', 'Use auto mode (non-interactive)')
  .action(pushCommand);

// Use account for session
program
  .command('use <account>')
  .description('Use account for this shell session')
  .action(useCommand);

// Status
program
  .command('status')
  .description('Show GitConnect status')
  .action(statusCommand);

// Hook management
const hooks = program
  .command('hooks')
  .description('Manage git hooks');

hooks
  .command('install')
  .description('Install git hooks')
  .option('-t, --type <type>', 'Hook type: commit, push, or all', 'commit')
  .action((options) => hooksCommand('install', options));

hooks
  .command('uninstall')
  .description('Uninstall git hooks')
  .option('-t, --type <type>', 'Hook type: commit, push, or all', 'all')
  .action((options) => hooksCommand('uninstall', options));

hooks
  .command('status')
  .description('Show hook status')
  .action(() => hooksCommand('status', {}));

hooks
  .command('mode [mode]')
  .description('Set hook mode (prompt/auto/off)')
  .action((mode) => hooksCommand('mode', { mode }));

hooks
  .command('silent [mode]')
  .description('Enable/disable silent mode (on/off)')
  .action((mode) => hooksCommand('silent', { silent: mode as 'on' | 'off' }));

// Internal hook handlers (called by git hooks)
program
  .command('hook-pre-commit')
  .description('Internal: Pre-commit hook handler')
  .action(preCommitHook);

program
  .command('hook-pre-push')
  .description('Internal: Pre-push hook handler')
  .action(prePushHook);

// Legacy hook installation (backward compatibility)
program
  .command('install-hook')
  .description('Install git push hook (legacy)')
  .action(async () => {
    const config = new ConfigManager();
    await config.installGitHook();
    console.log(chalk.green('✅ Git hook installed'));
    console.log(chalk.gray('All git push commands will now use GitConnect'));
  });

program
  .command('uninstall-hook')
  .description('Uninstall git push hook (legacy)')
  .action(async () => {
    const config = new ConfigManager();
    await config.uninstallGitHook();
    console.log(chalk.yellow('⚠️  Git hook removed'));
    console.log(chalk.gray('Normal git push behavior restored'));
  });

// Parse arguments
program.parse();

// Show help if no command
if (!process.argv.slice(2).length) {
  program.outputHelp();
}