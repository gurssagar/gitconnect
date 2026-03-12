/**
 * CI/CD Platform Integration
 * Detects and configures GitConnect for various CI/CD platforms
 */

import * as fs from 'fs/promises';

export type CIPlatform = 'github-actions' | 'gitlab-ci' | 'jenkins' | 'circleci' | 'travis' | 'azure-pipelines' | 'unknown';

export interface CIDetector {
  name: string;
  detect(): Promise<boolean>;
  getEnvVars(): Record<string, string>;
  isPR(): boolean;
  getBranch(): string | null;
  getCommitSha(): string | null;
}

export const ciDetectors: Record<string, CIDetector> = {
  'github-actions': {
    name: 'GitHub Actions',
    async detect(): Promise<boolean> {
      return process.env.GITHUB_ACTIONS === 'true';
    },
    getEnvVars(): Record<string, string> {
      return {
        workflow: process.env.GITHUB_WORKFLOW || '',
        runId: process.env.GITHUB_RUN_ID || '',
        runNumber: process.env.GITHUB_RUN_NUMBER || '',
        actor: process.env.GITHUB_ACTOR || '',
        repository: process.env.GITHUB_REPOSITORY || '',
        ref: process.env.GITHUB_REF || '',
        sha: process.env.GITHUB_SHA || '',
      };
    },
    isPR(): boolean {
      return process.env.GITHUB_EVENT_NAME === 'pull_request';
    },
    getBranch(): string | null {
      const ref = process.env.GITHUB_REF || '';
      if (ref.startsWith('refs/heads/')) {
        return ref.replace('refs/heads/', '');
      }
      return null;
    },
    getCommitSha(): string | null {
      return process.env.GITHUB_SHA || null;
    },
  },

  'gitlab-ci': {
    name: 'GitLab CI',
    async detect(): Promise<boolean> {
      return process.env.GITLAB_CI === 'true';
    },
    getEnvVars(): Record<string, string> {
      return {
        pipelineId: process.env.CI_PIPELINE_ID || '',
        jobId: process.env.CI_JOB_ID || '',
        commitSha: process.env.CI_COMMIT_SHA || '',
        refName: process.env.CI_COMMIT_REF_NAME || '',
        projectId: process.env.CI_PROJECT_ID || '',
        projectName: process.env.CI_PROJECT_NAME || '',
      };
    },
    isPR(): boolean {
      return process.env.CI_MERGE_REQUEST_IID !== undefined;
    },
    getBranch(): string | null {
      return process.env.CI_COMMIT_REF_NAME || null;
    },
    getCommitSha(): string | null {
      return process.env.CI_COMMIT_SHA || null;
    },
  },

  'jenkins': {
    name: 'Jenkins',
    async detect(): Promise<boolean> {
      return process.env.JENKINS_URL !== undefined || process.env.BUILD_URL !== undefined;
    },
    getEnvVars(): Record<string, string> {
      return {
        buildNumber: process.env.BUILD_NUMBER || '',
        buildUrl: process.env.BUILD_URL || '',
        jobName: process.env.JOB_NAME || '',
        branch: process.env.GIT_BRANCH || '',
        commit: process.env.GIT_COMMIT || '',
      };
    },
    isPR(): boolean {
      return (process.env.CHANGE_ID !== undefined);
    },
    getBranch(): string | null {
      return process.env.GIT_BRANCH || null;
    },
    getCommitSha(): string | null {
      return process.env.GIT_COMMIT || null;
    },
  },

  'circleci': {
    name: 'CircleCI',
    async detect(): Promise<boolean> {
      return process.env.CIRCLECI === 'true';
    },
    getEnvVars(): Record<string, string> {
      return {
        buildNum: process.env.CIRCLE_BUILD_NUM || '',
        workflowId: process.env.CIRCLE_WORKFLOW_ID || '',
        repository: process.env.CIRCLE_REPOSITORY_URL || '',
        branch: process.env.CIRCLE_BRANCH || '',
        sha: process.env.CIRCLE_SHA1 || '',
      };
    },
    isPR(): boolean {
      return process.env.CIRCLE_PR_NUMBER !== undefined;
    },
    getBranch(): string | null {
      return process.env.CIRCLE_BRANCH || null;
    },
    getCommitSha(): string | null {
      return process.env.CIRCLE_SHA1 || null;
    },
  },

  'travis': {
    name: 'Travis CI',
    async detect(): Promise<boolean> {
      return process.env.TRAVIS === 'true';
    },
    getEnvVars(): Record<string, string> {
      return {
        buildNumber: process.env.TRAVIS_BUILD_NUMBER || '',
        buildId: process.env.TRAVIS_BUILD_ID || '',
        branch: process.env.TRAVIS_BRANCH || '',
        commit: process.env.TRAVIS_COMMIT || '',
        repoSlug: process.env.TRAVIS_REPO_SLUG || '',
      };
    },
    isPR(): boolean {
      return process.env.TRAVIS_PULL_REQUEST !== 'false';
    },
    getBranch(): string | null {
      return process.env.TRAVIS_BRANCH || null;
    },
    getCommitSha(): string | null {
      return process.env.TRAVIS_COMMIT || null;
    },
  },

  'azure-pipelines': {
    name: 'Azure Pipelines',
    async detect(): Promise<boolean> {
      return process.env.TF_BUILD === 'True';
    },
    getEnvVars(): Record<string, string> {
      return {
        buildNumber: process.env.BUILD_BUILDNUMBER || '',
        buildId: process.env.BUILD_BUILDID || '',
        repository: process.env.BUILD_REPOSITORY_URI || '',
        branch: process.env.BUILD_SOURCEBRANCH || '',
        sha: process.env.BUILD_SOURCEVERSION || '',
      };
    },
    isPR(): boolean {
      return process.env.BUILD_REASON === 'PullRequest';
    },
    getBranch(): string | null {
      const ref = process.env.BUILD_SOURCEBRANCH || '';
      if (ref.startsWith('refs/heads/')) {
        return ref.replace('refs/heads/', '');
      }
      return ref || null;
    },
    getCommitSha(): string | null {
      return process.env.BUILD_SOURCEVERSION || null;
    },
  },
};

export const ciManager = {
  /**
   * Detect the current CI platform
   */
  async detectPlatform(): Promise<CIPlatform> {
    for (const [key, detector] of Object.entries(ciDetectors)) {
      if (await detector.detect()) {
        return key as CIPlatform;
      }
    }
    return 'unknown';
  },

  /**
   * Get the detector for a specific platform
   */
  getDetector(platform: CIPlatform): CIDetector | null {
    if (platform === 'unknown') return null;
    return ciDetectors[platform] || null;
  },

  /**
   * Check if running in CI environment
   */
  async isCI(): Promise<boolean> {
    const platform = await this.detectPlatform();
    return platform !== 'unknown';
  },

  /**
   * Get CI environment information
   */
  async getCIInfo(): Promise<{
    platform: CIPlatform;
    name: string;
    envVars: Record<string, string>;
    isPR: boolean;
    branch: string | null;
    commitSha: string | null;
  }> {
    const platform = await this.detectPlatform();
    const detector = this.getDetector(platform);

    if (!detector) {
      return {
        platform: 'unknown',
        name: 'Local',
        envVars: {},
        isPR: false,
        branch: null,
        commitSha: null,
      };
    }

    return {
      platform,
      name: detector.name,
      envVars: detector.getEnvVars(),
      isPR: detector.isPR(),
      branch: detector.getBranch(),
      commitSha: detector.getCommitSha(),
    };
  },

  /**
   * Generate CI configuration for GitConnect
   */
  async generateConfig(platform: CIPlatform, accounts: string[]): Promise<string> {
    switch (platform) {
    case 'github-actions':
      return this.generateGitHubActionsConfig(accounts);
    case 'gitlab-ci':
      return this.generateGitLabCIConfig(accounts);
    default:
      return '';
    }
  },

  /**
   * Generate GitHub Actions workflow
   */
  generateGitHubActionsConfig(accounts: string[]): string {
    return `name: GitConnect Setup

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  setup:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Install GitConnect
        run: npm install -g @technobromo/gitconnect

      - name: Configure GitConnect
        run: |
          gitconnect init
          # Configure accounts from secrets
          ${accounts.map((_, i) => `# gitconnect account add --name account${i + 1}`).join('\n          ')}
        env:
          GITCONNECT_SILENT: true
`;
  },

  /**
   * Generate GitLab CI configuration
   */
  generateGitLabCIConfig(accounts: string[]): string {
    return `# GitConnect GitLab CI Configuration

stages:
  - setup
  - build
  - test

variables:
  GITCONNECT_SILENT: "true"

setup_gitconnect:
  stage: setup
  image: node:20
  before_script:
    - npm install -g @technobromo/gitconnect
    - gitconnect init
  script:
    - echo "GitConnect configured"
${accounts.map((_, i) => `    # gitconnect account add --name account${i + 1}`).join('\n')}

build:
  stage: build
  script:
    - npm ci
    - npm run build

test:
  stage: test
  script:
    - npm test
`;
  },

  /**
   * Detect pre-commit framework
   */
  async detectPreCommit(): Promise<boolean> {
    try {
      await fs.access('.pre-commit-config.yaml');
      return true;
    } catch {
      return false;
    }
  },

  /**
   * Generate pre-commit hook configuration
   */
  generatePreCommitConfig(): string {
    return `# GitConnect Pre-commit Configuration
# See https://pre-commit.com for more information

repos:
  - repo: local
    hooks:
      - id: gitconnect-identity
        name: GitConnect Identity Check
        entry: gitconnect hooks pre-commit
        language: system
        pass_filenames: false
        always_run: true

      - id: gitconnect-validate
        name: GitConnect Validate Account
        entry: gitconnect status
        language: system
        pass_filenames: false
        always_run: true
`;
  },
};