export interface Account {
  id: string;
  username: string;
  email: string;
  sshKey: string;
  gpgKey?: string;
  commitTemplate?: string;
  branchPrefix?: string;
  createdAt: string;
}

export interface ProjectConfig {
  account: string;
  mode: 'auto' | 'prompt' | 'off';
  addedAt: string;
}

export interface GitConnectConfig {
  defaultMode: 'auto' | 'prompt' | 'off';
  silent?: boolean;
  version?: string;
}

export interface PushOptions {
  account?: string;
  auto?: boolean;
  remote?: string;
  branch?: string;
}

export interface GitInfo {
  isGitRepo: boolean;
  remoteUrl?: string;
  currentBranch?: string;
  projectPath: string;
}

export interface PushResult {
  success: boolean;
  output: string;
  error?: string;
}
