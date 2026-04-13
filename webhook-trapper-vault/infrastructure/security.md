---
title: Security & Rate Limiting
type: feature
layer: infrastructure
keywords: [security, rate limit, HMAC, TLS, helmet, CORS, authentication]
---

# Security & Rate Limiting

Implements authentication, rate limiting, HMAC signature verification, and security headers.

## Dependencies

**Tools / services needed:** Redis (for rate limit tracking)
**Packages:** helmet, cors, express-rate-limit, rate-limit-redis, jsonwebtoken, bcryptjs

## Files

| File | Role | Likely to edit? |
|------|------|-----------------|
| `server/src/middleware/rateLimiter.ts` | Global and per-trapper rate limiting | Sometimes |
| `server/src/middleware/jwtAuth.ts` | JWT verification for protected routes | Rarely |
| `server/src/routes/ingest.ts` | HMAC signature verification | Rarely |
| `server/src/index.ts` | Helmet and CORS setup | Rarely |

## Understanding

**rateLimiter.ts** — Uses `express-rate-limit` with a Redis store for distributed rate limiting. Enforces:
- Global rate limit on all endpoints (to prevent abuse)
- Per-trapper rate limit on ingestion endpoint (configurable per trapper)

**jwtAuth.ts** — Middleware checking for JWT in Authorization header. Verifies token signature and expiry. Rejects with 401 if invalid.

**ingest.ts** — Supports HMAC-SHA256 signature verification for webhook authenticity. If trapper has hmacSecret configured, verifies the X-Signature header against raw payload.

**index.ts** — Uses Helmet for security headers (CSP, X-Frame-Options, etc.) and CORS for cross-origin requests.
