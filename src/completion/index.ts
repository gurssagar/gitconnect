/**
 * Shell completion generators for GitConnect
 */

import * as os from 'os';

export { generateBashCompletion } from './bash';
export { generateZshCompletion } from './zsh';
export { generateFishCompletion } from './fish';

export type ShellType = 'bash' | 'zsh' | 'fish';

/**
 * Detect the current shell type
 */
export function detectShell(): ShellType | null {
  const shell = process.env.SHELL || '';
  const fishVersion = process.env.FISH_VERSION;

  if (fishVersion) {
    return 'fish';
  }

  if (shell.includes('zsh')) {
    return 'zsh';
  }

  if (shell.includes('bash')) {
    return 'bash';
  }

  return null;
}

/**
 * Get the completion file path for a shell
 */
export function getCompletionPath(shell: ShellType): string {
  const home = os.homedir();

  switch (shell) {
  case 'bash':
    // XDG-compliant bash-completion location
    return `${home}/.local/share/bash-completion/completions/gitconnect`;
  case 'zsh':
    // Standard zsh fpath location
    return `${home}/.zfunc/_gitconnect`;
  case 'fish':
    // Fish standard completions location
    return `${home}/.config/fish/completions/gitconnect.fish`;
  }
}