import { Router, Request, Response } from 'express';
import { eq } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../db';
import { destinations, trappers } from '../schema';

const router = Router({ mergeParams: true });

// GET /api/trappers/:id/destinations
router.get('/', (req: Request, res: Response) => {
  const rows = db.select().from(destinations)
    .where(eq(destinations.trapperId, req.params.id))
    .all();
  res.json(rows);
});

// POST /api/trappers/:id/destinations
router.post('/', (req: Request, res: Response) => {
  const trapper = db.select().from(trappers).where(eq(trappers.id, req.params.id)).get();
  if (!trapper) { res.status(404).json({ error: 'Trapper not found' }); return; }

  const { label, url, authType, authValue, customAuthHeader, skipTlsVerify, retryPolicy } = req.body;
  if (!label || !url) {
    res.status(400).json({ error: 'label and url are required' });
    return;
  }

  const [dest] = db.insert(destinations).values({
    id: uuidv4(),
    trapperId: req.params.id,
    label,
    url,
    authType: authType ?? 'none',
    authValue: authValue ?? null,
    customAuthHeader: customAuthHeader ?? null,
    skipTlsVerify: skipTlsVerify ? 1 : 0,
    retryPolicy: retryPolicy ?? 'none',
  }).returning().all();

  res.status(201).json(dest);
});

// PUT /api/trappers/:id/destinations/:destId
router.put('/:destId', (req: Request, res: Response) => {
  const dest = db.select().from(destinations).where(eq(destinations.id, req.params.destId)).get();
  if (!dest) { res.status(404).json({ error: 'Destination not found' }); return; }

  const { label, url, authType, authValue, customAuthHeader, skipTlsVerify, retryPolicy } = req.body;

  const [updated] = db.update(destinations)
    .set({
      label: label ?? dest.label,
      url: url ?? dest.url,
      authType: authType ?? dest.authType,
      authValue: authValue ?? null,
      customAuthHeader: customAuthHeader ?? null,
      skipTlsVerify: skipTlsVerify ? 1 : 0,
      retryPolicy: retryPolicy ?? dest.retryPolicy,
    })
    .where(eq(destinations.id, req.params.destId))
    .returning()
    .all();

  res.json(updated);
});

// DELETE /api/trappers/:id/destinations/:destId
router.delete('/:destId', (req: Request, res: Response) => {
  const dest = db.select().from(destinations).where(eq(destinations.id, req.params.destId)).get();
  if (!dest) { res.status(404).json({ error: 'Destination not found' }); return; }

  db.delete(destinations).where(eq(destinations.id, req.params.destId)).run();
  res.status(204).send();
});

export default router;
