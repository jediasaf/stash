// Encrypted sync storage. The browser encrypts everything with a key derived from the sync code
// before sending it, so this function only ever sees ciphertext. Blobs are private (token-only).
import { put, get, del } from '@vercel/blob';

const ID = /^[a-f0-9]{64}$/;          // SHA-256 of the sync code, never the code itself
const MAX = 2 * 1024 * 1024;          // 2 MB per copy

export default async function handler(req, res) {
  const id = String(req.query.id || '');
  if (!ID.test(id)) return res.status(400).json({ error: 'Bad sync id' });
  const path = `sync/${id}.json`;
  res.setHeader('Cache-Control', 'no-store');
  try {
    if (req.method === 'PUT') {
      const body = typeof req.body === 'string' ? req.body : JSON.stringify(req.body || {});
      if (body.length > MAX) return res.status(413).json({ error: 'Too large to sync' });
      const parsed = JSON.parse(body);
      if (!parsed.iv || !parsed.data || !parsed.updatedAt) return res.status(400).json({ error: 'Expected an encrypted payload' });
      await put(path, body, { access: 'private', addRandomSuffix: false, allowOverwrite: true, contentType: 'application/json' });
      return res.status(200).json({ ok: true, updatedAt: parsed.updatedAt });
    }
    if (req.method === 'GET') {
      const r = await get(path, { access: 'private', useCache: false });
      if (!r) return res.status(404).json({ error: 'No copy for this code' });
      const text = await new Response(r.stream).text();
      return res.status(200).setHeader('Content-Type', 'application/json').send(text);
    }
    if (req.method === 'DELETE') { await del(path); return res.status(200).json({ ok: true }); }
    res.setHeader('Allow', 'GET, PUT, DELETE');
    return res.status(405).json({ error: 'Use GET, PUT or DELETE' });
  } catch (e) {
    return res.status(500).json({ error: 'Sync storage failed', detail: String(e.message || e) });
  }
}
