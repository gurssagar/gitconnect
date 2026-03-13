/**
 * Keyboard Shortcuts Configuration
 * Customize keyboard shortcuts for GitConnect
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';

export interface KeyboardShortcut {
  id: string;
  key: string;
  modifiers: string[];
  action: string;
  description: string;
}

export interface ShortcutProfile {
  name: string;
  shortcuts: KeyboardShortcut[];
}

export const keyboardShortcuts = {
  configPath: path.join(os.homedir(), '.gitconnect', 'shortcuts.json'),
  profiles: new Map<string, ShortcutProfile>(),
  activeProfile: 'default',

  /**
   * Get default shortcuts
   */
  getDefaultShortcuts(): KeyboardShortcut[] {
    return [
      { id: 'switch-account', key: 's', modifiers: ['ctrl'], action: 'account:switch', description: 'Switch account' },
      { id: 'show-status', key: 'i', modifiers: ['ctrl'], action: 'status:show', description: 'Show status' },
      { id: 'quick-commit', key: 'c', modifiers: ['ctrl'], action: 'git:commit', description: 'Quick commit' },
      { id: 'quick-push', key: 'p', modifiers: ['ctrl'], action: 'git:push', description: 'Quick push' },
      { id: 'quick-pull', key: 'l', modifiers: ['ctrl'], action: 'git:pull', description: 'Quick pull' },
      { id: 'show-accounts', key: 'a', modifiers: ['ctrl'], action: 'account:list', description: 'Show accounts' },
      { id: 'add-account', key: 'n', modifiers: ['ctrl'], action: 'account:add', description: 'Add account' },
      { id: 'show-help', key: 'h', modifiers: ['ctrl'], action: 'help:show', description: 'Show help' },
      { id: 'init-project', key: 'i', modifiers: ['ctrl', 'shift'], action: 'project:init', description: 'Initialize project' },
      { id: 'hooks-toggle', key: 'h', modifiers: ['ctrl', 'shift'], action: 'hooks:toggle', description: 'Toggle hooks' },
    ];
  },

  /**
   * Load shortcuts
   */
  async load(): Promise<void> {
    try {
      const content = await fs.readFile(this.configPath, 'utf-8');
      const data = JSON.parse(content);
      for (const profile of data.profiles) {
        this.profiles.set(profile.name, profile);
      }
      this.activeProfile = data.activeProfile || 'default';
    } catch {
      // Load defaults
      this.profiles.set('default', {
        name: 'default',
        shortcuts: this.getDefaultShortcuts(),
      });
    }
  },

  /**
   * Save shortcuts
   */
  async save(): Promise<void> {
    const data = {
      profiles: Array.from(this.profiles.values()),
      activeProfile: this.activeProfile,
    };
    await fs.mkdir(path.dirname(this.configPath), { recursive: true });
    await fs.writeFile(this.configPath, JSON.stringify(data, null, 2));
  },

  /**
   * Add shortcut
   */
  addShortcut(shortcut: KeyboardShortcut): void {
    const profile = this.profiles.get(this.activeProfile);
    if (profile) {
      profile.shortcuts.push(shortcut);
    }
  },

  /**
   * Remove shortcut
   */
  removeShortcut(id: string): boolean {
    const profile = this.profiles.get(this.activeProfile);
    if (profile) {
      const index = profile.shortcuts.findIndex(s => s.id === id);
      if (index !== -1) {
        profile.shortcuts.splice(index, 1);
        return true;
      }
    }
    return false;
  },

  /**
   * Update shortcut
   */
  updateShortcut(id: string, updates: Partial<KeyboardShortcut>): boolean {
    const profile = this.profiles.get(this.activeProfile);
    if (profile) {
      const shortcut = profile.shortcuts.find(s => s.id === id);
      if (shortcut) {
        Object.assign(shortcut, updates);
        return true;
      }
    }
    return false;
  },

  /**
   * Get shortcut by key
   */
  getShortcutByKey(key: string, modifiers: string[]): KeyboardShortcut | undefined {
    const profile = this.profiles.get(this.activeProfile);
    if (profile) {
      return profile.shortcuts.find(s =>
        s.key === key &&
        s.modifiers.length === modifiers.length &&
        s.modifiers.every(m => modifiers.includes(m))
      );
    }
    return undefined;
  },

  /**
   * Create profile
   */
  createProfile(name: string): ShortcutProfile {
    const profile: ShortcutProfile = {
      name,
      shortcuts: [...this.getDefaultShortcuts()],
    };
    this.profiles.set(name, profile);
    return profile;
  },

  /**
   * Delete profile
   */
  deleteProfile(name: string): boolean {
    if (name === 'default') return false;
    return this.profiles.delete(name);
  },

  /**
   * Set active profile
   */
  setActiveProfile(name: string): boolean {
    if (this.profiles.has(name)) {
      this.activeProfile = name;
      return true;
    }
    return false;
  },

  /**
   * Export shortcuts
   */
  exportShortcuts(): string {
    return JSON.stringify(Array.from(this.profiles.values()), null, 2);
  },

  /**
   * Import shortcuts
   */
  async importShortcuts(json: string): Promise<number> {
    const profiles = JSON.parse(json);
    let imported = 0;
    for (const profile of profiles) {
      this.profiles.set(profile.name, profile);
      imported++;
    }
    await this.save();
    return imported;
  },
};