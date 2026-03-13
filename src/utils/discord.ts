/**
 * Discord Webhook Support
 * Send notifications to Discord channels
 */

export interface DiscordConfig {
  webhookUrl: string;
  username?: string;
  avatarUrl?: string;
}

export interface DiscordEmbed {
  title?: string;
  description?: string;
  color?: number;
  fields?: Array<{ name: string; value: string; inline?: boolean }>;
  footer?: { text: string; icon_url?: string };
  timestamp?: string;
}

export const discordIntegration = {
  config: null as DiscordConfig | null,

  configure(config: DiscordConfig): void {
    this.config = config;
  },

  async sendMessage(message: string, embeds?: DiscordEmbed[]): Promise<boolean> {
    if (!this.config) return false;

    try {
      const response = await fetch(this.config.webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: message,
          username: this.config.username || 'GitConnect',
          avatar_url: this.config.avatarUrl,
          embeds,
        }),
      });
      return response.ok;
    } catch {
      return false;
    }
  },

  async sendAccountSwitch(accountName: string): Promise<boolean> {
    return this.sendMessage('', [{
      title: 'Account Switched',
      description: `Now using account: **${accountName}**`,
      color: 0x3498db,
      timestamp: new Date().toISOString(),
    }]);
  },

  async sendCommitNotification(repo: string, message: string, author: string): Promise<boolean> {
    return this.sendMessage('', [{
      title: 'New Commit',
      description: message,
      color: 0x2ecc71,
      fields: [
        { name: 'Repository', value: repo, inline: true },
        { name: 'Author', value: author, inline: true },
      ],
      timestamp: new Date().toISOString(),
    }]);
  },

  async sendPushNotification(repo: string, branch: string, commits: number): Promise<boolean> {
    return this.sendMessage('', [{
      title: 'Push Complete',
      description: `Pushed ${commits} commit(s)`,
      color: 0x9b59b6,
      fields: [
        { name: 'Repository', value: repo, inline: true },
        { name: 'Branch', value: branch, inline: true },
      ],
      timestamp: new Date().toISOString(),
    }]);
  },

  async sendErrorNotification(error: string): Promise<boolean> {
    return this.sendMessage('', [{
      title: 'Error',
      description: `\`\`\`${error}\`\`\``,
      color: 0xe74c3c,
      timestamp: new Date().toISOString(),
    }]);
  },
};