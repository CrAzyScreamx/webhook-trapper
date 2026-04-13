---
title: Queue Management & Monitoring
type: feature
layer: backend
keywords: [queue, BullMQ, job status, pending, processing, failed, retry]
---

# Queue Management & Monitoring

Provides visibility into the BullMQ job queue. Users can inspect queued/processing/failed webhook jobs and manually retry failed jobs.

## Dependencies

**Tools / services needed:** Redis, BullMQ
**Dependent features:** [[Webhook Forwarding]]
**Packages:** bullmq, ioredis

## Files

| File | Role | Likely to edit? |
|------|------|-----------------|
| `server/src/routes/queueRoutes.ts` | Queue status and retry endpoints | Sometimes |
| `client/src/pages/QueueDashboard.tsx` | UI showing queue stats and job list | Sometimes |

## Understanding

**queueRoutes.ts** — Exposes the queue state via API: counts of pending, active, completed, failed jobs. Also provides endpoints to get job details and manually retry a failed job.

**QueueDashboard.tsx** — Displays real-time queue metrics (pending count, active count, failed count) and a list of recent jobs with their status. Links to specific webhook logs.
