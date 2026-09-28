import type { VercelRequest, VercelResponse } from '@vercel/node';
import { handleApiRequest } from '../src/server/api/router';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const method = req.method || 'GET';
  const url = req.url || '/api';
  const body = req.body;
  const headers = req.headers as Record<string, string>;

  const result = await handleApiRequest(method, url, body, headers);
  return res.status(result.status).json(result.body);
}
