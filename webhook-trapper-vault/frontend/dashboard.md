---
title: Dashboard & Real-Time Feed
type: feature
layer: frontend
keywords: [dashboard, live feed, SSE, real-time, statistics, charts]
---

# Dashboard & Real-Time Feed

Landing page showing a live-updating feed of incoming webhooks, traffic statistics, and status breakdown charts.

## Dependencies

**Tools / services needed:** Server-Sent Events (SSE)
**Dependent features:** [[Statistics & Metrics]], [[Webhook Logging]]
**Packages:** react, @mui/x-charts, axios

## Files

| File | Role | Likely to edit? |
|------|------|-----------------|
| `client/src/pages/Dashboard.tsx` | Dashboard page | Sometimes |
| `client/src/components/StatCard.tsx` | Stat cards (count widgets) | Rarely |
| `client/src/components/LiveDot.tsx` | Indicator for live data streaming | Rarely |

## Understanding

**Dashboard.tsx** — Fetches initial stats and logs, renders stat cards, bar chart of webhook statuses, and opens an EventSource connection to `/api/sse/feed` for real-time updates. Appends new logs to the feed as they arrive.

**StatCard.tsx** — Simple card component displaying a stat name and numeric count.

**LiveDot.tsx** — Small animated indicator showing that the SSE connection is active and receiving live updates.
