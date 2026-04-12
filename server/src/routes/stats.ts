import { Router, Request, Response } from 'express';
import { and, eq, gte, isNotNull, count, avg } from 'drizzle-orm';
import { db } from '../db';
import { webhookLogs, trappers } from '../schema';

const router = Router();

router.get('/', async (_req: Request, res: Response) => {
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayIso = todayStart.toISOString();

  const [totalToday, sent, filtered, avgLatencyResult, activeTrappers] = [
    db.select({ total: count() }).from(webhookLogs).where(gte(webhookLogs.timestamp, todayIso)).get()!.total,
    db.select({ total: count() }).from(webhookLogs).where(and(gte(webhookLogs.timestamp, todayIso), eq(webhookLogs.status, 'SENT'))).get()!.total,
    db.select({ total: count() }).from(webhookLogs).where(and(gte(webhookLogs.timestamp, todayIso), eq(webhookLogs.status, 'FILTERED'))).get()!.total,
    db.select({ avg: avg(webhookLogs.latency) }).from(webhookLogs).where(and(gte(webhookLogs.timestamp, todayIso), isNotNull(webhookLogs.latency))).get(),
    db.select({ total: count() }).from(trappers).where(eq(trappers.status, 'active')).get()!.total,
  ];

  // Hourly buckets for last 24h
  const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const recentLogs = db.select({ timestamp: webhookLogs.timestamp, status: webhookLogs.status })
    .from(webhookLogs)
    .where(gte(webhookLogs.timestamp, since24h))
    .all();

  const hourlyBuckets: Record<number, { hour: number; sent: number; filtered: number; rejected: number }> = {};
  for (let i = 0; i < 24; i++) {
    hourlyBuckets[i] = { hour: i, sent: 0, filtered: 0, rejected: 0 };
  }
  for (const log of recentLogs) {
    const h = new Date(log.timestamp).getHours();
    if (log.status === 'SENT') hourlyBuckets[h].sent++;
    else if (log.status === 'FILTERED') hourlyBuckets[h].filtered++;
    else if (log.status === 'REJECTED') hourlyBuckets[h].rejected++;
  }

  res.json({
    totalToday,
    sent,
    filtered,
    avgLatency: avgLatencyResult?.avg != null ? Number(avgLatencyResult.avg) : null,
    activeTrappers,
    hourly: Object.values(hourlyBuckets),
  });
});

export default router;
