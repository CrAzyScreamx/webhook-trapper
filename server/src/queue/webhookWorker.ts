import { Worker, Job } from 'bullmq';
import { eq } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';
import redisClient from './connection';
import { WebhookJobData, enqueueWebhook } from './webhookQueue';
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

    // If delivery failed and we're in fallback mode, throw so BullMQ can count the attempt
    if (!result.success) {
      throw new Error(result.errorMessage ?? 'Delivery failed');
    }
  },
  { connection: redisClient }
);

worker.on('failed', async (job: Job<WebhookJobData> | undefined, err: Error) => {
  if (!job) return;

  // Mark current log as REJECTED
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

  // Fallback chain: if there are more destinations to try, enqueue next
  const chain = job.data.fallbackChain;
  if (chain && chain.length > 0) {
    const [next, ...remaining] = chain;

    // Find the source log to copy ingest metadata
    const sourceLog = db.select().from(webhookLogs).where(eq(webhookLogs.id, job.data.logId)).get();

    const nextLogId = uuidv4();
    db.insert(webhookLogs).values({
      id: nextLogId,
      trapperId: job.data.trapperId,
      timestamp: sourceLog?.timestamp ?? new Date().toISOString(),
      sourceIp: sourceLog?.sourceIp ?? '',
      method: sourceLog?.method ?? 'POST',
      headers: sourceLog?.headers ?? '{}',
      payload: sourceLog?.payload ?? '{}',
      status: 'QUEUED',
      responseCode: null,
      latency: null,
      errorMessage: null,
      parentLogId: sourceLog?.parentLogId,
      destinationId: next.destinationId,
      destinationLabel: next.destinationLabel,
    }).run();

    await enqueueWebhook(
      {
        logId: nextLogId,
        trapperId: job.data.trapperId,
        destinationUrl: next.destinationUrl,
        authType: next.authType,
        authValue: next.authValue,
        payload: job.data.payload,
        skipTlsVerify: next.skipTlsVerify,
        customAuthHeader: next.customAuthHeader,
        destinationId: next.destinationId,
        fallbackChain: remaining,
      },
      next.retryPolicy,
    );
  }
});

console.log('Webhook worker started');
