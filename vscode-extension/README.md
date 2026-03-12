# GitConnect VS Code Extension

Manage multiple GitHub accounts directly from VS Code.

## Features

- **Status Bar Integration**: Shows current GitConnect account in the status bar
- **Quick Account Switching**: Switch between accounts with a single click
- **Project Mode Control**: Set project mode (auto/prompt/off) from command palette
- **Status Overview**: View GitConnect status in output panel

## Commands

| Command | Description |
|---------|-------------|
| `GitConnect: Switch Account` | Switch to a different GitHub account |
| `GitConnect: Show Status` | Display current GitConnect status |
| `GitConnect: Set Project Mode` | Set project mode (auto/prompt/off) |

## Requirements

- [GitConnect CLI](https://github.com/gurssagar/gitconnect) must be installed
- At least one account configured via `gitconnect account add`

## Installation

### From VSIX

1. Download the `.vsix` file
2. Open VS Code
3. Go to Extensions view (Ctrl+Shift+X)
4. Click "..." menu → "Install from VSIX..."

### From Source

```bash
cd vscode-extension
npm install
npm run compile
# Package with vsce: npm install -g @vscode/vsce
vsce package
```

## Configuration

| Setting | Default | Description |
|---------|---------|-------------|
| `gitconnect.showStatusBar` | `true` | Show GitConnect status bar item |

## Usage

1. Open a Git repository in VS Code
2. The status bar will show "No account" if not configured
3. Click the status bar item or run "GitConnect: Switch Account"
4. Select your desired account from the list

## License

MIT