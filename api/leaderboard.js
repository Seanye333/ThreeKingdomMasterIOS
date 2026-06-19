// 全球排行榜 — a backend-free-until-you-want-it leaderboard for the
// daily challenge, running as a Vercel serverless function over Vercel
// KV (Upstash Redis). Falls back gracefully: if KV env vars aren't set,
// it returns an empty board with `kvConfigured: false` so the client
// quietly stays local-only. Enable it by adding a Vercel KV/Upstash
// integration to the project — no code change required.
//
// GET  /api/leaderboard?date=YYYY-MM-DD            → top 50 of the day
// POST /api/leaderboard  { date, name, seasons }   → submit a victory
//
// Scores are seasons-to-unify (lower is better); one best entry per name.

const KV_URL = process.env.KV_REST_API_URL;
const KV_TOKEN = process.env.KV_REST_API_TOKEN;
const CONFIGURED = !!(KV_URL && KV_TOKEN);
const MAX_ROWS = 50;

async function kv(command) {
  const res = await fetch(KV_URL, {
    method: 'POST',
    headers: { Authorization: `Bearer ${KV_TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(command),
  });
  if (!res.ok) throw new Error(`kv ${res.status}`);
  const json = await res.json();
  return json.result;
}

function safeDate(d) {
  return typeof d === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(d) ? d : null;
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(204).end();

  if (!CONFIGURED) {
    return res.status(200).json({ kvConfigured: false, rows: [] });
  }

  try {
    if (req.method === 'GET') {
      const date = safeDate(req.query.date);
      if (!date) return res.status(400).json({ error: 'bad date' });
      // Sorted set: member = name, score = seasons (asc = better).
      const flat = await kv(['ZRANGE', `lb:${date}`, '0', String(MAX_ROWS - 1), 'WITHSCORES']);
      const rows = [];
      for (let i = 0; i < (flat?.length ?? 0); i += 2) {
        rows.push({ name: flat[i], seasons: Number(flat[i + 1]) });
      }
      return res.status(200).json({ kvConfigured: true, rows });
    }

    if (req.method === 'POST') {
      const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body ?? {});
      const date = safeDate(body.date);
      const seasons = Number(body.seasons);
      let name = String(body.name ?? '').trim().slice(0, 16) || '無名';
      if (!date || !Number.isFinite(seasons) || seasons <= 0 || seasons > 100000) {
        return res.status(400).json({ error: 'bad submission' });
      }
      // Keep only the player's best (lowest) — read current, write if better.
      const cur = await kv(['ZSCORE', `lb:${date}`, name]);
      if (cur == null || seasons < Number(cur)) {
        await kv(['ZADD', `lb:${date}`, String(seasons), name]);
        await kv(['EXPIRE', `lb:${date}`, String(60 * 60 * 24 * 30)]); // 30-day TTL
      }
      const flat = await kv(['ZRANGE', `lb:${date}`, '0', String(MAX_ROWS - 1), 'WITHSCORES']);
      const rows = [];
      for (let i = 0; i < (flat?.length ?? 0); i += 2) rows.push({ name: flat[i], seasons: Number(flat[i + 1]) });
      const rank = rows.findIndex((r) => r.name === name);
      return res.status(200).json({ kvConfigured: true, rows, rank: rank >= 0 ? rank + 1 : null });
    }

    return res.status(405).json({ error: 'method' });
  } catch (e) {
    return res.status(200).json({ kvConfigured: false, rows: [], error: String(e) });
  }
}
