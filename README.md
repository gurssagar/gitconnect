# GitConnect 🔄

> Multi-GitHub Account Manager - Auto & Explicit Mode

Manage multiple GitHub accounts seamlessly with per-project account selection, automatic git identity switching, and commit signing.

## Features

- 🔐 **Multiple Accounts** - Manage multiple GitHub accounts with separate SSH keys
- 🎯 **Per-Project Config** - Different accounts for different projects
- 🤖 **Auto Mode** - Automatically use configured account
- 💬 **Prompt Mode** - Ask before each commit/push
- 🔏 **Commit Signing** - SSH and GPG commit signing support
- 🪝 **Git Hooks** - Pre-commit and pre-push hooks
- ⚡ **Quick Switch** - Easy account switching with `gc use`
- 🌐 **Multi-Platform** - GitHub, GitLab, Bitbucket, and GitHub Enterprise support
- 🔑 **Hardware Keys** - YubiKey integration for SSH authentication
- 📝 **Branch Naming** - Automatic branch name conventions
- 📋 **Templates** - Commit templates per account
- 🌍 **REST API** - Programmatic access via HTTP API
- 👥 **Team Sharing** - Share account configurations across teams

## Installation

```bash
npm install -g @technobromo/gitconnect
# or
npx @technobromo/gitconnect init
```

## Quick Start

```bash
# Initialize GitConnect
gc init

# Add your first account
gc account add

# Set account for current project
gc project set

# Commit with account prompt
gc commit -m "Your message"

# Or use git directly (with hooks installed)
git commit -m "Your message"
```

## Commands

### Account Management
```bash
gc account add              # Add new GitHub account
gc account list             # List all accounts
gc account remove <name>    # Remove an account
```

### Project Configuration
```bash
gc project set              # Set account for current project
gc project mode <mode>      # Set mode: auto/prompt/off
gc project info             # Show project info
```

### Commit & Push
```bash
gc commit -m "message"      # Commit with account selection
gc commit --amend           # Amend last commit
gc commit --sign            # Sign commit with SSH
gc commit --gpg-sign        # Sign commit with GPG
gc push                     # Push with account verification
```

### Branch Management
```bash
gc branch feature "add login"           # Create feature branch
gc branch bugfix "fix crash"            # Create bugfix branch
gc branch hotfix "urgent fix"           # Create hotfix branch
gc branch feature "add login" -t PROJ-123  # With ticket ID
```

### Template Management
```bash
gc template list            # List commit templates
gc template add <name>      # Add a new template
gc template get <name>      # Show template content
gc template remove <name>   # Remove a template
```

### Hooks
```bash
gc hooks install            # Install git hooks
gc hooks uninstall          # Remove git hooks
gc hooks status             # Show hook status
gc hooks mode <mode>        # Set hook mode
```

### Utilities
```bash
gc use <account>            # Quick switch account
gc status                   # Show GitConnect status
gc init                     # Initialize configuration
```

## Hook Modes

| Mode | Behavior |
|------|----------|
| `prompt` | Ask for account before each commit |
| `auto` | Use configured account automatically |
| `off` | Disable GitConnect hooks |

## Configuration

GitConnect stores configuration in `~/.gitconnect/`:

- `accounts.json` - Your GitHub accounts
- `projects.json` - Per-project settings
- `settings.json` - Global settings
- `ssh/` - SSH keys (mode 0700)

## How It Works

1. **Account Setup**: Each account gets a unique SSH key pair
2. **Project Binding**: Projects are bound to specific accounts
3. **Identity Switching**: Git identity (name/email) is set per-commit
4. **SSH Key Selection**: The correct SSH key is used automatically

## Security

- SSH keys stored with `0700` permissions
- Config files use `0600` permissions
- No credentials stored in git history
- Local git identity only (not global)
- Encrypted SSH key storage with passphrase support
- YubiKey hardware security key integration
- Biometric authentication (macOS Touch ID, Linux fprintd)
- Audit logging for all operations

## Requirements

- Node.js >= 16.0.0
- Git
- SSH (for key generation)

## Environment Variables

| Variable | Description |
|----------|-------------|
| `GITCONNECT_DEBUG` | Set to `true` to enable debug logging |
| `HOME` | User home directory (used for SSH key paths) |

## REST API

GitConnect includes a REST API server for programmatic access:

```bash
# Start the API server (default: http://localhost:3777)
gc api start

# Available endpoints:
GET /api/accounts      # List all accounts
GET /api/accounts/:id  # Get account by ID
GET /api/projects      # List all projects
GET /api/status        # Get GitConnect status
```

## SDK

Use GitConnect programmatically in your Node.js applications:

```typescript
import { GitConnectSDK } from '@technobromo/gitconnect';

const sdk = new GitConnectSDK();

// Check if initialized
const ready = await sdk.isInitialized();

// Get accounts
const accounts = await sdk.getAccounts();

// Create a commit
await sdk.commit({
  message: 'feat: add new feature',
  sign: true
});

// Create a branch
await sdk.createBranch({
  type: 'feature',
  description: 'new feature',
  username: 'developer'
});
```

## Multi-Platform Support

GitConnect supports multiple git platforms:

| Platform | SSH Host | API |
|----------|----------|-----|
| GitHub | github.com | api.github.com |
| GitLab | gitlab.com | gitlab.com/api/v4 |
| Bitbucket | bitbucket.org | api.bitbucket.org |
| GitHub Enterprise | Custom | Custom |

## Team Collaboration

Share account configurations with your team:

```bash
# Export team configuration
gc team export team-config.json

# Import team configuration
gc team import team-config.json
```

## License

MIT

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md)

## Support

- Issues: [GitHub Issues](https://github.com/gurssagar/gitconnect/issues)
- Discussions: [GitHub Discussions](https://github.com/gurssagar/gitconnect/discussions)