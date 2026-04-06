import { Router, Request, Response } from 'express';
import { Op, fn, col, literal } from 'sequelize';
import WebhookLog from '../models/WebhookLog';
import Trapper from '../models/Trapper';

const router = Router();

router.get('/', async (_req: Request, res: Response) => {
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const [totalToday, sent, filtered, avgLatencyResult, activeTrappers] = await Promise.all([
    WebhookLog.count({ where: { timestamp: { [Op.gte]: todayStart } } }),
    WebhookLog.count({ where: { timestamp: { [Op.gte]: todayStart }, status: 'SENT' } }),
    WebhookLog.count({ where: { timestamp: { [Op.gte]: todayStart }, status: 'FILTERED' } }),
    WebhookLog.findOne({
      where: { timestamp: { [Op.gte]: todayStart }, latency: { [Op.not]: null } },
      attributes: [[fn('AVG', col('latency')), 'avg']],
      raw: true,
    }),
    Trapper.count({ where: { status: 'active' } }),
  ]);

  // Hourly buckets for last 24h
  const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const recentLogs = await WebhookLog.findAll({
    where: { timestamp: { [Op.gte]: since24h } },
    attributes: ['timestamp', 'status'],
    raw: true,
  });

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
    avgLatency: (avgLatencyResult as unknown as { avg: number | null })?.avg ?? null,
    activeTrappers,
    hourly: Object.values(hourlyBuckets),
  });
});

export default router;
