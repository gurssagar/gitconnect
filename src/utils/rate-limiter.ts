/**
 * API Rate Limiting
 */
export const rateLimiter = {
  limits: new Map<string, { count: number; resetAt: number }>(),
  check(key: string, limit: number, windowMs: number): boolean {
    const now = Date.now();
    const entry = this.limits.get(key);
    if (!entry || now > entry.resetAt) { this.limits.set(key, { count: 1, resetAt: now + windowMs }); return true; }
    if (entry.count >= limit) return false;
    entry.count++; return true;
  },
};