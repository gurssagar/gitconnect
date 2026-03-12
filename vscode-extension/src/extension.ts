import * as vscode from 'vscode';
import { execSync } from 'child_process';
import * as path from 'path';
import * as fs from 'fs';

interface Account {
  id: string;
  username: string;
  email: string;
  sshKey: string;
  createdAt: string;
}

interface ProjectConfig {
  account: string;
  mode: 'auto' | 'prompt' | 'off';
  addedAt: string;
}

let statusBarItem: vscode.StatusBarItem;

export function activate(context: vscode.ExtensionContext) {
  console.log('GitConnect extension is now active');

  // Create status bar item
  statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 100);
  context.subscriptions.push(statusBarItem);

  // Register commands
  const switchAccountCmd = vscode.commands.registerCommand('gitconnect.switchAccount', switchAccount);
  const showStatusCmd = vscode.commands.registerCommand('gitconnect.showStatus', showStatus);
  const setProjectModeCmd = vscode.commands.registerCommand('gitconnect.setProjectMode', setProjectMode);

  context.subscriptions.push(switchAccountCmd, showStatusCmd, setProjectModeCmd);

  // Update status bar on startup
  updateStatusBar();

  // Update status bar when workspace folders change
  context.subscriptions.push(
    vscode.workspace.onDidChangeWorkspaceFolders(() => updateStatusBar())
  );
}

function getGitConnectPath(): string {
  // Check if gitconnect is in PATH
  try {
    execSync('which gitconnect', { stdio: 'pipe' });
    return 'gitconnect';
  } catch {
    // Try common locations
    const home = process.env.HOME || '';
    const npmPath = path.join(home, '.npm-global', 'bin', 'gitconnect');
    if (fs.existsSync(npmPath)) {
      return npmPath;
    }
    return 'gitconnect'; // Fall back to PATH
  }
}

function getConfigPath(): string {
  const home = process.env.HOME || process.env.USERPROFILE || '';
  return path.join(home, '.gitconnect');
}

function getAccounts(): Account[] {
  try {
    const configPath = getConfigPath();
    const accountsPath = path.join(configPath, 'accounts.json');
    if (fs.existsSync(accountsPath)) {
      const data = fs.readFileSync(accountsPath, 'utf-8');
      const config = JSON.parse(data);
      return config.accounts || [];
    }
  } catch (error) {
    console.error('Failed to read accounts:', error);
  }
  return [];
}

function getProjectConfig(projectPath: string): ProjectConfig | null {
  try {
    const configPath = getConfigPath();
    const projectsPath = path.join(configPath, 'projects.json');
    if (fs.existsSync(projectsPath)) {
      const data = fs.readFileSync(projectsPath, 'utf-8');
      const config = JSON.parse(data);
      return config.projects?.[projectPath] || null;
    }
  } catch (error) {
    console.error('Failed to read project config:', error);
  }
  return null;
}

function getAccountById(accountId: string): Account | undefined {
  const accounts = getAccounts();
  return accounts.find(a => a.id === accountId);
}

function getCurrentWorkspacePath(): string | null {
  const workspaceFolders = vscode.workspace.workspaceFolders;
  if (workspaceFolders && workspaceFolders.length > 0) {
    return workspaceFolders[0].uri.fsPath;
  }
  return null;
}

async function switchAccount() {
  const accounts = getAccounts();

  if (accounts.length === 0) {
    vscode.window.showErrorMessage('No accounts configured. Run `gitconnect account add` in terminal first.');
    return;
  }

  const items = accounts.map(a => ({
    label: a.username,
    description: a.email,
    account: a
  }));

  const selected = await vscode.window.showQuickPick(items, {
    placeHolder: 'Select account to use'
  });

  if (selected) {
    const workspacePath = getCurrentWorkspacePath();
    if (!workspacePath) {
      vscode.window.showErrorMessage('No workspace folder open');
      return;
    }

    try {
      const gitconnect = getGitConnectPath();
      execSync(`${gitconnect} use ${selected.account.username}`, {
        cwd: workspacePath,
        stdio: 'pipe'
      });
      vscode.window.showInformationMessage(`Switched to account: ${selected.account.username}`);
      updateStatusBar();
    } catch (error) {
      vscode.window.showErrorMessage(`Failed to switch account: ${error}`);
    }
  }
}

async function showStatus() {
  const workspacePath = getCurrentWorkspacePath();
  if (!workspacePath) {
    vscode.window.showErrorMessage('No workspace folder open');
    return;
  }

  try {
    const gitconnect = getGitConnectPath();
    const output = execSync(`${gitconnect} status`, {
      cwd: workspacePath,
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe']
    });

    // Create output channel and show status
    const channel = vscode.window.createOutputChannel('GitConnect');
    channel.clear();
    channel.appendLine(output);
    channel.show();
  } catch (error) {
    vscode.window.showErrorMessage(`Failed to get status: ${error}`);
  }
}

async function setProjectMode() {
  const modes = [
    { label: 'auto', description: 'Use configured account automatically' },
    { label: 'prompt', description: 'Ask for account before each commit/push' },
    { label: 'off', description: 'Disable GitConnect hooks temporarily' }
  ];

  const selected = await vscode.window.showQuickPick(modes, {
    placeHolder: 'Select project mode'
  });

  if (selected) {
    const workspacePath = getCurrentWorkspacePath();
    if (!workspacePath) {
      vscode.window.showErrorMessage('No workspace folder open');
      return;
    }

    try {
      const gitconnect = getGitConnectPath();
      execSync(`${gitconnect} hooks mode ${selected.label}`, {
        cwd: workspacePath,
        stdio: 'pipe'
      });
      vscode.window.showInformationMessage(`Project mode set to: ${selected.label}`);
      updateStatusBar();
    } catch (error) {
      vscode.window.showErrorMessage(`Failed to set mode: ${error}`);
    }
  }
}

function updateStatusBar() {
  const config = vscode.workspace.getConfiguration('gitconnect');
  if (!config.get('showStatusBar', true)) {
    statusBarItem.hide();
    return;
  }

  const workspacePath = getCurrentWorkspacePath();
  if (!workspacePath) {
    statusBarItem.hide();
    return;
  }

  const projectConfig = getProjectConfig(workspacePath);
  if (projectConfig && projectConfig.account) {
    const account = getAccountById(projectConfig.account);
    if (account) {
      statusBarItem.text = `$(account) ${account.username}`;
      statusBarItem.tooltip = `GitConnect: ${account.username} (${account.email})`;
      statusBarItem.command = 'gitconnect.switchAccount';
      statusBarItem.show();
      return;
    }
  }

  // No account configured
  statusBarItem.text = '$(account) No account';
  statusBarItem.tooltip = 'GitConnect: Click to select account';
  statusBarItem.command = 'gitconnect.switchAccount';
  statusBarItem.show();
}

export function deactivate() {
  if (statusBarItem) {
    statusBarItem.dispose();
  }
}