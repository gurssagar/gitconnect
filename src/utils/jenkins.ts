/**
 * Jenkins Plugin Support
 */

export const jenkinsPlugin = {
  /**
   * Generate Jenkinsfile for GitConnect
   */
  generateJenkinsfile(accounts: string[]): string {
    return `pipeline {
  agent any

  environment {
    GITCONNECT_SILENT = 'true'
  }

  stages {
    stage('Setup GitConnect') {
      steps {
        sh 'npm install -g @technobromo/gitconnect'
        sh 'gitconnect init'
      }
    }

    stage('Configure Accounts') {
      steps {
        script {
          ${accounts.map((a, _i) => `// Configure account: ${a}`).join('\n          ')}
        }
      }
    }

    stage('Build') {
      steps {
        sh 'npm ci'
        sh 'npm run build'
      }
    }

    stage('Test') {
      steps {
        sh 'npm test'
      }
    }

    stage('Commit Check') {
      steps {
        sh 'gitconnect status'
      }
    }
  }

  post {
    always {
      cleanWs()
    }
  }
}`;
  },

  /**
   * Generate Jenkins plugin descriptor
   */
  generatePluginDescriptor(): string {
    return JSON.stringify({
      id: 'gitconnect',
      version: '1.0.0',
      name: 'GitConnect Plugin',
      description: 'Multi-account git management for Jenkins pipelines',
      extensions: [
        {
          type: 'pipeline-step',
          name: 'gitconnectSetup',
          displayName: 'GitConnect Setup',
        },
      ],
    }, null, 2);
  },
};