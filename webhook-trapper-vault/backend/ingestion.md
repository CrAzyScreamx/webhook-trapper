---
title: Webhook Ingestion
type: feature
layer: backend
keywords: [ingest, webhook, public endpoint, rate limit, HMAC verification, payload]
---

# Webhook Ingestion

Handles incoming webhook requests on the public `/api/h/<trapId>` endpoint. Verifies HMAC signatures, validates rate limits, logs the request, and queues it for processing.

## Dependencies

**Tools / services needed:** BullMQ, SQLite
**Dependent features:** [[Webhook Trappers]], [[Webhook Logging]], [[Webhook Forwarding]]
**Packages:** axios, express (raw body middleware)

## Files

| File | Role | Likely to edit? |
|------|------|-----------------|
| `server/src/routes/ingest.ts` | Public webhook ingestion endpoint | Rarely |
| `server/src/middleware/rateLimiter.ts` | Global and per-trapper rate limiting | Sometimes |
| `server/src/schema.ts` | webhookLogs table schema | Rarely |

## Understanding

**ingest.ts** — Receives POST requests to `/api/h/<trapId>`. Performs HMAC signature verification if the trapper has a secret configured, checks rate limits, extracts source IP and headers, and inserts a log record into webhookLogs. Then enqueues the webhook to BullMQ for asynchronous forwarding/filtering.

**rateLimiter.ts** — Uses `express-rate-limit` with a Redis store for distributed rate limiting. Enforces both a global limit and per-trapper limits. Returns 429 if exceeded.

**webhookLogs table** — Stores incoming webhook details: trapperId, timestamp, source IP, HTTP method, headers (JSON), full payload (JSON), final status (SENT/FILTERED/REJECTED), response code from destination, latency, and any error message.

Key design: Uses express.raw() middleware to capture the raw body before JSON parsing, needed for HMAC verification which requires the original bytes.
