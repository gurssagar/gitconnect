/**
 * Desktop Notifications
 * Send native desktop notifications
 */

export interface DesktopNotification {
  title: string;
  body: string;
  icon?: string;
  sound?: boolean;
}

export const desktopNotifications = {
  enabled: true,

  enable(): void {
    this.enabled = true;
  },

  disable(): void {
    this.enabled = false;
  },

  async send(notification: DesktopNotification): Promise<boolean> {
    if (!this.enabled) return false;

    try {
      // Would use node-notifier in real implementation
      console.log(`[DESKTOP] ${notification.title}: ${notification.body}`);
      return true;
    } catch {
      return false;
    }
  },

  async notifyAccountSwitch(accountName: string): Promise<boolean> {
    return this.send({
      title: 'GitConnect',
      body: `Switched to account: ${accountName}`,
      sound: true,
    });
  },

  async notifyCommit(repo: string, message: string): Promise<boolean> {
    return this.send({
      title: `Commit: ${repo}`,
      body: message.slice(0, 100),
    });
  },

  async notifyPush(repo: string, branch: string): Promise<boolean> {
    return this.send({
      title: 'GitConnect',
      body: `Pushed to ${repo}/${branch}`,
      sound: true,
    });
  },

  async notifyError(error: string): Promise<boolean> {
    return this.send({
      title: 'GitConnect Error',
      body: error.slice(0, 100),
      sound: true,
    });
  },

  async notifySuccess(message: string): Promise<boolean> {
    return this.send({
      title: 'GitConnect',
      body: message,
      sound: false,
    });
  },
};