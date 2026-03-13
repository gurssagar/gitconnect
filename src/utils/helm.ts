/**
 * Helm Chart Support
 * Manage Helm charts for Kubernetes
 */

import { execSync } from 'child_process';

export const helmManager = {
  async install(name: string, chart: string, namespace?: string): Promise<boolean> {
    const ns = namespace ? `-n ${namespace}` : '';
    try { execSync(`helm install ${name} ${chart} ${ns}`, { stdio: 'pipe' }); return true; } catch { return false; }
  },
  async upgrade(name: string, chart: string): Promise<boolean> {
    try { execSync(`helm upgrade ${name} ${chart}`, { stdio: 'pipe' }); return true; } catch { return false; }
  },
  async uninstall(name: string, namespace?: string): Promise<boolean> {
    const ns = namespace ? `-n ${namespace}` : '';
    try { execSync(`helm uninstall ${name} ${ns}`, { stdio: 'pipe' }); return true; } catch { return false; }
  },
  async list(namespace?: string): Promise<string[]> {
    const ns = namespace ? `-n ${namespace}` : '';
    try { return execSync(`helm list ${ns} -q`, { encoding: 'utf-8' }).trim().split('\n').filter(Boolean); } catch { return []; }
  },
  generateChart(name: string): string {
    return `apiVersion: v2
name: ${name}
description: A Helm chart for ${name}
type: application
version: 0.1.0
`;
  },
};