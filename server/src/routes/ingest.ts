import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import { eq } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../db';
import { trappers, filterRules, webhookLogs, destinations, type Operator, type RetryPolicy, type AuthType, type DeliveryMode } from '../schema';
import { evaluate } from '../services/filterEngine';
import { emit } from '../sse';
import { perTrapperRateLimiter } from '../middleware/rateLimiter';
import { enqueueWebhook, WebhookJobData, FallbackDestination } from '../queue/webhookQueue';
import { applyTemplate } from '../services/templateEngine';

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

  let forwardPayload = payload;
  if (trapper.overrideEnabled && trapper.overridePayload) {
    try {
      const overrideParsed = JSON.parse(trapper.overridePayload);
      forwardPayload = applyTemplate(overrideParsed, payload);
    } catch {
      // malformed override JSON — fall back to original payload
    }
  }

  const dests = db.select().from(destinations).where(eq(destinations.trapperId, trapper.id)).all();
  const deliveryMode = (trapper.deliveryMode ?? 'broadcast') as DeliveryMode;

  if (dests.length > 0) {
    const parentLogId = uuidv4();

    if (deliveryMode === 'broadcast') {
      // Fire to all destinations simultaneously — one log + one job per destination
      for (const dest of dests) {
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
          parentLogId,
          destinationId: dest.id,
          destinationLabel: dest.label,
        }).run();

        await enqueueWebhook(
          {
            logId,
            trapperId: trapper.id,
            destinationUrl: dest.url,
            authType: dest.authType as AuthType,
            authValue: dest.authValue,
            payload: forwardPayload,
            skipTlsVerify: !!dest.skipTlsVerify,
            customAuthHeader: dest.customAuthHeader ?? null,
            destinationId: dest.id,
            fallbackChain: [],
          },
          dest.retryPolicy as RetryPolicy,
        );
      }
    } else {
      // Fallback mode — try first destination; on failure the worker tries the next
      const [first, ...rest] = dests;

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
        parentLogId,
        destinationId: first.id,
        destinationLabel: first.label,
      }).run();

      const fallbackChain: FallbackDestination[] = rest.map((d) => ({
        destinationId: d.id,
        destinationLabel: d.label,
        destinationUrl: d.url,
        authType: d.authType as AuthType,
        authValue: d.authValue,
        skipTlsVerify: !!d.skipTlsVerify,
        customAuthHeader: d.customAuthHeader ?? null,
        retryPolicy: d.retryPolicy as RetryPolicy,
      }));

      await enqueueWebhook(
        {
          logId,
          trapperId: trapper.id,
          destinationUrl: first.url,
          authType: first.authType as AuthType,
          authValue: first.authValue,
          payload: forwardPayload,
          skipTlsVerify: !!first.skipTlsVerify,
          customAuthHeader: first.customAuthHeader ?? null,
          destinationId: first.id,
          fallbackChain,
        },
        first.retryPolicy as RetryPolicy,
      );
    }
  } else {
    // No destinations configured — fall back to the trapper's single destination URL
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
      parentLogId: null,
      destinationId: null,
      destinationLabel: null,
    }).run();

    await enqueueWebhook(
      {
        logId,
        trapperId: trapper.id,
        destinationUrl: trapper.destinationUrl,
        authType: trapper.authType as AuthType,
        authValue: trapper.authValue,
        payload: forwardPayload,
        skipTlsVerify: !!trapper.skipTlsVerify,
        customAuthHeader: trapper.customAuthHeader ?? null,
        destinationId: null,
        fallbackChain: [],
      },
      trapper.retryPolicy as RetryPolicy,
    );
  }

  res.status(200).json({ status: 'QUEUED' });
  } catch (err) {
    console.error('[ingest] unhandled error:', err);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
});

export default router;
