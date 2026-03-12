/**
 * Commit Template Management
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';

export interface CommitTemplate {
  name: string;
  content: string;
  variables?: Record<string, string>;
}

export class TemplateManager {
  private templatesDir: string;

  constructor() {
    this.templatesDir = path.join(os.homedir(), '.gitconnect', 'templates');
  }

  /**
   * Initialize templates directory
   */
  async init(): Promise<void> {
    await fs.mkdir(this.templatesDir, { recursive: true, mode: 0o700 });
  }

  /**
   * Save a commit template
   */
  async saveTemplate(name: string, content: string): Promise<void> {
    await this.init();
    const templatePath = path.join(this.templatesDir, `${name}.txt`);
    await fs.writeFile(templatePath, content, { mode: 0o600 });
  }

  /**
   * Get a commit template
   */
  async getTemplate(name: string): Promise<string | null> {
    try {
      const templatePath = path.join(this.templatesDir, `${name}.txt`);
      return await fs.readFile(templatePath, 'utf-8');
    } catch {
      return null;
    }
  }

  /**
   * List all templates
   */
  async listTemplates(): Promise<string[]> {
    try {
      const files = await fs.readdir(this.templatesDir);
      return files.filter(f => f.endsWith('.txt')).map(f => f.replace('.txt', ''));
    } catch {
      return [];
    }
  }

  /**
   * Delete a template
   */
  async deleteTemplate(name: string): Promise<boolean> {
    try {
      const templatePath = path.join(this.templatesDir, `${name}.txt`);
      await fs.unlink(templatePath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Apply variables to a template
   */
  applyVariables(template: string, variables: Record<string, string>): string {
    let result = template;
    for (const [key, value] of Object.entries(variables)) {
      const regex = new RegExp(`\\{\\{\\s*${key}\\s*\\}\\}`, 'g');
      result = result.replace(regex, value);
    }
    return result;
  }

  /**
   * Get default templates
   */
  getDefaultTemplates(): Record<string, string> {
    return {
      conventional: `{{type}}({{scope}}): {{description}}

{{body}}

{{footer}}`,
      simple: '{{description}}',
      detailed: `{{summary}}

Why:
{{why}}

How:
{{how}}

Testing:
{{testing}}`,
    };
  }

  /**
   * Initialize default templates
   */
  async initDefaultTemplates(): Promise<void> {
    await this.init();
    const defaults = this.getDefaultTemplates();

    for (const [name, content] of Object.entries(defaults)) {
      const existing = await this.getTemplate(name);
      if (!existing) {
        await this.saveTemplate(name, content);
      }
    }
  }
}

export const templateManager = new TemplateManager();