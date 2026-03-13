/**
 * Team Activity Dashboard
 * Track and display team activity across accounts
 */

export interface ActivityEvent {
  id: string;
  userId: string;
  account: string;
  action: string;
  repository: string;
  timestamp: string;
  details: Record<string, unknown>;
}

export interface TeamMemberStats {
  userId: string;
  name: string;
  commits: number;
  pushes: number;
  accountSwitches: number;
  lastActive: string;
}

export const teamDashboard = {
  activities: [] as ActivityEvent[],
  stats: new Map<string, TeamMemberStats>(),

  /**
   * Log activity
   */
  logActivity(
    userId: string,
    account: string,
    action: string,
    repository: string,
    details: Record<string, unknown> = {}
  ): ActivityEvent {
    const event: ActivityEvent = {
      id: `activity-${Date.now()}`,
      userId,
      account,
      action,
      repository,
      timestamp: new Date().toISOString(),
      details,
    };
    this.activities.push(event);
    this.updateStats(userId, action);
    return event;
  },

  /**
   * Update member stats
   */
  updateStats(userId: string, action: string): void {
    const stats = this.stats.get(userId) || {
      userId,
      name: userId,
      commits: 0,
      pushes: 0,
      accountSwitches: 0,
      lastActive: new Date().toISOString(),
    };

    if (action === 'commit') stats.commits++;
    else if (action === 'push') stats.pushes++;
    else if (action === 'account-switch') stats.accountSwitches++;

    stats.lastActive = new Date().toISOString();
    this.stats.set(userId, stats);
  },

  /**
   * Get recent activities
   */
  getRecentActivities(limit: number = 50): ActivityEvent[] {
    return this.activities.slice(-limit);
  },

  /**
   * Get activities by user
   */
  getActivitiesByUser(userId: string): ActivityEvent[] {
    return this.activities.filter(a => a.userId === userId);
  },

  /**
   * Get activities by account
   */
  getActivitiesByAccount(account: string): ActivityEvent[] {
    return this.activities.filter(a => a.account === account);
  },

  /**
   * Get team stats
   */
  getTeamStats(): TeamMemberStats[] {
    return Array.from(this.stats.values());
  },

  /**
   * Get activity summary
   */
  getActivitySummary(timeRange: 'day' | 'week' | 'month' = 'week'): {
    totalCommits: number;
    totalPushes: number;
    activeUsers: number;
    topAccounts: Array<{ account: string; count: number }>;
  } {
    const now = Date.now();
    const ranges = { day: 86400000, week: 604800000, month: 2592000000 };
    const cutoff = now - ranges[timeRange];

    const recentActivities = this.activities.filter(
      a => new Date(a.timestamp).getTime() > cutoff
    );

    const accountCounts = new Map<string, number>();
    for (const activity of recentActivities) {
      accountCounts.set(activity.account, (accountCounts.get(activity.account) || 0) + 1);
    }

    const topAccounts = Array.from(accountCounts.entries())
      .map(([account, count]) => ({ account, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return {
      totalCommits: recentActivities.filter(a => a.action === 'commit').length,
      totalPushes: recentActivities.filter(a => a.action === 'push').length,
      activeUsers: new Set(recentActivities.map(a => a.userId)).size,
      topAccounts,
    };
  },

  /**
   * Clear old activities
   */
  clearOldActivities(olderThanDays: number = 30): number {
    const cutoff = Date.now() - olderThanDays * 86400000;
    const initialLength = this.activities.length;
    this.activities = this.activities.filter(
      a => new Date(a.timestamp).getTime() > cutoff
    );
    return initialLength - this.activities.length;
  },
};