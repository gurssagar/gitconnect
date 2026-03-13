/**
 * Custom Linter Configurations
 * Manage custom linter configs per project/account
 */

import * as fs from 'fs/promises';
import * as path from 'path';

export interface LinterProfile {
  name: string;
  linter: 'eslint' | 'tslint' | 'flake8' | 'pylint' | 'golint';
  config: Record<string, unknown>;
  extensions: string[];
}

export const linterConfigs = {
  profiles: new Map<string, LinterProfile>(),

  init(): void {
    this.profiles.set('eslint-standard', {
      name: 'ESLint Standard',
      linter: 'eslint',
      config: {
        extends: ['standard'],
        rules: {
          'no-unused-vars': 'error',
          'semi': ['error', 'always'],
        },
      },
      extensions: ['.js', '.jsx', '.mjs'],
    });

    this.profiles.set('eslint-typescript', {
      name: 'ESLint TypeScript',
      linter: 'eslint',
      config: {
        extends: ['eslint:recommended', '@typescript-eslint/recommended'],
        parser: '@typescript-eslint/parser',
        rules: {
          '@typescript-eslint/no-unused-vars': 'error',
          '@typescript-eslint/explicit-function-return-type': 'off',
        },
      },
      extensions: ['.ts', '.tsx'],
    });

    this.profiles.set('eslint-react', {
      name: 'ESLint React',
      linter: 'eslint',
      config: {
        extends: ['eslint:recommended', 'plugin:react/recommended', 'plugin:react-hooks/recommended'],
        rules: {
          'react/react-in-jsx-scope': 'off',
          'react/prop-types': 'off',
        },
      },
      extensions: ['.jsx', '.tsx'],
    });

    this.profiles.set('flake8-python', {
      name: 'Flake8 Python',
      linter: 'flake8',
      config: {
        max_line_length: 100,
        exclude: ['__pycache__', '.git', 'venv'],
      },
      extensions: ['.py'],
    });
  },

  list(): LinterProfile[] {
    return Array.from(this.profiles.values());
  },

  get(name: string): LinterProfile | undefined {
    return this.profiles.get(name);
  },

  async saveConfig(projectPath: string, profile: LinterProfile): Promise<void> {
    const configPath = path.join(projectPath, profile.linter === 'eslint' ? '.eslintrc.json' : `.${profile.linter}.json`);
    await fs.writeFile(configPath, JSON.stringify(profile.config, null, 2));
  },

  async loadConfig(projectPath: string, linter: string): Promise<Record<string, unknown> | null> {
    const configFiles: Record<string, string> = {
      eslint: '.eslintrc.json',
      tslint: 'tslint.json',
      flake8: '.flake8',
      pylint: '.pylintrc',
    };

    const configPath = path.join(projectPath, configFiles[linter] || `.${linter}.json`);
    try {
      const content = await fs.readFile(configPath, 'utf-8');
      return JSON.parse(content);
    } catch {
      return null;
    }
  },

  addProfile(profile: LinterProfile): void {
    this.profiles.set(profile.name, profile);
  },

  removeProfile(name: string): boolean {
    return this.profiles.delete(name);
  },

  getProfileForExtension(ext: string): LinterProfile | undefined {
    for (const profile of this.profiles.values()) {
      if (profile.extensions.includes(ext)) {
        return profile;
      }
    }
    return undefined;
  },
};

linterConfigs.init();