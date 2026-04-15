# Waha Trapper

A self-hosted webhook relay — receive webhooks on a unique ingest URL, apply filter rules, and forward them to one or more destination URLs. Built with React + MUI on the frontend and Express + SQLite + BullMQ on the backend, shipped as a single Docker image.

---

## Features

- **Trappers** — each trapper gets a unique ingest URL (`POST /api/h/:trapId`) that receives and processes webhooks
- **Multi-destination forwarding** — attach multiple destination URLs to a single trapper
- **Delivery modes**
  - `broadcast` — forward to all destinations simultaneously
  - `fallback` — try destinations in order, moving to the next only if the previous fails
- **Filter rules** — evaluate incoming payloads with field-path operators (`equals`, `contains`, `matches`, `gt`, `in`, `has_key`, …) and AND/OR logic with grouping support
- **Payload override / template engine** — rewrite the forwarded payload using a JSON template that can reference fields from the original payload
- **HMAC signature verification** — validate incoming webhooks with a shared secret before forwarding
- **Authentication on destinations** — Bearer token, Basic auth, custom header, or none
- **Retry policies** — `none`, `immediate` (3 attempts, no delay), or `exponential` (3 attempts, 1 s base delay)
- **Per-trapper rate limiting** — cap how many requests a trapper accepts per time window
- **Queue dashboard** — inspect the BullMQ job queue in real time
- **Live log stream** — SSE-powered log feed per trapper, no polling needed
- **JWT-protected admin API** — all management endpoints require a signed token

---

## Quick Start

### With Docker Compose

1. Copy the example env file and fill in the required values:

   ```bash
   cp .env.example .env
   ```

2. Start the stack:

   ```bash
   docker compose up -d
   ```

3. Open `http://localhost:3001` and log in with your `ADMIN_USERNAME` / `ADMIN_PASSWORD`.

### Running Locally (dev mode)

```bash
# Install dependencies
cd server && npm install
cd ../client && npm install

# Start Redis (required for the queue)
docker run -d -p 6379:6379 redis:7-alpine

# Start server (watches for changes)
cd server && npm run dev

# Start client (in a second terminal)
cd client && npm run dev
```

---

## Environment Variables

| Variable | Required | Default | Description |
|---|---|---|---|
| `PORT` | No | `3001` | Port the HTTP server listens on |
| `REDIS_URL` | No | `redis://redis:6379` | BullMQ / Redis connection string |
| `JWT_SECRET` | **Yes** | — | Secret used to sign JWT tokens. Use a long random string. |
| `ADMIN_USERNAME` | No | `admin` | Login username |
| `ADMIN_PASSWORD` | **Yes** | — | Plain-text login password. Hashed with bcrypt at startup. |
| `NODE_ENV` | No | — | Set to `production` to serve the bundled React client |

### Generating a strong JWT secret

```bash
openssl rand -hex 32
```

---

## Docker Compose Reference

```yaml
services:
  redis:
    image: redis:7-alpine

  app:
    image: ghcr.io/<your-org>/waha-trapper:latest
    ports:
      - "3001:3001"
    depends_on:
      - redis
    environment:
      JWT_SECRET: <your-secret>
      ADMIN_USERNAME: admin
      ADMIN_PASSWORD: <your-password>
    volumes:
      - app-data:/app/data   # SQLite database persisted here

volumes:
  app-data:
```

---

## Webhook Ingest URL

Every trapper exposes a public ingest endpoint:

```
POST /api/h/:trapId
Content-Type: application/json
```

The `:trapId` is the unique slug you set when creating the trapper. Send any JSON body — the trapper will validate the signature (if configured), evaluate the filter rules, and enqueue delivery.

---

## API Overview

All routes except `/api/auth/login` and `/api/h/:trapId` require a `Authorization: Bearer <token>` header.

| Method | Path | Description |
|---|---|---|
| `POST` | `/api/auth/login` | Get a JWT token |
| `GET` | `/api/trappers` | List all trappers |
| `POST` | `/api/trappers` | Create a trapper |
| `GET` | `/api/trappers/:id` | Get a trapper |
| `PUT` | `/api/trappers/:id` | Update a trapper |
| `DELETE` | `/api/trappers/:id` | Delete a trapper |
| `PATCH` | `/api/trappers/:id/status` | Pause or activate |
| `GET` | `/api/trappers/:id/rules` | Get filter rules |
| `PUT` | `/api/trappers/:id/rules` | Replace all filter rules |
| `POST` | `/api/trappers/:id/test` | Test rules + forward against a sample payload |
| `GET` | `/api/trappers/:id/destinations` | List destinations |
| `POST` | `/api/trappers/:id/destinations` | Add a destination |
| `PUT` | `/api/trappers/:id/destinations/:destId` | Update a destination |
| `DELETE` | `/api/trappers/:id/destinations/:destId` | Delete a destination |
| `GET` | `/api/logs` | Paginated log list |
| `GET` | `/api/stats` | Delivery statistics |
| `GET` | `/api/queue` | Queue stats |
| `GET` | `/api/sse/:trapperId` | Live log stream (SSE) |
| `GET` | `/api/health` | Health check |

---

## Project Structure

```
waha-trapper/
├── .github/
│   └── workflows/
│       └── docker-publish.yml   # Build & push image to GHCR on version tag
├── client/                      # React + MUI frontend (Vite)
│   └── src/
│       ├── api/                 # Axios API client
│       ├── components/          # Shared UI components
│       ├── hooks/               # Custom React hooks
│       ├── pages/               # Route-level page components
│       │   ├── Dashboard.tsx
│       │   ├── Trappers.tsx
│       │   ├── TrapperDetail.tsx
│       │   ├── FilterConfig.tsx
│       │   ├── WebhookListener.tsx
│       │   └── QueueDashboard.tsx
│       ├── theme/               # MUI theme configuration
│       └── utils/
├── server/                      # Express + TypeScript backend
│   └── src/
│       ├── index.ts             # App entry point, route wiring
│       ├── db.ts                # Drizzle ORM + SQLite setup
│       ├── schema.ts            # Table definitions and inferred types
│       ├── sse.ts               # Server-Sent Events emitter
│       ├── middleware/
│       │   ├── jwtAuth.ts       # JWT verification middleware
│       │   └── rateLimiter.ts   # Global + per-trapper rate limiting
│       ├── models/              # Shared type models
│       ├── queue/
│       │   ├── connection.ts    # IORedis client singleton
│       │   ├── webhookQueue.ts  # BullMQ queue + job options
│       │   └── webhookWorker.ts # Job processor + fallback chain logic
│       ├── routes/
│       │   ├── authRoutes.ts    # Login / logout / me
│       │   ├── trappers.ts      # Trapper CRUD + rules + test
│       │   ├── destinations.ts  # Destination CRUD (nested under trappers)
│       │   ├── ingest.ts        # Webhook ingest endpoint
│       │   ├── logs.ts          # Log queries
│       │   ├── stats.ts         # Aggregated statistics
│       │   ├── sseRoutes.ts     # SSE live feed
│       │   └── queueRoutes.ts   # Queue inspection
│       └── services/
│           ├── filterEngine.ts  # Rule evaluation logic
│           ├── forwarder.ts     # HTTP forwarding with auth
│           └── templateEngine.ts # Payload override templating
├── Dockerfile                   # Multi-stage build (client → server → production)
├── docker-compose.yml
└── README.md
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, MUI v5, Vite, TypeScript |
| Backend | Node.js 20, Express, TypeScript |
| Database | SQLite via Drizzle ORM (better-sqlite3) |
| Queue | BullMQ backed by Redis |
| Auth | bcryptjs (password hashing) + jsonwebtoken |
| Container | Docker multi-stage build, published to GHCR |
