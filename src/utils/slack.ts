/**
 * Slack Integration
 * Send notifications to Slack channels
 */

export interface SlackConfig {
  webhookUrl: string;
  channel?: string;
  username?: string;
  iconEmoji?: string;
}

export const slackIntegration = {
  config: null as SlackConfig | null,

  configure(config: SlackConfig): void {
    this.config = config;
  },

  async sendMessage(message: string, options?: { channel?: string; blocks?: unknown[] }): Promise<boolean> {
    if (!this.config) return false;

    try {
      const response = await fetch(this.config.webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: message,
          channel: options?.channel || this.config.channel,
          username: this.config.username || 'GitConnect',
          icon_emoji: this.config.iconEmoji || ':git:',
          blocks: options?.blocks,
        }),
      });
      return response.ok;
    } catch {
      return false;
    }
  },

  async sendAccountSwitch(accountName: string): Promise<boolean> {
    return this.sendMessage(`:arrows_counterclockwise: Switched to account: *${accountName}*`);
  },

  async sendCommitNotification(repo: string, message: string, author: string): Promise<boolean> {
    return this.sendMessage(`:git: New commit in *${repo}*\n> ${message}\n_— ${author}_`);
  },

  async sendPushNotification(repo: string, branch: string, commits: number): Promise<boolean> {
    return this.sendMessage(`:rocket: Pushed ${commits} commit(s) to *${repo}/${branch}*`);
  },

  async sendErrorNotification(error: string): Promise<boolean> {
    return this.sendMessage(`:warning: GitConnect Error\n\`\`\`${error}\`\`\``);
  },
};