import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import Trapper from '../models/Trapper';
import FilterRule from '../models/FilterRule';
import WebhookLog from '../models/WebhookLog';
import { evaluate } from '../services/filterEngine';
import { emit } from '../sse';
import { perTrapperRateLimiter } from '../middleware/rateLimiter';
import { enqueueWebhook, WebhookJobData } from '../queue/webhookQueue';

const router = Router();

router.use(perTrapperRateLimiter);

router.post('/:trapId', async (req: Request, res: Response) => {
  const trapper = await Trapper.findOne({ where: { trapId: req.params.trapId } });
  if (!trapper) {
    res.status(404).json({ error: 'Trapper not found' });
    return;
  }

  const rawBody = req.body as Buffer;
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

  if (trapper.status === 'paused') {
    const log = await WebhookLog.create({
      id: uuidv4(),
      trapperId: trapper.id,
      timestamp: new Date(),
      sourceIp,
      method: req.method,
      headers: headersJson,
      payload: payloadJson,
      status: 'FILTERED',
      responseCode: null,
      latency: null,
      errorMessage: 'Trapper is paused',
    });
    emit(trapper.id, { ...log.toJSON(), trapperName: trapper.name });
    res.status(200).json({ status: 'FILTERED', reason: 'paused' });
    return;
  }

  const rules = await FilterRule.findAll({
    where: { trapperId: trapper.id },
    order: [['order', 'ASC']],
  });

  const passed = evaluate(rules, payload);

  if (!passed) {
    const log = await WebhookLog.create({
      id: uuidv4(),
      trapperId: trapper.id,
      timestamp: new Date(),
      sourceIp,
      method: req.method,
      headers: headersJson,
      payload: payloadJson,
      status: 'FILTERED',
      responseCode: null,
      latency: null,
      errorMessage: 'Filter rules did not match',
    });
    emit(trapper.id, { ...log.toJSON(), trapperName: trapper.name });
    res.status(200).json({ status: 'FILTERED', reason: 'rules' });
    return;
  }

  const logId = uuidv4();
  await WebhookLog.create({
    id: logId,
    trapperId: trapper.id,
    timestamp: new Date(),
    sourceIp,
    method: req.method,
    headers: headersJson,
    payload: payloadJson,
    status: 'QUEUED',
    responseCode: null,
    latency: null,
    errorMessage: null,
  });

  const jobData: WebhookJobData = {
    logId,
    trapperId: trapper.id,
    destinationUrl: trapper.destinationUrl,
    authType: trapper.authType,
    authValue: trapper.authValue,
    payload,
  };

  await enqueueWebhook(jobData, trapper.retryPolicy);
  res.status(200).json({ status: 'QUEUED' });
});

export default router;
