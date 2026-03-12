/**
 * Completion command for GitConnect
 * Generates and installs shell completion scripts
 */

import chalk from 'chalk';
import * as fs from 'fs/promises';
import * as path from 'path';
import {
  generateBashCompletion,
  generateZshCompletion,
  generateFishCompletion,
  detectShell,
  getCompletionPath,
  ShellType,
} from '../completion';

export async function completionCommand(
  action: string,
  shellArg?: string
): Promise<void> {
  // Handle shell types directly (e.g., 'gc completion bash')
  if (['bash', 'zsh', 'fish'].includes(action)) {
    await outputCompletion(action as ShellType);
    return;
  }

  // Handle actions
  switch (action) {
  case 'install':
    await installCompletion(shellArg as ShellType | undefined);
    break;
  case 'uninstall':
    await uninstallCompletion(shellArg as ShellType | undefined);
    break;
  default:
    console.error(chalk.red(`Unknown action: ${action}`));
    showCompletionHelp();
    process.exit(1);
  }
}

function showCompletionHelp(): void {
  console.log(chalk.cyan('\nShell Completion for GitConnect\n'));
  console.log('Usage:');
  console.log(chalk.gray('  gc completion <shell>    Output completion script for shell'));
  console.log(chalk.gray('  gc completion install    Install completions for current shell'));
  console.log(chalk.gray('  gc completion uninstall  Remove installed completions\n'));
  console.log('Supported shells: bash, zsh, fish\n');
  console.log('Examples:');
  console.log(chalk.gray('  # Output bash completion'));
  console.log(chalk.gray('  gc completion bash > ~/.local/share/bash-completion/completions/gitconnect\n'));
  console.log(chalk.gray('  # Auto-install for current shell'));
  console.log(chalk.gray('  gc completion install\n'));
}

async function outputCompletion(shell: ShellType): Promise<void> {
  let script: string;

  switch (shell) {
  case 'bash':
    script = await generateBashCompletion();
    break;
  case 'zsh':
    script = await generateZshCompletion();
    break;
  case 'fish':
    script = await generateFishCompletion();
    break;
  }

  console.log(script);
}

async function installCompletion(shellOverride?: ShellType): Promise<void> {
  const detectedShell = detectShell();
  const shell = shellOverride || detectedShell;

  if (!shell) {
    console.error(chalk.red('Could not detect shell. Please specify:'));
    console.log(chalk.gray('  gc completion install bash'));
    console.log(chalk.gray('  gc completion install zsh'));
    console.log(chalk.gray('  gc completion install fish'));
    process.exit(1);
    return;
  }

  const completionPath = getCompletionPath(shell);
  const completionDir = path.dirname(completionPath);

  // Generate the completion script
  let script: string;
  switch (shell) {
  case 'bash':
    script = await generateBashCompletion();
    break;
  case 'zsh':
    script = await generateZshCompletion();
    break;
  case 'fish':
    script = await generateFishCompletion();
    break;
  }

  // Ensure directory exists
  await fs.mkdir(completionDir, { recursive: true });

  // Write completion file
  await fs.writeFile(completionPath, script, { mode: 0o644 });

  console.log(chalk.green(`✓ ${shell} completion installed to:`));
  console.log(chalk.gray(`  ${completionPath}\n`));

  // Shell-specific instructions
  switch (shell) {
  case 'bash':
    console.log(chalk.cyan('To enable completions, restart your shell or run:'));
    console.log(chalk.gray('  source ~/.bashrc'));
    console.log(chalk.gray('\nOr add to ~/.bashrc if not already:'));
    console.log(chalk.gray('  source ~/.local/share/bash-completion/completions/gitconnect'));
    break;

  case 'zsh':
    console.log(chalk.cyan('To enable completions, add to ~/.zshrc:'));
    console.log(chalk.gray('  fpath=(~/.zfunc $fpath)'));
    console.log(chalk.gray('  autoload -U compinit && compinit'));
    console.log(chalk.gray('\nThen restart your shell or run:'));
    console.log(chalk.gray('  exec zsh'));
    break;

  case 'fish':
    console.log(chalk.cyan('Completions are automatically loaded by fish.'));
    console.log(chalk.gray('Restart your shell or open a new terminal.'));
    break;
  }

  // Also create completion for 'gc' alias
  if (shell === 'bash') {
    const gcPath = path.join(completionDir, 'gc');
    await fs.writeFile(gcPath, script, { mode: 0o644 });
    console.log(chalk.gray('\n✓ Also created completion for \'gc\' alias'));
  } else if (shell === 'fish') {
    // Fish completions work for aliases automatically
    console.log(chalk.gray('\n✓ Completions also work for the gc alias'));
  }
}

async function uninstallCompletion(shellOverride?: ShellType): Promise<void> {
  const detectedShell = detectShell();
  const shell = shellOverride || detectedShell;

  if (!shell) {
    console.error(chalk.red('Could not detect shell. Please specify:'));
    console.log(chalk.gray('  gc completion uninstall bash'));
    console.log(chalk.gray('  gc completion uninstall zsh'));
    console.log(chalk.gray('  gc completion uninstall fish'));
    process.exit(1);
    return;
  }

  const completionPath = getCompletionPath(shell);

  try {
    await fs.unlink(completionPath);
    console.log(chalk.green(`✓ Removed ${shell} completion from:`));
    console.log(chalk.gray(`  ${completionPath}`));

    // Also remove gc alias completion for bash
    if (shell === 'bash') {
      const gcPath = path.join(path.dirname(completionPath), 'gc');
      try {
        await fs.unlink(gcPath);
        console.log(chalk.gray('✓ Also removed completion for \'gc\' alias'));
      } catch {
        // gc completion might not exist
      }
    }
  } catch (error) {
    if (error && typeof error === 'object' && 'code' in error && error.code === 'ENOENT') {
      console.log(chalk.yellow('No completion file found to remove.'));
    } else {
      throw error;
    }
  }
}