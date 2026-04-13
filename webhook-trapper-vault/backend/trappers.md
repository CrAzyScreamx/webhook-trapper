---
title: Webhook Trappers (Listeners)
type: feature
layer: backend
keywords: [webhook, trapper, listener, destination, ingestion, HMAC, TLS]
---

# Webhook Trappers (Listeners)

Core feature: Create named webhook endpoints that accept incoming webhooks, log them, apply filter rules, and forward to configured destinations.

## Dependencies

**Tools / services needed:** SQLite, Redis, BullMQ
**Dependent features:** [[Webhook Ingestion]], [[Webhook Forwarding]], [[Filter Rules]], [[Webhook Logging]]
**Packages:** drizzle-orm, better-sqlite3, axios

## Files

| File | Role | Likely to edit? |
|------|------|-----------------|
| `server/src/routes/trappers.ts` | CRUD endpoints for trappers | Sometimes |
| `server/src/models/Trapper.ts` | Data model / type definitions | Rarely |
| `server/src/schema.ts` | SQLite schema (trappers table) | Rarely |
| `client/src/pages/Trappers.tsx` | List/manage trappers | Sometimes |
| `client/src/pages/TrapperDetail.tsx` | Edit single trapper | Sometimes |

## Understanding

**trappers.ts** — API endpoints for create, read, update, delete trappers. Each trapper has a unique `trapId` that forms the public webhook URL (`/api/h/<trapId>`). Trappers store destination URL, auth headers, rate limits, HMAC secrets for signature verification, and retry policies.

**Trapper model** — Defines the trapper's properties: name, description, destination URL, authentication type (none/bearer/custom header), rate limit settings, HMAC verification details, payload override toggles, and TLS verification flag.

**trappers table in schema.ts** — SQLite table storing all trapper configurations. Note the separation: `id` (internal UUID) and `trapId` (public-facing webhook identifier).

**Trappers.tsx** — UI for browsing active trappers, creating new ones, viewing stats per trapper.

**TrapperDetail.tsx** — Edit view for a single trapper. Allows changing destination, auth, rate limits, and filter rules.
