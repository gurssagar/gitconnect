/**
 * Pre-commit Hook Templates
 * Predefined templates for git hooks
 */

import * as fs from 'fs/promises';
import * as path from 'path';

export interface HookTemplate {
  name: string;
  description: string;
  stages: string[];
  content: string;
}

export const hookTemplates = {
  templates: new Map<string, HookTemplate>(),

  init(): void {
    this.templates.set('lint', {
      name: 'Lint Check',
      description: 'Run linter on staged files',
      stages: ['pre-commit'],
      content: `#!/bin/sh
. "$(dirname "$0")/_/husky.sh"

npx lint-staged
`,
    });

    this.templates.set('test', {
      name: 'Test Runner',
      description: 'Run tests before push',
      stages: ['pre-push'],
      content: `#!/bin/sh
. "$(dirname "$0")/_/husky.sh"

npm test
`,
    });

    this.templates.set('commitlint', {
      name: 'Commit Message Lint',
      description: 'Validate commit message format',
      stages: ['commit-msg'],
      content: `#!/bin/sh
. "$(dirname "$0")/_/husky.sh"

npx --no -- commitlint --edit "$1"
`,
    });

    this.templates.set('branch-name', {
      name: 'Branch Name Check',
      description: 'Validate branch naming convention',
      stages: ['pre-push'],
      content: `#!/bin/sh
branch=$(git rev-parse --abbrev-ref HEAD)
if [[ ! $branch =~ ^(feature|bugfix|hotfix|release)/.+ ]]; then
  echo "Invalid branch name: $branch"
  echo "Use: feature/*, bugfix/*, hotfix/*, release/*"
  exit 1
fi
`,
    });

    this.templates.set('no-main-commit', {
      name: 'Protect Main',
      description: 'Prevent direct commits to main',
      stages: ['pre-commit'],
      content: `#!/bin/sh
branch=$(git rev-parse --abbrev-ref HEAD)
if [ "$branch" = "main" ]; then
  echo "Direct commits to main are not allowed"
  exit 1
fi
`,
    });
  },

  list(): HookTemplate[] {
    return Array.from(this.templates.values());
  },

  get(name: string): HookTemplate | undefined {
    return this.templates.get(name);
  },

  async install(projectPath: string, templateName: string, stage: string): Promise<boolean> {
    const template = this.templates.get(templateName);
    if (!template) return false;

    const hooksDir = path.join(projectPath, '.git', 'hooks');
    await fs.mkdir(hooksDir, { recursive: true });

    const hookPath = path.join(hooksDir, stage);
    await fs.writeFile(hookPath, template.content);
    await fs.chmod(hookPath, 0o755);

    return true;
  },

  async uninstall(projectPath: string, stage: string): Promise<boolean> {
    const hookPath = path.join(projectPath, '.git', 'hooks', stage);
    try {
      await fs.unlink(hookPath);
      return true;
    } catch {
      return false;
    }
  },

  add(name: string, template: HookTemplate): void {
    this.templates.set(name, template);
  },

  remove(name: string): boolean {
    return this.templates.delete(name);
  },
};

hookTemplates.init();