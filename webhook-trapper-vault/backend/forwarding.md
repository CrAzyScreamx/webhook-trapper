---
title: Webhook Forwarding & Retry
type: feature
layer: backend
keywords: [forward, destination, retry, exponential backoff, queue, job processing]
---

# Webhook Forwarding & Retry

Asynchronously forwards webhooks to configured destination URLs. Applies filter rules; if rejected, logs status as FILTERED. If passing, sends to destination with configured authentication headers. Implements retry logic on failure with exponential backoff.

## Dependencies

**Tools / services needed:** BullMQ, Redis, SQLite
**Dependent features:** [[Webhook Ingestion]], [[Filter Rules]]
**Packages:** bullmq, axios, ioredis

## Files

| File | Role | Likely to edit? |
|------|------|-----------------|
| `server/src/queue/webhookQueue.ts` | BullMQ queue definition | Rarely |
| `server/src/queue/webhookWorker.ts` | Worker processing queued webhooks | Sometimes |
| `server/src/services/forwarder.ts` | HTTP request & retry logic | Sometimes |
| `server/src/services/templateEngine.ts` | Payload transformation/templating | Sometimes |

## Understanding

**webhookQueue.ts** — Defines the BullMQ job queue for "webhook" jobs. Each job contains the webhook log ID and payload to forward.

**webhookWorker.ts** — Spawned by the server (see index.ts line 16). Continuously pulls jobs from the queue and processes them. On each job, fetches the trapper config, evaluates filter rules, and calls forwarder.

**forwarder.ts** — Makes HTTP POST request to the destination URL with configured auth headers (Bearer token, custom header, etc.). Captures response code and latency. On failure (5xx, timeout), the BullMQ job is automatically retried with exponential backoff up to a configured max. Updates the webhook log with final status and response code.

**templateEngine.ts** — If the trapper has payload override enabled, optionally transforms the payload before forwarding (e.g., extracting fields or reformatting).

Design note: Forwarding is fire-and-forget from the ingestion endpoint's perspective. The BullMQ worker runs independently and can handle network outages gracefully via retries.
