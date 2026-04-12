import { Router, Request, Response } from 'express';
import { eq, and, like, desc, count } from 'drizzle-orm';
import { db } from '../db';
import { webhookLogs, trappers } from '../schema';

const router = Router();

// GET /api/trappers/:id/logs
router.get('/trappers/:id/logs', async (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;
  const status = req.query.status as string | undefined;
  const search = req.query.search as string | undefined;

  const whereClause = and(
    eq(webhookLogs.trapperId, req.params.id),
    status ? eq(webhookLogs.status, status) : undefined,
    search ? like(webhookLogs.payload, `%${search}%`) : undefined,
  );

  const [{ total }] = db.select({ total: count() }).from(webhookLogs).where(whereClause).all();
  const rows = db.select().from(webhookLogs)
    .where(whereClause)
    .orderBy(desc(webhookLogs.timestamp))
    .limit(limit)
    .offset((page - 1) * limit)
    .all();

  res.json({ total, page, limit, rows });
});

// GET /api/logs — all trappers
router.get('/', async (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;

  const [{ total }] = db.select({ total: count() }).from(webhookLogs).all();
  const rows = db.select({
    log: webhookLogs,
    trapperName: trappers.name,
  })
    .from(webhookLogs)
    .leftJoin(trappers, eq(webhookLogs.trapperId, trappers.id))
    .orderBy(desc(webhookLogs.timestamp))
    .limit(limit)
    .offset((page - 1) * limit)
    .all();

  const enriched = rows.map(({ log, trapperName }) => ({ ...log, trapperName }));

  res.json({ total, page, limit, rows: enriched });
});

export default router;
