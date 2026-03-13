/**
 * Code Formatter Integration
 * Integrate with Prettier and other formatters
 */

import { execSync } from 'child_process';
import * as fs from 'fs/promises';
import * as path from 'path';

export interface FormatterConfig {
  formatter: 'prettier' | 'black' | 'gofmt' | 'rustfmt';
  config?: Record<string, unknown>;
  ignorePatterns?: string[];
}

export const formatterIntegration = {
  configs: new Map<string, FormatterConfig>(),

  async detectFormatter(projectPath: string): Promise<FormatterConfig | null> {
    try {
      const prettierPath = path.join(projectPath, '.prettierrc');
      await fs.access(prettierPath);
      return { formatter: 'prettier' };
    } catch {
      // Not prettier
    }

    try {
      const pyproject = path.join(projectPath, 'pyproject.toml');
      await fs.access(pyproject);
      return { formatter: 'black' };
    } catch {
      // Not black
    }

    return null;
  },

  async formatFile(filePath: string, config: FormatterConfig): Promise<boolean> {
    try {
      if (config.formatter === 'prettier') {
        execSync(`npx prettier --write "${filePath}"`, { stdio: 'pipe' });
        return true;
      }
      if (config.formatter === 'black') {
        execSync(`black "${filePath}"`, { stdio: 'pipe' });
        return true;
      }
      return false;
    } catch {
      return false;
    }
  },

  async formatAll(projectPath: string, config: FormatterConfig): Promise<number> {
    try {
      if (config.formatter === 'prettier') {
        execSync('npx prettier --write .', { cwd: projectPath, stdio: 'pipe' });
        return 1;
      }
      return 0;
    } catch {
      return 0;
    }
  },

  async checkFormatting(filePath: string, config: FormatterConfig): Promise<boolean> {
    try {
      if (config.formatter === 'prettier') {
        execSync(`npx prettier --check "${filePath}"`, { stdio: 'pipe' });
        return true;
      }
      return false;
    } catch {
      return false;
    }
  },

  createPrettierConfig(): Record<string, unknown> {
    return {
      semi: true,
      singleQuote: true,
      tabWidth: 2,
      trailingComma: 'es5',
      printWidth: 100,
    };
  },

  async savePrettierConfig(projectPath: string, config: Record<string, unknown>): Promise<void> {
    const configPath = path.join(projectPath, '.prettierrc.json');
    await fs.writeFile(configPath, JSON.stringify(config, null, 2));
  },
};