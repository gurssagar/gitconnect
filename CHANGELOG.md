# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.4] - 2026-03-13

### Added
- **Interactive Setup Wizard** - `gc setup` for first-time users
- **Shell Completion Scripts** - bash, zsh, and fish support with `gc completion`
- **VS Code Extension** - Status bar integration and commands
- **Configuration Migration** - Auto-migrate configs on version updates
- **Encrypted SSH Key Storage** - Passphrase encryption support
- **Key Rotation Automation** - Automatic key rotation with backups
- **Audit Logging** - Comprehensive audit trail for all operations
- **SSH Agent Integration** - Add/remove/list keys in SSH agent
- **macOS Keychain Integration** - Secure passphrase storage on macOS
- **Linux Secret Service Integration** - Secure passphrase storage via secret-tool
- **Parallel SSH Key Validation** - Validate multiple keys concurrently
- **E2E Test Suite** - 10 end-to-end workflow tests
- **Windows CI Testing** - Added to GitHub Actions matrix

### Changed
- Improved caching for accounts and project configurations
- Enhanced silent mode for hooks (`gc hooks silent <on|off>`)
- Updated to 117 tests passing across 8 test suites

## [1.0.0] - 2026-03-12

### Added
- Initial release of GitConnect
- Multi-GitHub account management with SSH keys
- Per-project account configuration (auto/prompt modes)
- Automatic git identity switching (user.name, user.email)
- SSH key generation, import, and validation
- GitHub connection testing
- Pre-commit and pre-push hooks
- SSH-based commit signing support
- `gc account` - Add, list, remove GitHub accounts
- `gc project` - Configure per-project settings
- `gc commit` - Commit with account selection
- `gc push` - Push with account verification
- `gc hooks` - Install/uninstall git hooks
- `gc use` - Quick account switching
- `gc status` - Show GitConnect status

### Security
- SSH keys stored with 0700 permissions
- Config files use 0600 permissions
- No credentials stored in git history
- Local git identity only (not global)

### Dependencies
- chalk ^5.3.0
- commander ^11.1.0
- inquirer ^9.2.12
- nanoid ^5.1.6
- node-ssh ^13.1.0
- ora ^7.0.1
- simple-git ^3.20.0

### Development
- TypeScript ^5.9.3
- ESLint 9.x with flat config
- @typescript-eslint v8
- Jest for testing (117 tests)
- CI/CD with GitHub Actions
- NPM and JSR publishing workflows