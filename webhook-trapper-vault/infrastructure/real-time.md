---
title: Real-Time Updates via SSE
type: feature
layer: infrastructure
keywords: [SSE, Server-Sent Events, EventSource, live stream]
---

# Real-Time Updates via SSE

Server-Sent Events implementation for pushing live webhook logs to connected clients without polling.

## Dependencies

**Tools / services needed:** None (native HTTP)
**Packages:** express

## Files

| File | Role | Likely to edit? |
|------|------|-----------------|
| `server/src/routes/sseRoutes.ts` | SSE endpoint definitions | Rarely |
| `server/src/sse.ts` | SSE connection management and broadcasts | Rarely |

## Understanding

**sseRoutes.ts** — Defines `/api/sse/feed` endpoint. Accepts a token query param (since EventSource can't set headers), authenticates, and establishes a long-lived HTTP connection. Sends webhook logs as SSE messages as they arrive.

**sse.ts** — Manages open SSE connections. Exposes a `broadcast(log)` function called by the webhook worker whenever a log is created. Sends the log to all connected clients in real-time.

Design note: Clients can lose connection; reconnection is handled by the browser's EventSource API automatically. The server keeps a list of open connections and cleans up on disconnect.
