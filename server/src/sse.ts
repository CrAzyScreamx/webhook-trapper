import { Response } from 'express';

interface SSEClient {
  trapperId: string | null; // null = global feed
  res: Response;
}

const clients: SSEClient[] = [];

export function addClient(trapperId: string | null, res: Response): void {
  clients.push({ trapperId, res });
}

export function removeClient(res: Response): void {
  const idx = clients.findIndex((c) => c.res === res);
  if (idx !== -1) clients.splice(idx, 1);
}

export function emit(trapperId: string, data: unknown): void {
  const payload = `data: ${JSON.stringify(data)}\n\n`;
  for (const client of clients) {
    if (client.trapperId === null || client.trapperId === trapperId) {
      client.res.write(payload);
    }
  }
}
