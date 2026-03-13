/**
 * Lint Rule Management
 * Manage linting rules per account/project
 */

import * as fs from 'fs/promises';
import * as path from 'path';

export interface LintRule {
  id: string;
  rule: string;
  severity: 'error' | 'warn' | 'off';
  options?: unknown[];
}

export interface LintConfig {
  extends: string[];
  rules: Record<string, unknown>;
  overrides?: Array<{ files: string[]; rules: Record<string, unknown> }>;
}

export const lintManager = {
  configs: new Map<string, LintConfig>(),

  async loadConfig(projectPath: string): Promise<LintConfig | null> {
    const configPath = path.join(projectPath, '.eslintrc.json');
    try {
      const content = await fs.readFile(configPath, 'utf-8');
      return JSON.parse(content);
    } catch {
      return null;
    }
  },

  async saveConfig(projectPath: string, config: LintConfig): Promise<void> {
    const configPath = path.join(projectPath, '.eslintrc.json');
    await fs.writeFile(configPath, JSON.stringify(config, null, 2));
  },

  addRule(config: LintConfig, rule: LintRule): LintConfig {
    config.rules[rule.rule] = rule.severity === 'off' ? 'off' : [rule.severity, ...(rule.options || [])];
    return config;
  },

  removeRule(config: LintConfig, ruleName: string): LintConfig {
    delete config.rules[ruleName];
    return config;
  },

  setSeverity(config: LintConfig, ruleName: string, severity: 'error' | 'warn' | 'off'): LintConfig {
    if (config.rules[ruleName]) {
      const current = config.rules[ruleName];
      if (Array.isArray(current)) {
        current[0] = severity;
      } else {
        config.rules[ruleName] = severity;
      }
    }
    return config;
  },

  getRules(config: LintConfig): LintRule[] {
    const rules: LintRule[] = [];
    for (const [rule, value] of Object.entries(config.rules)) {
      if (Array.isArray(value)) {
        rules.push({ id: rule, rule, severity: value[0] as LintRule['severity'], options: value.slice(1) });
      } else {
        rules.push({ id: rule, rule, severity: value as LintRule['severity'] });
      }
    }
    return rules;
  },

  createBaseConfig(): LintConfig {
    return {
      extends: ['eslint:recommended'],
      rules: {
        'no-unused-vars': 'warn',
        'no-console': 'off',
        'semi': ['error', 'always'],
        'quotes': ['error', 'single'],
      },
    };
  },

  createTypeScriptConfig(): LintConfig {
    return {
      extends: ['eslint:recommended', '@typescript-eslint/recommended'],
      rules: {
        '@typescript-eslint/no-unused-vars': 'error',
        '@typescript-eslint/explicit-function-return-type': 'off',
        '@typescript-eslint/no-explicit-any': 'warn',
      },
    };
  },
};