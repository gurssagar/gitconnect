/**
 * ML-based Account Suggestions
 * Suggest appropriate account based on repository patterns
 */

export interface AccountPattern {
  accountId: string;
  patterns: string[];
  frequency: number;
  lastUsed: string;
}

export interface SuggestionContext {
  repositoryUrl?: string;
  repositoryName?: string;
  branchName?: string;
  fileTypes?: string[];
  commitHistory?: string[];
}

export const mlSuggestions = {
  patterns: new Map<string, AccountPattern>(),

  /**
   * Learn from usage
   */
  learn(accountId: string, context: SuggestionContext): void {
    const patterns: string[] = [];

    if (context.repositoryUrl) {
      patterns.push(`repo:${context.repositoryUrl}`);
    }
    if (context.repositoryName) {
      patterns.push(`name:${context.repositoryName}`);
    }
    if (context.branchName) {
      patterns.push(`branch:${context.branchName}`);
    }

    const existing = this.patterns.get(accountId);
    if (existing) {
      existing.frequency++;
      existing.lastUsed = new Date().toISOString();
      existing.patterns = [...new Set([...existing.patterns, ...patterns])];
    } else {
      this.patterns.set(accountId, {
        accountId,
        patterns,
        frequency: 1,
        lastUsed: new Date().toISOString(),
      });
    }
  },

  /**
   * Suggest account for context
   */
  suggest(context: SuggestionContext): Array<{ accountId: string; confidence: number }> {
    const scores = new Map<string, number>();

    for (const [accountId, pattern] of this.patterns) {
      let score = 0;

      if (context.repositoryUrl && pattern.patterns.includes(`repo:${context.repositoryUrl}`)) {
        score += 0.5;
      }
      if (context.repositoryName && pattern.patterns.includes(`name:${context.repositoryName}`)) {
        score += 0.3;
      }
      if (context.branchName && pattern.patterns.includes(`branch:${context.branchName}`)) {
        score += 0.2;
      }

      // Factor in frequency
      score *= Math.min(1, pattern.frequency / 10);

      // Factor in recency
      const daysSinceLastUse =
        (Date.now() - new Date(pattern.lastUsed).getTime()) / 86400000;
      score *= Math.max(0.1, 1 - daysSinceLastUse / 30);

      if (score > 0) {
        scores.set(accountId, score);
      }
    }

    return Array.from(scores.entries())
      .map(([accountId, confidence]) => ({ accountId, confidence }))
      .sort((a, b) => b.confidence - a.confidence);
  },

  /**
   * Get patterns for account
   */
  getPatterns(accountId: string): AccountPattern | undefined {
    return this.patterns.get(accountId);
  },

  /**
   * Clear learning data
   */
  clearLearning(): void {
    this.patterns.clear();
  },

  /**
   * Export learning data
   */
  exportData(): AccountPattern[] {
    return Array.from(this.patterns.values());
  },

  /**
   * Import learning data
   */
  importData(data: AccountPattern[]): void {
    for (const pattern of data) {
      this.patterns.set(pattern.accountId, pattern);
    }
  },
};