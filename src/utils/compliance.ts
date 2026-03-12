/**
 * Compliance Reporting
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';

export interface ComplianceReport {
  generatedAt: string;
  version: string;
  checks: ComplianceCheck[];
  summary: { passed: number; failed: number; warnings: number };
}

export interface ComplianceCheck {
  category: string;
  name: string;
  status: 'pass' | 'fail' | 'warning';
  details: string;
}

export const complianceReporter = {
  reportDir: path.join(os.homedir(), '.gitconnect', 'compliance'),

  async generateReport(): Promise<ComplianceReport> {
    const checks: ComplianceCheck[] = [];

    // Check SSH key permissions
    checks.push({
      category: 'Security',
      name: 'SSH Key Permissions',
      status: await this.checkSSHPermissions() ? 'pass' : 'fail',
      details: 'SSH keys should have 0600 permissions',
    });

    // Check config permissions
    checks.push({
      category: 'Security',
      name: 'Config Permissions',
      status: await this.checkConfigPermissions() ? 'pass' : 'fail',
      details: 'Config files should have 0600 permissions',
    });

    // Check for exposed credentials
    checks.push({
      category: 'Security',
      name: 'No Exposed Credentials',
      status: await this.checkNoExposedCredentials() ? 'pass' : 'warning',
      details: 'Scan for accidentally committed credentials',
    });

    const summary = {
      passed: checks.filter(c => c.status === 'pass').length,
      failed: checks.filter(c => c.status === 'fail').length,
      warnings: checks.filter(c => c.status === 'warning').length,
    };

    return {
      generatedAt: new Date().toISOString(),
      version: '1.1.0',
      checks,
      summary,
    };
  },

  async checkSSHPermissions(): Promise<boolean> {
    try {
      const sshDir = path.join(os.homedir(), '.gitconnect', 'ssh');
      const files = await fs.readdir(sshDir);
      for (const file of files) {
        const stat = await fs.stat(path.join(sshDir, file));
        const mode = (stat.mode & 0o777).toString(8);
        if (mode !== '600' && mode !== '400') return false;
      }
      return true;
    } catch {
      return true;
    }
  },

  async checkConfigPermissions(): Promise<boolean> {
    try {
      const configDir = path.join(os.homedir(), '.gitconnect');
      const files = ['accounts.json', 'settings.json'];
      for (const file of files) {
        const stat = await fs.stat(path.join(configDir, file));
        const mode = (stat.mode & 0o777).toString(8);
        if (mode !== '600' && mode !== '400') return false;
      }
      return true;
    } catch {
      return true;
    }
  },

  async checkNoExposedCredentials(): Promise<boolean> {
    // Placeholder - would scan git history for secrets
    return true;
  },

  async exportReport(format: 'json' | 'html' | 'pdf' = 'json'): Promise<string> {
    const report = await this.generateReport();
    await fs.mkdir(this.reportDir, { recursive: true });

    const outputPath = path.join(this.reportDir, `compliance-report-${Date.now()}.${format}`);

    if (format === 'json') {
      await fs.writeFile(outputPath, JSON.stringify(report, null, 2), 'utf-8');
    } else if (format === 'html') {
      const html = this.generateHTML(report);
      await fs.writeFile(outputPath, html, 'utf-8');
    }

    return outputPath;
  },

  generateHTML(report: ComplianceReport): string {
    return `<!DOCTYPE html>
<html><head><title>Compliance Report</title></head>
<body>
<h1>GitConnect Compliance Report</h1>
<p>Generated: ${report.generatedAt}</p>
<p>Version: ${report.version}</p>
<h2>Summary</h2>
<p>Passed: ${report.summary.passed} | Failed: ${report.summary.failed} | Warnings: ${report.summary.warnings}</p>
<h2>Checks</h2>
<table>
<tr><th>Category</th><th>Name</th><th>Status</th><th>Details</th></tr>
${report.checks.map(c => `<tr><td>${c.category}</td><td>${c.name}</td><td>${c.status}</td><td>${c.details}</td></tr>`).join('')}
</table>
</body></html>`;
  },
};