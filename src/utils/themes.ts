/**
 * Custom Themes Support
 * Customize GitConnect appearance
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';

export interface Theme {
  name: string;
  colors: ThemeColors;
  styles: ThemeStyles;
}

export interface ThemeColors {
  primary: string;
  secondary: string;
  success: string;
  warning: string;
  error: string;
  info: string;
  text: string;
  textMuted: string;
  background: string;
  border: string;
}

export interface ThemeStyles {
  borderRadius: string;
  padding: string;
  fontFamily: string;
}

export const themeManager = {
  themesPath: path.join(os.homedir(), '.gitconnect', 'themes'),
  themes: new Map<string, Theme>(),
  activeTheme: 'default',

  /**
   * Get default theme
   */
  getDefaultTheme(): Theme {
    return {
      name: 'default',
      colors: {
        primary: '#3498db',
        secondary: '#2ecc71',
        success: '#2ecc71',
        warning: '#f39c12',
        error: '#e74c3c',
        info: '#3498db',
        text: '#ffffff',
        textMuted: '#95a5a6',
        background: '#2c3e50',
        border: '#34495e',
      },
      styles: {
        borderRadius: '4px',
        padding: '12px',
        fontFamily: 'monospace',
      },
    };
  },

  /**
   * Get built-in themes
   */
  getBuiltinThemes(): Theme[] {
    return [
      this.getDefaultTheme(),
      {
        name: 'dark',
        colors: {
          primary: '#bb86fc',
          secondary: '#03dac6',
          success: '#03dac6',
          warning: '#cf6679',
          error: '#cf6679',
          info: '#bb86fc',
          text: '#ffffff',
          textMuted: '#888888',
          background: '#121212',
          border: '#333333',
        },
        styles: {
          borderRadius: '8px',
          padding: '16px',
          fontFamily: 'monospace',
        },
      },
      {
        name: 'light',
        colors: {
          primary: '#0066cc',
          secondary: '#00aa55',
          success: '#00aa55',
          warning: '#ff9900',
          error: '#cc3333',
          info: '#0066cc',
          text: '#333333',
          textMuted: '#666666',
          background: '#ffffff',
          border: '#dddddd',
        },
        styles: {
          borderRadius: '4px',
          padding: '12px',
          fontFamily: 'monospace',
        },
      },
      {
        name: 'solarized',
        colors: {
          primary: '#268bd2',
          secondary: '#2aa198',
          success: '#859900',
          warning: '#b58900',
          error: '#dc322f',
          info: '#268bd2',
          text: '#839496',
          textMuted: '#586e75',
          background: '#002b36',
          border: '#073642',
        },
        styles: {
          borderRadius: '0',
          padding: '10px',
          fontFamily: 'monospace',
        },
      },
      {
        name: 'dracula',
        colors: {
          primary: '#bd93f9',
          secondary: '#50fa7b',
          success: '#50fa7b',
          warning: '#ffb86c',
          error: '#ff5555',
          info: '#8be9fd',
          text: '#f8f8f2',
          textMuted: '#6272a4',
          background: '#282a36',
          border: '#44475a',
        },
        styles: {
          borderRadius: '6px',
          padding: '14px',
          fontFamily: 'monospace',
        },
      },
    ];
  },

  /**
   * Load themes
   */
  async load(): Promise<void> {
    // Load built-in themes
    for (const theme of this.getBuiltinThemes()) {
      this.themes.set(theme.name, theme);
    }

    // Load custom themes
    try {
      const files = await fs.readdir(this.themesPath);
      for (const file of files) {
        if (file.endsWith('.json')) {
          const content = await fs.readFile(path.join(this.themesPath, file), 'utf-8');
          const theme = JSON.parse(content);
          this.themes.set(theme.name, theme);
        }
      }
    } catch {
      // No custom themes
    }
  },

  /**
   * Save theme
   */
  async saveTheme(theme: Theme): Promise<void> {
    await fs.mkdir(this.themesPath, { recursive: true });
    await fs.writeFile(
      path.join(this.themesPath, `${theme.name}.json`),
      JSON.stringify(theme, null, 2)
    );
    this.themes.set(theme.name, theme);
  },

  /**
   * Delete theme
   */
  async deleteTheme(name: string): Promise<boolean> {
    if (name === 'default' || name === 'dark' || name === 'light') {
      return false; // Cannot delete built-in themes
    }

    try {
      await fs.unlink(path.join(this.themesPath, `${name}.json`));
      this.themes.delete(name);
      return true;
    } catch {
      return false;
    }
  },

  /**
   * Get active theme
   */
  getActiveTheme(): Theme {
    return this.themes.get(this.activeTheme) || this.getDefaultTheme();
  },

  /**
   * Set active theme
   */
  setActiveTheme(name: string): boolean {
    if (this.themes.has(name)) {
      this.activeTheme = name;
      return true;
    }
    return false;
  },

  /**
   * List themes
   */
  listThemes(): string[] {
    return Array.from(this.themes.keys());
  },

  /**
   * Export theme
   */
  exportTheme(name: string): string {
    const theme = this.themes.get(name);
    return theme ? JSON.stringify(theme, null, 2) : '';
  },

  /**
   * Import theme
   */
  async importTheme(json: string): Promise<Theme | null> {
    try {
      const theme = JSON.parse(json) as Theme;
      await this.saveTheme(theme);
      return theme;
    } catch {
      return null;
    }
  },
};