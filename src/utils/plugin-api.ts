/**
 * Plugin API for Extensions
 * Allow third-party extensions to integrate with GitConnect
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';

export interface Plugin {
  id: string;
  name: string;
  version: string;
  description: string;
  author: string;
  main: string;
  hooks: PluginHooks;
  enabled: boolean;
}

export interface PluginHooks {
  onAccountSwitch?: (accountId: string) => Promise<void>;
  onCommit?: (message: string) => Promise<string>;
  onPush?: (branch: string) => Promise<void>;
  onPull?: (branch: string) => Promise<void>;
  onInit?: (projectPath: string) => Promise<void>;
  onHookInstall?: (hookType: string) => Promise<void>;
  onConfigChange?: (key: string, value: unknown) => Promise<void>;
}

export interface PluginAPI {
  getAccounts: () => Promise<Array<{ id: string; name: string }>>;
  getActiveAccount: () => Promise<string | null>;
  switchAccount: (accountId: string) => Promise<boolean>;
  getConfig: (key: string) => Promise<unknown>;
  setConfig: (key: string, value: unknown) => Promise<void>;
  log: (message: string, level: 'info' | 'warn' | 'error') => void;
  showNotification: (message: string) => void;
}

export const pluginManager = {
  pluginsPath: path.join(os.homedir(), '.gitconnect', 'plugins'),
  plugins: new Map<string, Plugin>(),

  /**
   * Initialize plugin manager
   */
  async init(): Promise<void> {
    await fs.mkdir(this.pluginsPath, { recursive: true });
    await this.loadPlugins();
  },

  /**
   * Load all plugins
   */
  async loadPlugins(): Promise<void> {
    try {
      const files = await fs.readdir(this.pluginsPath);
      for (const file of files) {
        if (file.endsWith('.json')) {
          const content = await fs.readFile(path.join(this.pluginsPath, file), 'utf-8');
          const plugin = JSON.parse(content);
          this.plugins.set(plugin.id, plugin);
        }
      }
    } catch {
      // No plugins yet
    }
  },

  /**
   * Get plugin API
   */
  getAPI(): PluginAPI {
    return {
      getAccounts: async () => [],
      getActiveAccount: async () => null,
      switchAccount: async (_accountId: string) => true,
      getConfig: async (_key: string) => null,
      setConfig: async (_key: string, _value: unknown) => {},
      log: (message: string, level: 'info' | 'warn' | 'error') => {
        console.log(`[${level.toUpperCase()}] ${message}`);
      },
      showNotification: (message: string) => {
        console.log(`NOTIFICATION: ${message}`);
      },
    };
  },

  /**
   * Register plugin
   */
  async registerPlugin(plugin: Plugin): Promise<boolean> {
    if (this.plugins.has(plugin.id)) {
      return false;
    }

    this.plugins.set(plugin.id, plugin);
    await fs.writeFile(
      path.join(this.pluginsPath, `${plugin.id}.json`),
      JSON.stringify(plugin, null, 2)
    );

    return true;
  },

  /**
   * Unregister plugin
   */
  async unregisterPlugin(id: string): Promise<boolean> {
    if (!this.plugins.has(id)) {
      return false;
    }

    this.plugins.delete(id);
    try {
      await fs.unlink(path.join(this.pluginsPath, `${id}.json`));
    } catch {
      // File might not exist
    }

    return true;
  },

  /**
   * Enable plugin
   */
  enablePlugin(id: string): boolean {
    const plugin = this.plugins.get(id);
    if (plugin) {
      plugin.enabled = true;
      return true;
    }
    return false;
  },

  /**
   * Disable plugin
   */
  disablePlugin(id: string): boolean {
    const plugin = this.plugins.get(id);
    if (plugin) {
      plugin.enabled = false;
      return true;
    }
    return false;
  },

  /**
   * Execute hook
   */
  async executeHook<K extends keyof PluginHooks>(
    hookName: K,
    ...args: Parameters<NonNullable<PluginHooks[K]>>
  ): Promise<void> {
    for (const plugin of this.plugins.values()) {
      if (plugin.enabled && plugin.hooks[hookName]) {
        try {
          // @ts-expect-error - Dynamic hook execution
          await plugin.hooks[hookName](...args);
        } catch (error) {
          console.error(`Plugin ${plugin.name} hook ${hookName} failed:`, error);
        }
      }
    }
  },

  /**
   * List plugins
   */
  listPlugins(): Plugin[] {
    return Array.from(this.plugins.values());
  },

  /**
   * Get plugin
   */
  getPlugin(id: string): Plugin | undefined {
    return this.plugins.get(id);
  },

  /**
   * Create plugin template
   */
  createPluginTemplate(name: string): Plugin {
    return {
      id: name.toLowerCase().replace(/[^a-z0-9]/g, '-'),
      name,
      version: '1.0.0',
      description: 'A GitConnect plugin',
      author: 'Anonymous',
      main: 'index.js',
      hooks: {},
      enabled: true,
    };
  },

  /**
   * Validate plugin
   */
  validatePlugin(plugin: unknown): plugin is Plugin {
    if (typeof plugin !== 'object' || plugin === null) return false;
    const p = plugin as Record<string, unknown>;
    return (
      typeof p.id === 'string' &&
      typeof p.name === 'string' &&
      typeof p.version === 'string'
    );
  },
};