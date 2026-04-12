# ── Stage 1: Build the React client ─────────────────────────────────────────
FROM node:20-alpine AS client-builder

WORKDIR /app/client
COPY client/package*.json ./
RUN npm ci
COPY client/ ./
RUN npm run build

# ── Stage 2: Build the Express server ────────────────────────────────────────
FROM node:20-alpine AS server-builder

# sqlite3 needs native compilation tools
RUN apk add --no-cache python3 make g++

WORKDIR /app/server
COPY server/package*.json ./
RUN npm ci
COPY server/ ./
RUN npm run build && npm prune --production

# ── Stage 3: Production image ─────────────────────────────────────────────────
FROM node:20-alpine AS production

# sqlite3 runtime needs these shared libs (already present in node:alpine, but
# make explicit so the layer is self-documenting)
RUN apk add --no-cache python3 make g++

WORKDIR /app

# Server runtime
COPY --from=server-builder /app/server/dist    ./server/dist
COPY --from=server-builder /app/server/node_modules ./server/node_modules
COPY --from=server-builder /app/server/package.json ./server/package.json

# Built React client — Express will serve this as static files
COPY --from=client-builder /app/client/dist   ./client/dist

# SQLite database lives here; mount a volume so data persists across restarts
RUN mkdir -p /app/data
VOLUME ["/app/data"]

ENV NODE_ENV=production \
    PORT=3001 \
    REDIS_URL=redis://redis:6379 \
    JWT_SECRET= \
    ADMIN_USERNAME=admin \
    ADMIN_PASSWORD=

EXPOSE 3001

WORKDIR /app/server
CMD ["node", "dist/index.js"]
