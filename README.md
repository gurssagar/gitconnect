# GitConnect 🔄

> Multi-GitHub Account Manager - Auto & Explicit Mode

Manage multiple GitHub accounts seamlessly with per-project account selection, automatic git identity switching, and commit signing.

## Features

- 🔐 **Multiple Accounts** - Manage multiple GitHub accounts with separate SSH keys
- 🎯 **Per-Project Config** - Different accounts for different projects
- 🤖 **Auto Mode** - Automatically use configured account
- 💬 **Prompt Mode** - Ask before each commit/push
- 🔏 **SSH Signing** - Sign commits with SSH keys
- 🪝 **Git Hooks** - Pre-commit and pre-push hooks
- ⚡ **Quick Switch** - Easy account switching with `gc use`

## Installation

```bash
npm install -g gitconnect
# or
npx gitconnect init
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
gc push                     # Push with account verification
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

## Requirements

- Node.js >= 16.0.0
- Git
- SSH (for key generation)

## License

MIT

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md)

## Support

- Issues: [GitHub Issues](https://github.com/yourusername/gitconnect/issues)
- Discussions: [GitHub Discussions](https://github.com/yourusername/gitconnect/discussions)