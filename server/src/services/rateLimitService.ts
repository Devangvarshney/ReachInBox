import { redisClient } from '../config/redis';
import dotenv from 'dotenv';
dotenv.config();

// Configurable limits from environment
const GLOBAL_HOURLY_LIMIT = parseInt(process.env.MAX_EMAILS_PER_HOUR || '200', 10);
const PER_SENDER_HOURLY_LIMIT = parseInt(process.env.MAX_EMAILS_PER_HOUR_PER_SENDER || '50', 10);

export interface RateLimitResult {
  allowed: boolean;
  currentCount: number;
  limit: number;
  retryAfterMs: number;
  hourWindow: number;
  senderId: string;
}

export interface SenderUsage {
  senderId: string;
  senderEmail: string;
  currentCount: number;
  limit: number;
  hourWindow: number;
  percentUsed: number;
}

/**
 * Get the current hour window key (unix hour bucket).
 * e.g. hour window = Math.floor(Date.now() / 3600000)
 */
const getCurrentHourWindow = (): number => {
  return Math.floor(Date.now() / 3600000);
};

/**
 * Build the Redis key for rate limiting.
 * Format: ratelimit:{senderId}:{hourWindow}
 */
const buildRateLimitKey = (senderId: string, hourWindow: number): string => {
  return `ratelimit:${senderId}:${hourWindow}`;
};

/**
 * Build the Redis key for global rate limiting.
 */
const buildGlobalRateLimitKey = (hourWindow: number): string => {
  return `ratelimit:global:${hourWindow}`;
};

/**
 * Calculate milliseconds until the next hour window starts.
 */
const msUntilNextHourWindow = (): number => {
  const nextWindowStart = (getCurrentHourWindow() + 1) * 3600000;
  return Math.max(0, nextWindowStart - Date.now()) + 1000; // +1s buffer
};

class RateLimitService {
  /**
   * Check rate limit and atomically increment the counter if allowed.
   * Uses Redis INCR + EXPIRE for atomic, multi-worker-safe counting.
   * 
   * Returns whether the email send is allowed, the current count,
   * the configured limit, and how long to delay if rate limited.
   */
  async checkAndIncrement(senderId: string): Promise<RateLimitResult> {
    const hourWindow = getCurrentHourWindow();
    const senderKey = buildRateLimitKey(senderId, hourWindow);
    const globalKey = buildGlobalRateLimitKey(hourWindow);
    const retryAfterMs = msUntilNextHourWindow();

    try {
      // 1. Check per-sender limit
      const senderCount = await redisClient.incr(senderKey);
      // Set TTL on first increment (expires after 1 hour + buffer)
      if (senderCount === 1) {
        await redisClient.expire(senderKey, 3700);
      }

      if (senderCount > PER_SENDER_HOURLY_LIMIT) {
        // Rollback the increment since we're not sending
        await redisClient.decr(senderKey);
        console.log(
          `[RateLimit] Per-sender limit hit for ${senderId}: ${senderCount - 1}/${PER_SENDER_HOURLY_LIMIT} in hour window ${hourWindow}`
        );
        return {
          allowed: false,
          currentCount: senderCount - 1,
          limit: PER_SENDER_HOURLY_LIMIT,
          retryAfterMs,
          hourWindow,
          senderId,
        };
      }

      // 2. Check global limit
      const globalCount = await redisClient.incr(globalKey);
      if (globalCount === 1) {
        await redisClient.expire(globalKey, 3700);
      }

      if (globalCount > GLOBAL_HOURLY_LIMIT) {
        // Rollback both increments
        await redisClient.decr(globalKey);
        await redisClient.decr(senderKey);
        console.log(
          `[RateLimit] Global limit hit: ${globalCount - 1}/${GLOBAL_HOURLY_LIMIT} in hour window ${hourWindow}`
        );
        return {
          allowed: false,
          currentCount: globalCount - 1,
          limit: GLOBAL_HOURLY_LIMIT,
          retryAfterMs,
          hourWindow,
          senderId,
        };
      }

      return {
        allowed: true,
        currentCount: senderCount,
        limit: PER_SENDER_HOURLY_LIMIT,
        retryAfterMs: 0,
        hourWindow,
        senderId,
      };
    } catch (err: any) {
      // If Redis is unavailable, allow sending (fail-open strategy)
      console.warn('[RateLimit] Redis error, allowing send (fail-open):', err.message);
      return {
        allowed: true,
        currentCount: 0,
        limit: PER_SENDER_HOURLY_LIMIT,
        retryAfterMs: 0,
        hourWindow,
        senderId,
      };
    }
  }

  /**
   * Get current usage for a specific sender in the current hour window.
   */
  async getCurrentUsage(senderId: string, senderEmail: string = ''): Promise<SenderUsage> {
    const hourWindow = getCurrentHourWindow();
    const key = buildRateLimitKey(senderId, hourWindow);

    try {
      const countStr = await redisClient.get(key);
      const currentCount = countStr ? parseInt(countStr, 10) : 0;

      return {
        senderId,
        senderEmail,
        currentCount,
        limit: PER_SENDER_HOURLY_LIMIT,
        hourWindow,
        percentUsed: Math.round((currentCount / PER_SENDER_HOURLY_LIMIT) * 100),
      };
    } catch {
      return {
        senderId,
        senderEmail,
        currentCount: 0,
        limit: PER_SENDER_HOURLY_LIMIT,
        hourWindow,
        percentUsed: 0,
      };
    }
  }

  /**
   * Get global usage for the current hour window.
   */
  async getGlobalUsage(): Promise<{ currentCount: number; limit: number; percentUsed: number }> {
    const hourWindow = getCurrentHourWindow();
    const key = buildGlobalRateLimitKey(hourWindow);

    try {
      const countStr = await redisClient.get(key);
      const currentCount = countStr ? parseInt(countStr, 10) : 0;

      return {
        currentCount,
        limit: GLOBAL_HOURLY_LIMIT,
        percentUsed: Math.round((currentCount / GLOBAL_HOURLY_LIMIT) * 100),
      };
    } catch {
      return {
        currentCount: 0,
        limit: GLOBAL_HOURLY_LIMIT,
        percentUsed: 0,
      };
    }
  }

  /**
   * Get configured limits (for API/dashboard display).
   */
  getLimits() {
    return {
      globalHourlyLimit: GLOBAL_HOURLY_LIMIT,
      perSenderHourlyLimit: PER_SENDER_HOURLY_LIMIT,
    };
  }
}

export const rateLimitService = new RateLimitService();
