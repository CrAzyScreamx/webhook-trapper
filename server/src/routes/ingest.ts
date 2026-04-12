import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import { eq } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../db';
import { trappers, filterRules, webhookLogs, type Operator, type RetryPolicy, type AuthType } from '../schema';
import { evaluate } from '../services/filterEngine';
import { emit } from '../sse';
import { perTrapperRateLimiter } from '../middleware/rateLimiter';
import { enqueueWebhook, WebhookJobData } from '../queue/webhookQueue';

const router = Router();

router.use(perTrapperRateLimiter);

router.post('/:trapId', async (req: Request, res: Response) => {
  try {
  const trapper = db.select().from(trappers).where(eq(trappers.trapId, req.params.trapId)).get();
  if (!trapper) {
    res.status(404).json({ error: 'Trapper not found' });
    return;
  }

  const rawBody = req.body as Buffer;
  if (!Buffer.isBuffer(rawBody)) {
    res.status(400).json({ error: 'Content-Type must be application/json' });
    return;
  }

  let payload: unknown;

  if (trapper.hmacSecret) {
    const expected = crypto
      .createHmac(trapper.hmacAlgorithm || 'sha256', trapper.hmacSecret)
      .update(rawBody)
      .digest('hex');
    const received = ((req.headers[trapper.hmacHeader!] as string) || '').replace(/^sha\d+=/, '');
    if (!crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(received.padEnd(expected.length)))) {
      res.status(401).json({ error: 'Invalid signature' });
      return;
    }
  }

  try {
    payload = JSON.parse(rawBody.toString());
  } catch {
    res.status(400).json({ error: 'Invalid JSON body' });
    return;
  }

  const sourceIp = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '';
  const headersJson = JSON.stringify(req.headers);
  const payloadJson = JSON.stringify(payload);
  const now = new Date().toISOString();

  if (trapper.status === 'paused') {
    const [log] = db.insert(webhookLogs).values({
      id: uuidv4(),
      trapperId: trapper.id,
      timestamp: now,
      sourceIp,
      method: req.method,
      headers: headersJson,
      payload: payloadJson,
      status: 'FILTERED',
      responseCode: null,
      latency: null,
      errorMessage: 'Trapper is paused',
    }).returning().all();
    emit(trapper.id, { ...log, trapperName: trapper.name });
    res.status(200).json({ status: 'FILTERED', reason: 'paused' });
    return;
  }

  const rules = db.select().from(filterRules)
    .where(eq(filterRules.trapperId, trapper.id))
    .orderBy(filterRules.order)
    .all() as Array<{ fieldPath: string; operator: Operator; value: string | null; logicOp: 'AND' | 'OR'; groupBefore: number; groupAfter: number }>;

  const passed = evaluate(rules, payload);

  if (!passed) {
    const [log] = db.insert(webhookLogs).values({
      id: uuidv4(),
      trapperId: trapper.id,
      timestamp: now,
      sourceIp,
      method: req.method,
      headers: headersJson,
      payload: payloadJson,
      status: 'FILTERED',
      responseCode: null,
      latency: null,
      errorMessage: 'Filter rules did not match',
    }).returning().all();
    emit(trapper.id, { ...log, trapperName: trapper.name });
    res.status(200).json({ status: 'FILTERED', reason: 'rules' });
    return;
  }

  const logId = uuidv4();
  db.insert(webhookLogs).values({
    id: logId,
    trapperId: trapper.id,
    timestamp: now,
    sourceIp,
    method: req.method,
    headers: headersJson,
    payload: payloadJson,
    status: 'QUEUED',
    responseCode: null,
    latency: null,
    errorMessage: null,
  }).run();

  let forwardPayload = payload;
  if (trapper.overrideEnabled && trapper.overridePayload) {
    try {
      forwardPayload = JSON.parse(trapper.overridePayload);
    } catch {
      // malformed override JSON — fall back to original payload
    }
  }

  const jobData: WebhookJobData = {
    logId,
    trapperId: trapper.id,
    destinationUrl: trapper.destinationUrl,
    authType: trapper.authType as AuthType,
    authValue: trapper.authValue,
    payload: forwardPayload,
    skipTlsVerify: !!trapper.skipTlsVerify,
    customAuthHeader: trapper.customAuthHeader ?? null,
  };

  await enqueueWebhook(jobData, trapper.retryPolicy as RetryPolicy);
  res.status(200).json({ status: 'QUEUED' });
  } catch (err) {
    console.error('[ingest] unhandled error:', err);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
});

export default router;
