import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import Trapper from '../models/Trapper';
import FilterRule from '../models/FilterRule';
import WebhookLog from '../models/WebhookLog';
import { evaluate } from '../services/filterEngine';
import { invalidateTrapperLimiter } from '../middleware/rateLimiter';

const router = Router();

function sanitizeTrapper(trapper: Trapper) {
  const data = trapper.toJSON();
  const { hmacSecret, ...rest } = data;
  return { ...rest, hmacConfigured: !!trapper.hmacSecret };
}

// GET /api/trappers
router.get('/', async (_req: Request, res: Response) => {
  const trappers = await Trapper.findAll({ order: [['createdAt', 'DESC']] });
  res.json(trappers.map(sanitizeTrapper));
});

// POST /api/trappers
router.post('/', async (req: Request, res: Response) => {
  const { name, description, trapId, destinationUrl, retryPolicy, authType, authValue, rateLimit, rateLimitWindowMs, hmacSecret, hmacHeader, hmacAlgorithm } = req.body;
  if (!name || !trapId || !destinationUrl) {
    res.status(400).json({ error: 'name, trapId and destinationUrl are required' });
    return;
  }
  const existing = await Trapper.findOne({ where: { trapId } });
  if (existing) {
    res.status(409).json({ error: 'trapId already in use' });
    return;
  }
  const trapper = await Trapper.create({
    id: uuidv4(),
    name,
    description: description ?? null,
    trapId,
    status: 'active',
    destinationUrl,
    retryPolicy: retryPolicy ?? 'none',
    authType: authType ?? 'none',
    authValue: authValue ?? null,
    rateLimit: rateLimit ?? null,
    rateLimitWindowMs: rateLimitWindowMs ?? null,
    hmacSecret: hmacSecret ?? null,
    hmacHeader: hmacHeader ?? null,
    hmacAlgorithm: hmacAlgorithm ?? 'sha256',
  });
  res.status(201).json(sanitizeTrapper(trapper));
});

// GET /api/trappers/:id
router.get('/:id', async (req: Request, res: Response) => {
  const trapper = await Trapper.findByPk(req.params.id);
  if (!trapper) { res.status(404).json({ error: 'Not found' }); return; }
  res.json(sanitizeTrapper(trapper));
});

// PUT /api/trappers/:id
router.put('/:id', async (req: Request, res: Response) => {
  const trapper = await Trapper.findByPk(req.params.id);
  if (!trapper) { res.status(404).json({ error: 'Not found' }); return; }
  const { name, description, destinationUrl, retryPolicy, authType, authValue, rateLimit, rateLimitWindowMs, hmacSecret, hmacHeader, hmacAlgorithm } = req.body;
  await trapper.update({ name, description, destinationUrl, retryPolicy, authType, authValue, rateLimit, rateLimitWindowMs, hmacSecret, hmacHeader, hmacAlgorithm });
  invalidateTrapperLimiter(trapper.trapId);
  res.json(sanitizeTrapper(trapper));
});

// DELETE /api/trappers/:id
router.delete('/:id', async (req: Request, res: Response) => {
  const trapper = await Trapper.findByPk(req.params.id);
  if (!trapper) { res.status(404).json({ error: 'Not found' }); return; }
  await FilterRule.destroy({ where: { trapperId: req.params.id } });
  await WebhookLog.destroy({ where: { trapperId: req.params.id } });
  await trapper.destroy();
  res.status(204).send();
});

// PATCH /api/trappers/:id/status
router.patch('/:id/status', async (req: Request, res: Response) => {
  const trapper = await Trapper.findByPk(req.params.id);
  if (!trapper) { res.status(404).json({ error: 'Not found' }); return; }
  const { status } = req.body;
  if (status !== 'active' && status !== 'paused') {
    res.status(400).json({ error: 'status must be active or paused' });
    return;
  }
  await trapper.update({ status });
  res.json(trapper);
});

// GET /api/trappers/:id/rules
router.get('/:id/rules', async (req: Request, res: Response) => {
  const rules = await FilterRule.findAll({
    where: { trapperId: req.params.id },
    order: [['order', 'ASC']],
  });
  res.json(rules);
});

// PUT /api/trappers/:id/rules — replace all
router.put('/:id/rules', async (req: Request, res: Response) => {
  const trapper = await Trapper.findByPk(req.params.id);
  if (!trapper) { res.status(404).json({ error: 'Not found' }); return; }
  const rules: Array<{ fieldPath: string; operator: string; value: string; order: number }> = req.body;
  await FilterRule.destroy({ where: { trapperId: req.params.id } });
  const created = await FilterRule.bulkCreate(
    rules.map((r, i) => ({
      id: uuidv4(),
      trapperId: req.params.id,
      fieldPath: r.fieldPath,
      operator: r.operator as FilterRule['operator'],
      value: r.value ?? null,
      order: r.order ?? i,
    }))
  );
  res.json(created);
});

// POST /api/trappers/:id/test
router.post('/:id/test', async (req: Request, res: Response) => {
  const trapper = await Trapper.findByPk(req.params.id);
  if (!trapper) { res.status(404).json({ error: 'Not found' }); return; }

  const { rules, payload } = req.body;
  if (!payload) { res.status(400).json({ error: 'payload is required' }); return; }

  const parsedRules = (rules ?? []) as Array<{ fieldPath: string; operator: import('../models/FilterRule').Operator; value: string | null; logicOp?: 'AND' | 'OR'; groupBefore?: number; groupAfter?: number }>;
  const filterPassed = evaluate(parsedRules, payload);

  const result: { filterPassed: boolean; destination?: { status: number; body: unknown; error?: string } } = { filterPassed };

  if (filterPassed) {
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (trapper.authType === 'bearer' && trapper.authValue) {
        headers['Authorization'] = `Bearer ${trapper.authValue}`;
      } else if (trapper.authType === 'basic' && trapper.authValue) {
        headers['Authorization'] = `Basic ${trapper.authValue}`;
      }

      const fetchResp = await fetch(trapper.destinationUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
      });

      let body: unknown;
      const ct = fetchResp.headers.get('content-type') ?? '';
      if (ct.includes('application/json')) {
        body = await fetchResp.json();
      } else {
        body = await fetchResp.text();
      }

      result.destination = { status: fetchResp.status, body };
    } catch (err: unknown) {
      result.destination = { status: 0, body: null, error: err instanceof Error ? err.message : 'Unknown error' };
    }
  }

  res.json(result);
});

export default router;
