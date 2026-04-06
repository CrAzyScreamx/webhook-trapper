import { Router, Request, Response } from 'express';
import { Op } from 'sequelize';
import WebhookLog from '../models/WebhookLog';
import Trapper from '../models/Trapper';

const router = Router();

// GET /api/trappers/:id/logs
router.get('/trappers/:id/logs', async (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;
  const status = req.query.status as string | undefined;
  const search = req.query.search as string | undefined;

  const where: Record<string, unknown> = { trapperId: req.params.id };
  if (status) where.status = status;
  if (search) where.payload = { [Op.like]: `%${search}%` };

  const { count, rows } = await WebhookLog.findAndCountAll({
    where,
    order: [['timestamp', 'DESC']],
    limit,
    offset: (page - 1) * limit,
  });

  res.json({ total: count, page, limit, rows });
});

// GET /api/logs — all trappers
router.get('/', async (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;

  const { count, rows } = await WebhookLog.findAndCountAll({
    order: [['timestamp', 'DESC']],
    limit,
    offset: (page - 1) * limit,
    include: [{ model: Trapper, attributes: ['name', 'trapId'] }],
  });

  const enriched = rows.map((log) => {
    const json = log.toJSON();
    return {
      ...json,
      trapperName: (log as any).Trapper?.name,
    };
  });

  res.json({ total: count, page, limit, rows: enriched });
});

export default router;
