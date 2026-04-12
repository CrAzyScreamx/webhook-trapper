import { Worker, Job } from 'bullmq';
import { eq } from 'drizzle-orm';
import redisClient from './connection';
import { WebhookJobData } from './webhookQueue';
import { send } from '../services/forwarder';
import { db } from '../db';
import { webhookLogs } from '../schema';
import { emit } from '../sse';

const worker = new Worker<WebhookJobData>(
  'webhook-forward',
  async (job: Job<WebhookJobData>) => {
    const { logId, destinationUrl, payload, authType, authValue, skipTlsVerify, customAuthHeader } = job.data;

    const result = await send(destinationUrl, payload, authType, authValue, skipTlsVerify, customAuthHeader);

    const log = db.select().from(webhookLogs).where(eq(webhookLogs.id, logId)).get();
    if (log) {
      const [updated] = db.update(webhookLogs)
        .set({
          status: result.success ? 'SENT' : 'REJECTED',
          responseCode: result.responseCode,
          latency: result.latency,
          errorMessage: result.errorMessage,
        })
        .where(eq(webhookLogs.id, logId))
        .returning()
        .all();
      emit(updated.trapperId, { ...updated });
    }
  },
  { connection: redisClient }
);

worker.on('failed', async (job: Job<WebhookJobData> | undefined, err: Error) => {
  if (!job) return;

  const log = db.select().from(webhookLogs).where(eq(webhookLogs.id, job.data.logId)).get();
  if (log) {
    const [updated] = db.update(webhookLogs)
      .set({
        status: 'REJECTED',
        responseCode: null,
        latency: null,
        errorMessage: err.message || 'All retries exhausted',
      })
      .where(eq(webhookLogs.id, job.data.logId))
      .returning()
      .all();
    emit(updated.trapperId, { ...updated });
  }
});

console.log('Webhook worker started');
