import { PolicyEvaluationContext } from '../models/Policy';

export class RateLimiter {
  private requestCounts: Map<string, { count: number; resetTime: number }> = new Map();
  private defaultLimit = 100; // requests
  private defaultWindow = 60000; // 1 minute in milliseconds

  /**
   * Check if a request is allowed based on rate limiting
   * @param context - Policy evaluation context
   * @param limit - Maximum requests allowed
   * @param windowMs - Time window in milliseconds
   * @returns True if allowed, false if rate limited
   */
  isAllowed(context: PolicyEvaluationContext, limit: number = this.defaultLimit, windowMs: number = this.defaultWindow): boolean {
    const key = `${context.sessionId}:${context.ipAddress}`;
    const now = Date.now();
    
    const record = this.requestCounts.get(key);
    
    // If no record exists or the window has expired, create a new record
    if (!record || now >= record.resetTime) {
      this.requestCounts.set(key, {
        count: 1,
        resetTime: now + windowMs
      });
      return true;
    }
    
    // If the limit has been reached, deny the request
    if (record.count >= limit) {
      return false;
    }
    
    // Increment the count and allow the request
    this.requestCounts.set(key, {
      count: record.count + 1,
      resetTime: record.resetTime
    });
    
    return true;
  }

  /**
   * Get the current rate limit status for a client
   * @param context - Policy evaluation context
   * @returns Rate limit status
   */
  getRateLimitStatus(context: PolicyEvaluationContext): { 
    remaining: number; 
    resetTime: number; 
    limit: number 
  } {
    const key = `${context.sessionId}:${context.ipAddress}`;
    const now = Date.now();
    
    const record = this.requestCounts.get(key);
    
    if (!record || now >= record.resetTime) {
      return {
        remaining: this.defaultLimit,
        resetTime: now + this.defaultWindow,
        limit: this.defaultLimit
      };
    }
    
    return {
      remaining: this.defaultLimit - record.count,
      resetTime: record.resetTime,
      limit: this.defaultLimit
    };
  }

  /**
   * Reset the rate limit for a client
   * @param context - Policy evaluation context
   */
  reset(context: PolicyEvaluationContext): void {
    const key = `${context.sessionId}:${context.ipAddress}`;
    this.requestCounts.delete(key);
  }

  /**
   * Clean up expired records periodically
   */
  cleanup(): void {
    const now = Date.now();
    for (const [key, record] of this.requestCounts.entries()) {
      if (now >= record.resetTime) {
        this.requestCounts.delete(key);
      }
    }
  }
}