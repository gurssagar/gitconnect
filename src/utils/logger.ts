/**
 * GitConnect Logger - Structured logging utility
 */

import chalk from 'chalk';

export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'silent';

export class Logger {
  private level: LogLevel;
  private debugMode: boolean;

  constructor(level: LogLevel = 'info') {
    this.level = level;
    this.debugMode = process.env.GITCONNECT_DEBUG === 'true';
  }

  setLevel(level: LogLevel): void {
    this.level = level;
  }

  debug(message: string, ...args: unknown[]): void {
    if (this.level === 'debug' || this.debugMode) {
      console.log(chalk.gray(`[debug] ${message}`), ...args);
    }
  }

  info(message: string, ...args: unknown[]): void {
    if (this.level !== 'silent' && this.level !== 'error' && this.level !== 'warn') {
      console.log(chalk.blue('ℹ'), message, ...args);
    }
  }

  success(message: string, ...args: unknown[]): void {
    if (this.level !== 'silent') {
      console.log(chalk.green('✓'), message, ...args);
    }
  }

  warn(message: string, ...args: unknown[]): void {
    if (this.level !== 'silent' && this.level !== 'error') {
      console.log(chalk.yellow('⚠'), message, ...args);
    }
  }

  error(message: string, ...args: unknown[]): void {
    if (this.level !== 'silent') {
      console.log(chalk.red('✗'), message, ...args);
    }
  }

  fatal(message: string, error?: Error): never {
    console.error(chalk.red.bold('FATAL:'), message);
    if (error && this.debugMode) {
      console.error(chalk.gray(error.stack));
    }
    process.exit(1);
  }

  box(title: string, lines: string[]): void {
    const maxLen = Math.max(title.length, ...lines.map(l => l.length));
    const border = '─'.repeat(maxLen + 2);
    
    console.log(chalk.cyan(`┌${border}┐`));
    console.log(chalk.cyan(`│ ${title.padEnd(maxLen)} │`));
    console.log(chalk.cyan(`├${border}┤`));
    for (const line of lines) {
      console.log(chalk.cyan(`│ ${line.padEnd(maxLen)} │`));
    }
    console.log(chalk.cyan(`└${border}┘`));
  }
}

export const logger = new Logger();