# GitConnect Commit Hook Feature

## Overview
Add a pre-commit hook that prompts users to select which GitHub account to use for each commit, automatically setting the git author.

## Implementation Plan

### Phase 1: Core Functionality

#### 1.1 Add `commit` command
- **File:** `src/commands/commit.ts`
- **Purpose:** New command `gitconnect commit` or `gc commit`
- **Behavior:**
  1. Check if initialized
  2. Check if in git repo
  3. Prompt for account selection
  4. Set local git identity (user.name, user.email)
  5. Run `git commit` with provided message
  6. Optionally sign commit with SSH key

#### 1.2 Add `install-commit-hook` command
- **File:** `src/commands/hooks.ts`
- **Purpose:** Install/uninstall pre-commit hook
- **Behavior:**
  - Creates `.git/hooks/pre-commit` script
  - Script calls `gitconnect hook-pre-commit`
  - Handles project mode (auto vs prompt)

#### 1.3 Add hook handler
- **File:** `src/commands/hook.ts`
- **Purpose:** Internal command called by git hooks
- **Behavior:**
  - Detect current project
  - Check project config mode
  - If auto: use configured account silently
  - If prompt: ask user to select account
  - Set git identity before commit proceeds

### Phase 2: Enhanced Features

#### 2.1 Commit signing
- Use SSH key to sign commits
- Add `--sign` flag to commit command
- Configure git to use SSH signing

#### 2.2 Smart account detection
- Auto-detect account from remote URL
- Suggest matching account first
- Remember last used account per project

#### 2.3 Hook modes
| Mode | Behavior |
|------|----------|
| `off` | Hook disabled, normal git behavior |
| `prompt` | Always ask before commit |
| `auto` | Use configured account silently |
| `smart` | Detect from remote, fallback to prompt |

### Phase 3: UX Improvements

#### 3.1 Quick switch
- `gc use <account>` - Switch account for current project
- `gc whoami` - Show current account
- `gc last` - Show last 5 commits with accounts

#### 3.2 Integration
- `gc install-hooks --all` - Install all hooks (push, commit)
- `gc hooks status` - Show hook status
- `gc config` - View/edit configuration

## File Structure

```
src/
├── commands/
│   ├── commit.ts      # gc commit command
│   ├── hooks.ts       # install/uninstall hooks
│   └── hook.ts        # hook handler (internal)
├── core/
│   └── hooks.ts       # hook installation logic
└── utils/
    └── git-identity.ts # git identity management
```

## Command Reference

```bash
# Commit with account prompt
gc commit -m "message"
gc commit --amend

# Install/uninstall hooks
gc install-commit-hook
gc uninstall-commit-hook
gc install-hooks --all

# Quick account operations
gc use <account>
gc whoami

# Hook modes
gc hook-mode prompt
gc hook-mode auto
gc hook-mode off
```

## Hook Script Template

```bash
#!/bin/sh
# GitConnect pre-commit hook
if command -v gitconnect >/dev/null 2>&1; then
  gitconnect hook-pre-commit
  if [ $? -ne 0 ]; then
    echo "GitConnect: Commit cancelled"
    exit 1
  fi
fi
```

## Implementation Order

1. ✅ Create `commit.ts` command
2. ✅ Create `hooks.ts` for hook management
3. ✅ Create `hook.ts` internal handler
4. ✅ Update CLI to register new commands
5. ✅ Add tests
6. ✅ Update documentation

## Security Considerations

- Hook should not expose account credentials
- SSH key paths should be validated
- Account selection should timeout (optional)
- Support `--no-verify` bypass (git default behavior)