import 'dotenv/config';
import path from 'path';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { initDb } from './db';
import trappersRouter from './routes/trappers';
import logsRouter from './routes/logs';
import statsRouter from './routes/stats';
import ingestRouter from './routes/ingest';
import sseRouter from './routes/sseRoutes';
import authRoutes from './routes/authRoutes';
import queueRoutes from './routes/queueRoutes';
import { requireJwt } from './middleware/jwtAuth';
import { globalRateLimiter } from './middleware/rateLimiter';
import './queue/webhookWorker';

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3001;

app.use(helmet({ hsts: false }));
app.use(cors());
app.use(globalRateLimiter);

// Ingest route needs raw body for HMAC verification — must come before express.json()
app.use('/api/h', express.raw({ type: 'application/json', limit: '1mb' }), ingestRouter);

// Global JSON parser for all other routes
app.use(express.json({ limit: '1mb' }));

// Public routes
app.use('/api/auth', authRoutes);

// Protected routes
app.use('/api/trappers', requireJwt, trappersRouter);
app.use('/api/logs', requireJwt, logsRouter);
app.use('/api/stats', requireJwt, statsRouter);
app.use('/api/queue', requireJwt, queueRoutes);
// SSE uses query param for auth since EventSource doesn't support headers
app.use('/api/sse', sseRouter);

// Trapper-scoped logs nested route
app.use('/api', requireJwt, logsRouter);

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

// Serve React client in production
if (process.env.NODE_ENV === 'production') {
  const clientDist = path.join(__dirname, '../../client/dist');
  app.use(express.static(clientDist));
  app.get('*', (_req, res) => {
    res.sendFile(path.join(clientDist, 'index.html'));
  });
}

function start() {
  initDb();
  console.log('Database initialized');
  app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
}

start();
