/**
 * Terraform Integration
 * Manage infrastructure as code
 */

import { execSync } from 'child_process';

export const terraformIntegration = {
  async init(path: string): Promise<boolean> {
    try { execSync('terraform init', { cwd: path, stdio: 'pipe' }); return true; } catch { return false; }
  },
  async plan(path: string): Promise<string> {
    try { return execSync('terraform plan', { cwd: path, encoding: 'utf-8' }); } catch { return ''; }
  },
  async apply(path: string, autoApprove: boolean = false): Promise<boolean> {
    try { execSync(`terraform apply${autoApprove ? ' -auto-approve' : ''}`, { cwd: path, stdio: 'pipe' }); return true; } catch { return false; }
  },
  async destroy(path: string): Promise<boolean> {
    try { execSync('terraform destroy -auto-approve', { cwd: path, stdio: 'pipe' }); return true; } catch { return false; }
  },
  async validate(path: string): Promise<boolean> {
    try { execSync('terraform validate', { cwd: path, stdio: 'pipe' }); return true; } catch { return false; }
  },
};