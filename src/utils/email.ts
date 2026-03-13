/**
 * Email Notifications
 * Send email notifications for GitConnect events
 */

export interface EmailConfig {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  pass: string;
  from: string;
  to: string[];
}

export interface EmailMessage {
  subject: string;
  text: string;
  html?: string;
}

export const emailNotifications = {
  config: null as EmailConfig | null,

  configure(config: EmailConfig): void {
    this.config = config;
  },

  async send(message: EmailMessage): Promise<boolean> {
    if (!this.config) return false;

    // Would use nodemailer in real implementation
    console.log(`[EMAIL] To: ${this.config.to.join(', ')}`);
    console.log(`[EMAIL] Subject: ${message.subject}`);
    console.log(`[EMAIL] Body: ${message.text}`);
    return true;
  },

  async sendAccountSwitch(accountName: string): Promise<boolean> {
    return this.send({
      subject: 'GitConnect: Account Switched',
      text: `You have switched to account: ${accountName}`,
      html: `<p>You have switched to account: <strong>${accountName}</strong></p>`,
    });
  },

  async sendCommitNotification(repo: string, commitMessage: string, author: string): Promise<boolean> {
    return this.send({
      subject: `GitConnect: New commit in ${repo}`,
      text: `New commit by ${author}:\n${commitMessage}`,
      html: `<p>New commit by <strong>${author}</strong>:</p><pre>${commitMessage}</pre>`,
    });
  },

  async sendPushNotification(repo: string, branch: string, commits: number): Promise<boolean> {
    return this.send({
      subject: `GitConnect: Pushed ${commits} commits to ${repo}`,
      text: `Pushed ${commits} commit(s) to ${repo}/${branch}`,
      html: `<p>Pushed <strong>${commits}</strong> commit(s) to <code>${repo}/${branch}</code></p>`,
    });
  },

  async sendErrorNotification(error: string): Promise<boolean> {
    return this.send({
      subject: 'GitConnect: Error Occurred',
      text: `An error occurred:\n${error}`,
      html: `<p>An error occurred:</p><pre>${error}</pre>`,
    });
  },
};