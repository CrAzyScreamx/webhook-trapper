---
title: Webhook Logging & Inspection
type: feature
layer: backend
keywords: [logs, inspect, history, search, filter, pagination]
---

# Webhook Logging & Inspection

Captures and stores detailed records of all incoming webhooks, their processing status, and forwarding outcomes. Users can browse, search, and inspect logs.

## Dependencies

**Tools / services needed:** SQLite
**Dependent features:** [[Webhook Ingestion]], [[Webhook Forwarding]]
**Packages:** drizzle-orm

## Files

| File | Role | Likely to edit? |
|------|------|-----------------|
| `server/src/routes/logs.ts` | List, search, and detail endpoints for logs | Sometimes |
| `server/src/models/WebhookLog.ts` | Log type definition | Rarely |
| `server/src/schema.ts` | webhookLogs table schema | Rarely |
| `client/src/pages/TrapperDetail.tsx` | Displays logs for a specific trapper | Sometimes |
| `client/src/components/JsonViewer.tsx` | Pretty-print JSON payloads and headers | Rarely |

## Understanding

**logs.ts** — API endpoints for listing logs (with pagination), filtering by trapperId/status/date range, and fetching a single log detail. Supports search/sort.

**WebhookLog model** — Represents a single webhook event: id, trapperId, timestamp, sourceIp, method, headers (JSON), payload (JSON), status (SENT/FILTERED/REJECTED), responseCode (from destination), latency (ms), errorMessage.

**webhookLogs table** — Indexed by trapperId and timestamp for fast queries.

**TrapperDetail.tsx** — Shows paginated logs for a trapper. Allows filtering by status and date range.

**JsonViewer.tsx** — Displays JSON with syntax highlighting and tree navigation. Used to inspect both incoming payloads and destination response bodies.
