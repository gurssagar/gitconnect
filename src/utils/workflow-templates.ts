/**
 * Workflow Templates
 * Pre-defined workflow templates for common tasks
 */

export interface WorkflowTemplate {
  id: string;
  name: string;
  description: string;
  steps: WorkflowStep[];
  variables: Record<string, string>;
}

export interface WorkflowStep {
  name: string;
  action: string;
  params: Record<string, unknown>;
  condition?: string;
}

export const workflowTemplates = {
  templates: new Map<string, WorkflowTemplate>(),

  /**
   * Get default templates
   */
  getDefaultTemplates(): WorkflowTemplate[] {
    return [
      {
        id: 'feature-branch',
        name: 'Feature Branch Workflow',
        description: 'Create a feature branch, develop, and merge',
        steps: [
          { name: 'Create branch', action: 'git.checkout', params: { branch: '${branchName}', create: true } },
          { name: 'Develop', action: 'manual', params: { instruction: 'Make your changes' } },
          { name: 'Commit', action: 'git.commit', params: { message: '${commitMessage}' } },
          { name: 'Push', action: 'git.push', params: { remote: 'origin', branch: '${branchName}' } },
          { name: 'Create PR', action: 'pr.create', params: { title: '${prTitle}' } },
        ],
        variables: { branchName: 'feature/new-feature', commitMessage: '', prTitle: '' },
      },
      {
        id: 'hotfix',
        name: 'Hotfix Workflow',
        description: 'Quick fix for production issues',
        steps: [
          { name: 'Checkout main', action: 'git.checkout', params: { branch: 'main' } },
          { name: 'Pull latest', action: 'git.pull', params: {} },
          { name: 'Create hotfix branch', action: 'git.checkout', params: { branch: '${branchName}', create: true } },
          { name: 'Fix issue', action: 'manual', params: { instruction: 'Apply the fix' } },
          { name: 'Commit', action: 'git.commit', params: { message: 'fix: ${description}' } },
          { name: 'Push', action: 'git.push', params: {} },
        ],
        variables: { branchName: 'hotfix/urgent-fix', description: '' },
      },
      {
        id: 'release',
        name: 'Release Workflow',
        description: 'Prepare and publish a release',
        steps: [
          { name: 'Run tests', action: 'npm.test', params: {} },
          { name: 'Build', action: 'npm.build', params: {} },
          { name: 'Bump version', action: 'npm.version', params: { type: '${versionBump}' } },
          { name: 'Update changelog', action: 'manual', params: { instruction: 'Update CHANGELOG.md' } },
          { name: 'Commit release', action: 'git.commit', params: { message: 'chore: release v${version}' } },
          { name: 'Tag', action: 'git.tag', params: { tag: 'v${version}' } },
          { name: 'Push', action: 'git.push', params: { tags: true } },
        ],
        variables: { version: '1.0.0', versionBump: 'patch' },
      },
    ];
  },

  /**
   * Initialize templates
   */
  init(): void {
    for (const template of this.getDefaultTemplates()) {
      this.templates.set(template.id, template);
    }
  },

  /**
   * Create template
   */
  createTemplate(template: WorkflowTemplate): void {
    this.templates.set(template.id, template);
  },

  /**
   * Get template
   */
  getTemplate(id: string): WorkflowTemplate | undefined {
    return this.templates.get(id);
  },

  /**
   * List templates
   */
  listTemplates(): WorkflowTemplate[] {
    return Array.from(this.templates.values());
  },

  /**
   * Delete template
   */
  deleteTemplate(id: string): boolean {
    return this.templates.delete(id);
  },

  /**
   * Execute template
   */
  async execute(id: string, variables: Record<string, string>): Promise<boolean> {
    const template = this.templates.get(id);
    if (!template) return false;

    // Merge variables
    const mergedVars = { ...template.variables, ...variables };

    for (const step of template.steps) {
      console.log(`Executing: ${step.name}`);
      // Would execute each step
    }

    return true;
  },
};

workflowTemplates.init();