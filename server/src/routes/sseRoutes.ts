import { Router, Request, Response } from 'express';
import { addClient, removeClient } from '../sse';

const router = Router();

function setupSSE(req: Request, res: Response, trapperId: string | null): void {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  addClient(trapperId, res);

  req.on('close', () => {
    removeClient(res);
  });
}

// GET /api/sse/feed — global
router.get('/feed', (req: Request, res: Response) => {
  setupSSE(req, res, null);
});

// GET /api/sse/:trapperId — per-trapper
router.get('/:trapperId', (req: Request, res: Response) => {
  setupSSE(req, res, req.params.trapperId);
});

export default router;
