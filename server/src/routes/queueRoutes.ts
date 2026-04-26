import { Router, Request, Response } from 'express';
import { Job } from 'bullmq';
import { webhookQueue } from '../queue/webhookQueue';

const router = Router();

router.get('/stats', async (_req: Request, res: Response) => {
  const counts = await webhookQueue.getJobCounts('waiting', 'active', 'completed', 'failed', 'delayed');
  res.json(counts);
});

router.get('/failed', async (_req: Request, res: Response) => {
  const jobs = await webhookQueue.getJobs(['failed'], 0, 49);
  const failed = await Promise.all(
    jobs.map(async (job) => ({
      jobId: job.id,
      data: job.data,
      failedReason: job.failedReason,
      attemptsMade: job.attemptsMade,
      timestamp: job.timestamp,
    }))
  );
  res.json(failed);
});

router.post('/retry/:jobId', async (req: Request, res: Response) => {
  try {
    const job = await Job.fromId(webhookQueue, req.params.jobId);
    if (!job) {
      res.status(404).json({ error: 'Job not found' });
      return;
    }
    await job.retry();
    res.json({ message: 'Job requeued' });
  } catch {
    res.status(500).json({ error: 'Failed to retry job' });
  }
});

const VALID_BROWSE_STATES = ['waiting', 'active', 'delayed'] as const;
type BrowseState = typeof VALID_BROWSE_STATES[number];

router.get('/jobs', async (req: Request, res: Response) => {
  const state = req.query.state as string;
  if (!VALID_BROWSE_STATES.includes(state as BrowseState)) {
    res.status(400).json({ error: `Invalid state. Must be one of: ${VALID_BROWSE_STATES.join(', ')}` });
    return;
  }
  const jobs = await webhookQueue.getJobs([state as BrowseState], 0, 49);
  const result = jobs.map((job) => ({
    jobId: job.id,
    data: job.data,
    failedReason: job.failedReason ?? null,
    attemptsMade: job.attemptsMade,
    timestamp: job.timestamp,
    maxAttempts: job.opts?.attempts ?? null,
    state,
  }));
  res.json(result);
});

router.delete('/failed/:jobId', async (req: Request, res: Response) => {
  const job = await Job.fromId(webhookQueue, req.params.jobId);
  if (!job) {
    res.status(404).json({ error: 'Job not found' });
    return;
  }
  await job.remove();
  res.status(204).send();
});

router.delete('/failed', async (_req: Request, res: Response) => {
  const jobs = await webhookQueue.getJobs(['failed'], 0, 999);
  await Promise.all(jobs.map((j) => j.remove()));
  res.json({ removed: jobs.length });
});

export default router;
