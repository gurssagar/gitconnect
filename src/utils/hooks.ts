/**
 * Custom Hook Scripts Per Project
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import { execSync } from 'child_process';

export interface HookScript {
  name: string;
  type: 'pre-commit' | 'pre-push' | 'post-commit' | 'post-merge';
  command: string;
  enabled: boolean;
}

export const hookScriptManager = {
  /**
   * Get hooks directory for project
   */
  async getHooksDir(projectDir: string): Promise<string> {
    const hooksDir = path.join(projectDir, '.gitconnect', 'hooks');
    await fs.mkdir(hooksDir, { recursive: true, mode: 0o700 });
    return hooksDir;
  },

  /**
   * List custom hooks for a project
   */
  async listHooks(projectDir: string): Promise<HookScript[]> {
    const hooksDir = await this.getHooksDir(projectDir);
    const hooks: HookScript[] = [];

    try {
      const files = await fs.readdir(hooksDir);
      for (const file of files) {
        if (file.endsWith('.json')) {
          const content = await fs.readFile(path.join(hooksDir, file), 'utf-8');
          hooks.push(JSON.parse(content));
        }
      }
    } catch { /* no hooks */ }

    return hooks;
  },

  /**
   * Add a custom hook
   */
  async addHook(projectDir: string, hook: HookScript): Promise<boolean> {
    try {
      const hooksDir = await this.getHooksDir(projectDir);
      const hookPath = path.join(hooksDir, `${hook.name}.json`);
      await fs.writeFile(hookPath, JSON.stringify(hook, null, 2), { mode: 0o600 });
      return true;
    } catch {
      return false;
    }
  },

  /**
   * Remove a custom hook
   */
  async removeHook(projectDir: string, name: string): Promise<boolean> {
    try {
      const hooksDir = await this.getHooksDir(projectDir);
      await fs.unlink(path.join(hooksDir, `${name}.json`));
      return true;
    } catch {
      return false;
    }
  },

  /**
   * Execute hooks of a given type
   */
  async executeHooks(projectDir: string, type: HookScript['type']): Promise<{ success: boolean; output: string[] }> {
    const hooks = await this.listHooks(projectDir);
    const relevantHooks = hooks.filter(h => h.type === type && h.enabled);
    const output: string[] = [];

    for (const hook of relevantHooks) {
      try {
        execSync(hook.command, { cwd: projectDir, stdio: 'pipe' });
        output.push(`[${hook.name}] Success`);
      } catch {
        output.push(`[${hook.name}] Failed`);
        return { success: false, output };
      }
    }

    return { success: true, output };
  },
};