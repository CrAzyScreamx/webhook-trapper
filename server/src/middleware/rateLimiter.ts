import { Request, Response, NextFunction } from 'express';
import { eq } from 'drizzle-orm';
import rateLimit from 'express-rate-limit';
import { RedisStore } from 'rate-limit-redis';
import Redis from 'ioredis';
import { db } from '../db';
import { trappers } from '../schema';

const redisClient = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

export const globalRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 500,
  standardHeaders: true,
  legacyHeaders: false,
  store: new RedisStore({
    // @ts-expect-error — ioredis v5 vs rate-limit-redis types mismatch
    sendCommand: (...args: string[]) => redisClient.call(...args),
  }),
});

type LimiterCacheEntry = {
  limit: number;
  windowMs: number;
  handler: ReturnType<typeof rateLimit>;
};

const limiterCache = new Map<string, LimiterCacheEntry>();

export function invalidateTrapperLimiter(trapId: string): void {
  limiterCache.delete(trapId);
}

export function perTrapperRateLimiter(req: Request, res: Response, next: NextFunction): void {
  const trapId = req.params.trapId;
  if (!trapId) {
    next();
    return;
  }

  const cached = limiterCache.get(trapId);
  if (cached) {
    cached.handler(req, res, next);
    return;
  }

  const trapper = db.select().from(trappers).where(eq(trappers.trapId, trapId)).get();
  if (!trapper || !trapper.rateLimit) {
    next();
    return;
  }

  const windowMs = trapper.rateLimitWindowMs || 60000;
  const limiter = rateLimit({
    windowMs,
    max: trapper.rateLimit,
    standardHeaders: true,
    legacyHeaders: false,
    store: new RedisStore({
      // @ts-expect-error — ioredis v5 vs rate-limit-redis types mismatch
      sendCommand: (...args: string[]) => redisClient.call(...args),
    }),
  });

  limiterCache.set(trapId, { limit: trapper.rateLimit, windowMs, handler: limiter });
  limiter(req, res, next);
}
