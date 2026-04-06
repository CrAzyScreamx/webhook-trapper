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

export default router;
