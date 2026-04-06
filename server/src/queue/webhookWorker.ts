import { Worker, Job } from 'bullmq';
import redisClient from './connection';
import { WebhookJobData } from './webhookQueue';
import { send } from '../services/forwarder';
import WebhookLog from '../models/WebhookLog';
import { emit } from '../sse';

const worker = new Worker<WebhookJobData>(
  'webhook-forward',
  async (job: Job<WebhookJobData>) => {
    const { logId, destinationUrl, payload, authType, authValue } = job.data;

    const result = await send(destinationUrl, payload, authType, authValue);

    const log = await WebhookLog.findByPk(logId);
    if (log) {
      await log.update({
        status: result.success ? 'SENT' : 'REJECTED',
        responseCode: result.responseCode,
        latency: result.latency,
        errorMessage: result.errorMessage,
      });
      emit(log.trapperId, { ...log.toJSON() });
    }
  },
  { connection: redisClient }
);

worker.on('failed', async (job: Job<WebhookJobData> | undefined, err: Error) => {
  if (!job) return;

  const log = await WebhookLog.findByPk(job.data.logId);
  if (log) {
    await log.update({
      status: 'REJECTED',
      responseCode: null,
      latency: null,
      errorMessage: err.message || 'All retries exhausted',
    });
    emit(log.trapperId, { ...log.toJSON() });
  }
});

console.log('Webhook worker started');
