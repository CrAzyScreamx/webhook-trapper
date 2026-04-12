import { Router, Request, Response } from 'express';
import { eq, desc } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../db';
import { trappers, filterRules, webhookLogs, type Trapper } from '../schema';
import { evaluate } from '../services/filterEngine';
import { send } from '../services/forwarder';
import { applyTemplate } from '../services/templateEngine';
import { invalidateTrapperLimiter } from '../middleware/rateLimiter';

const router = Router();

function sanitizeTrapper(trapper: Trapper) {
  const { hmacSecret, ...rest } = trapper;
  return { ...rest, hmacConfigured: !!hmacSecret };
}

// GET /api/trappers
router.get('/', async (_req: Request, res: Response) => {
  const result = db.select().from(trappers).orderBy(desc(trappers.createdAt)).all();
  res.json(result.map(sanitizeTrapper));
});

// POST /api/trappers
router.post('/', async (req: Request, res: Response) => {
  const { name, description, trapId, destinationUrl, retryPolicy, authType, authValue, rateLimit, rateLimitWindowMs, hmacSecret, hmacHeader, hmacAlgorithm, overrideEnabled, overridePayload, skipTlsVerify, customAuthHeader } = req.body;
  if (!name || !trapId || !destinationUrl) {
    res.status(400).json({ error: 'name, trapId and destinationUrl are required' });
    return;
  }
  const existing = db.select().from(trappers).where(eq(trappers.trapId, trapId)).get();
  if (existing) {
    res.status(409).json({ error: 'trapId already in use' });
    return;
  }
  const [trapper] = db.insert(trappers).values({
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
    overrideEnabled: overrideEnabled ? 1 : 0,
    overridePayload: overridePayload ?? null,
    skipTlsVerify: skipTlsVerify ? 1 : 0,
    customAuthHeader: customAuthHeader ?? null,
  }).returning().all();
  res.status(201).json(sanitizeTrapper(trapper));
});

// GET /api/trappers/:id
router.get('/:id', async (req: Request, res: Response) => {
  const trapper = db.select().from(trappers).where(eq(trappers.id, req.params.id)).get();
  if (!trapper) { res.status(404).json({ error: 'Not found' }); return; }
  res.json(sanitizeTrapper(trapper));
});

// PUT /api/trappers/:id
router.put('/:id', async (req: Request, res: Response) => {
  const trapper = db.select().from(trappers).where(eq(trappers.id, req.params.id)).get();
  if (!trapper) { res.status(404).json({ error: 'Not found' }); return; }
  const { name, description, destinationUrl, retryPolicy, authType, authValue, rateLimit, rateLimitWindowMs, hmacSecret, hmacHeader, hmacAlgorithm, overrideEnabled, overridePayload, skipTlsVerify, customAuthHeader } = req.body;
  const [updated] = db.update(trappers)
    .set({ name, description, destinationUrl, retryPolicy, authType, authValue, rateLimit, rateLimitWindowMs, hmacSecret, hmacHeader, hmacAlgorithm, overrideEnabled: overrideEnabled ? 1 : 0, overridePayload: overridePayload ?? null, skipTlsVerify: skipTlsVerify ? 1 : 0, customAuthHeader: customAuthHeader ?? null, updatedAt: new Date().toISOString() })
    .where(eq(trappers.id, req.params.id))
    .returning()
    .all();
  invalidateTrapperLimiter(trapper.trapId);
  res.json(sanitizeTrapper(updated));
});

// DELETE /api/trappers/:id
router.delete('/:id', async (req: Request, res: Response) => {
  const trapper = db.select().from(trappers).where(eq(trappers.id, req.params.id)).get();
  if (!trapper) { res.status(404).json({ error: 'Not found' }); return; }
  db.delete(filterRules).where(eq(filterRules.trapperId, req.params.id)).run();
  db.delete(webhookLogs).where(eq(webhookLogs.trapperId, req.params.id)).run();
  db.delete(trappers).where(eq(trappers.id, req.params.id)).run();
  res.status(204).send();
});

// PATCH /api/trappers/:id/status
router.patch('/:id/status', async (req: Request, res: Response) => {
  const trapper = db.select().from(trappers).where(eq(trappers.id, req.params.id)).get();
  if (!trapper) { res.status(404).json({ error: 'Not found' }); return; }
  const { status } = req.body;
  if (status !== 'active' && status !== 'paused') {
    res.status(400).json({ error: 'status must be active or paused' });
    return;
  }
  const [updated] = db.update(trappers)
    .set({ status, updatedAt: new Date().toISOString() })
    .where(eq(trappers.id, req.params.id))
    .returning()
    .all();
  res.json(updated);
});

// GET /api/trappers/:id/rules
router.get('/:id/rules', async (req: Request, res: Response) => {
  const rules = db.select().from(filterRules)
    .where(eq(filterRules.trapperId, req.params.id))
    .orderBy(filterRules.order)
    .all();
  res.json(rules);
});

// PUT /api/trappers/:id/rules — replace all
router.put('/:id/rules', async (req: Request, res: Response) => {
  const trapper = db.select().from(trappers).where(eq(trappers.id, req.params.id)).get();
  if (!trapper) { res.status(404).json({ error: 'Not found' }); return; }
  const rules: Array<{ fieldPath: string; operator: string; value: string; order: number }> = req.body;
  db.delete(filterRules).where(eq(filterRules.trapperId, req.params.id)).run();
  const created = rules.length > 0
    ? db.insert(filterRules).values(
        rules.map((r, i) => ({
          id: uuidv4(),
          trapperId: req.params.id,
          fieldPath: r.fieldPath,
          operator: r.operator,
          value: r.value ?? null,
          order: r.order ?? i,
        }))
      ).returning().all()
    : [];
  res.json(created);
});

// POST /api/trappers/:id/test
router.post('/:id/test', async (req: Request, res: Response) => {
  try {
    const trapper = db.select().from(trappers).where(eq(trappers.id, req.params.id)).get();
    if (!trapper) { res.status(404).json({ error: 'Not found' }); return; }

    const { rules, payload } = req.body;
    if (!payload) { res.status(400).json({ error: 'payload is required' }); return; }

    const parsedRules = (rules ?? []) as Array<{ fieldPath: string; operator: import('../schema').Operator; value: string | null; logicOp?: 'AND' | 'OR'; groupBefore?: number; groupAfter?: number }>;
    const filterPassed = evaluate(parsedRules, payload);

    const result: { filterPassed: boolean; destination?: { status: number | null; body: unknown; error?: string } } = { filterPassed };

    if (filterPassed) {
      let forwardPayload = payload;
      if (trapper.overrideEnabled && trapper.overridePayload) {
        try {
          const overrideParsed = JSON.parse(trapper.overridePayload);
          forwardPayload = applyTemplate(overrideParsed, payload);
        } catch { /* malformed override — fall back */ }
      }

      const forward = await send(
        trapper.destinationUrl,
        forwardPayload,
        trapper.authType as import('../schema').AuthType,
        trapper.authValue,
        !!trapper.skipTlsVerify,
        trapper.customAuthHeader ?? null,
      );
      result.destination = {
        status: forward.responseCode,
        body: null,
        ...(forward.errorMessage ? { error: forward.errorMessage } : {}),
      };
    }

    res.json(result);
  } catch (err) {
    console.error('[test] unhandled error:', err);
    if (!res.headersSent) res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
