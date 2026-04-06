import { Queue } from 'bullmq';
import redisClient from './connection';
import { AuthType, RetryPolicy } from '../models/Trapper';

export interface WebhookJobData {
  logId: string;
  trapperId: string;
  destinationUrl: string;
  authType: AuthType;
  authValue: string | null;
  payload: unknown;
}

export const webhookQueue = new Queue('webhook-forward', { connection: redisClient });

function getJobOptions(retryPolicy: RetryPolicy) {
  switch (retryPolicy) {
    case 'exponential':
      return { attempts: 3, backoff: { type: 'exponential', delay: 1000 } };
    case 'immediate':
      return { attempts: 3, backoff: { type: 'fixed', delay: 0 } };
    case 'none':
    default:
      return { attempts: 1 };
  }
}

export async function enqueueWebhook(data: WebhookJobData, retryPolicy: RetryPolicy): Promise<void> {
  await webhookQueue.add('webhook-forward', data, getJobOptions(retryPolicy));
}
