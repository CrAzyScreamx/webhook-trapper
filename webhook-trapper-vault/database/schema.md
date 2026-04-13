---
title: Database Schema & ORM
type: feature
layer: database
keywords: [SQLite, schema, table, drizzle, migration]
---

# Database Schema & ORM

Defines the SQLite database schema using Drizzle ORM. Tables for trappers, filter rules, and webhook logs.

## Dependencies

**Tools / services needed:** SQLite
**Packages:** drizzle-orm, better-sqlite3

## Files

| File | Role | Likely to edit? |
|------|------|-----------------|
| `server/src/schema.ts` | Drizzle table definitions | Sometimes |
| `server/src/db.ts` | Database connection and initialization | Rarely |
| `server/src/index.ts` | Database initialization on server startup | Rarely |

## Understanding

**schema.ts** — Defines three Drizzle tables:
- **trappers** — Configuration for each webhook listener. PK: id. Unique constraint on trapId.
- **filterRules** — Filter conditions per trapper. Multiple rules per trapper. Ordered and grouped with AND/OR logic.
- **webhookLogs** — Audit log of all webhooks received. Indexed by trapperId and timestamp.

**db.ts** — Establishes connection to SQLite database (default: `data/app.db`) and exports drizzle client for queries.

**index.ts** — Calls `initDb()` at startup to initialize the database (create tables if they don't exist).

Key design: Uses Drizzle ORM for type-safe queries. No separate migration files; schema is defined in code and drizzle manages creation.
