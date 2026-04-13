---
title: Statistics & Metrics
type: feature
layer: backend
keywords: [stats, metrics, count, today, processing]
---

# Statistics & Metrics

Aggregates and exposes webhook traffic statistics: total requests, filtered, sent, rejected, and breakdown by time period.

## Dependencies

**Tools / services needed:** SQLite
**Dependent features:** [[Webhook Logging]]
**Packages:** drizzle-orm

## Files

| File | Role | Likely to edit? |
|------|------|-----------------|
| `server/src/routes/stats.ts` | Statistics endpoints | Sometimes |
| `client/src/pages/Dashboard.tsx` | Displays stats widgets and charts | Sometimes |

## Understanding

**stats.ts** — Provides endpoints that query webhookLogs for counts grouped by status (SENT, FILTERED, REJECTED) and time periods (today, this week, all time). Used to populate dashboard cards and charts.

**Dashboard.tsx** — Shows a summary view: total webhooks today, status breakdown as bar chart, recent webhook feed (streaming via SSE). Uses the stats API to populate cards.
