/**
 * IDE Integration - JetBrains Plugin Support
 */

export const jetbrainsPlugin = {
  generatePlugin(): Record<string, unknown> {
    return {
      id: 'com.gitconnect.intellij',
      name: 'GitConnect',
      version: '1.0.0',
      vendor: { name: 'GitConnect', url: 'https://github.com/gurssagar/gitconnect' },
      description: 'Multi-account git management for JetBrains IDEs',
    };
  },
};

export const vimPlugin = {
  generatePlugin(): string {
    return `" GitConnect Vim Plugin
let g:gitconnect_enabled = 1
command! GcInit :call gitconnect#init()
command! GcStatus :call gitconnect#status()`;
  },
};

export const emacsPackage = {
  generatePackage(): string {
    return `(require 'gitconnect)
(setq gitconnect-enabled t)`;
  },
};