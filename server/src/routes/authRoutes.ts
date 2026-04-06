import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { requireJwt } from '../middleware/jwtAuth';

const router = Router();

router.post('/login', async (req: Request, res: Response): Promise<void> => {
  const { username, password } = req.body;

  if (!username || !password) {
    res.status(400).json({ error: 'Username and password required' });
    return;
  }

  if (username !== process.env.ADMIN_USERNAME) {
    res.status(401).json({ error: 'Invalid credentials' });
    return;
  }

  const valid = await bcrypt.compare(password, process.env.ADMIN_PASSWORD_HASH!);
  if (!valid) {
    res.status(401).json({ error: 'Invalid credentials' });
    return;
  }

  const token = jwt.sign({ username }, process.env.JWT_SECRET!, { expiresIn: '24h' });
  res.json({ token });
});

router.post('/logout', (_req: Request, res: Response): void => {
  res.status(200).json({ message: 'Logged out' });
});

router.get('/me', requireJwt, (req: Request, res: Response): void => {
  res.json({ username: req.user!.username });
});

export default router;
