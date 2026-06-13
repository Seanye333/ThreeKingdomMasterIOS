/**
 * 排行榜 client — talks to /api/leaderboard when it's reachable, and
 * degrades to silence when it isn't (the serverless function returns
 * kvConfigured:false until a KV store is attached, and a missing API
 * just rejects). The game is fully playable either way; the board is
 * pure cream on top.
 */
export interface LeaderRow {
  name: string;
  seasons: number;
}

export interface LeaderboardResponse {
  kvConfigured: boolean;
  rows: LeaderRow[];
  rank?: number | null;
}

const NAME_KEY = 'tkm-leaderboard-name';

export function savedPlayerName(): string {
  try {
    return localStorage.getItem(NAME_KEY) ?? '';
  } catch {
    return '';
  }
}

export function savePlayerName(name: string): void {
  try {
    localStorage.setItem(NAME_KEY, name.trim().slice(0, 16));
  } catch { /* quota */ }
}

async function call(method: 'GET' | 'POST', body?: unknown, query?: string): Promise<LeaderboardResponse | null> {
  try {
    const res = await fetch(`/api/leaderboard${query ?? ''}`, {
      method,
      headers: body ? { 'Content-Type': 'application/json' } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    });
    if (!res.ok) return null;
    return (await res.json()) as LeaderboardResponse;
  } catch {
    return null; // offline, no backend, or KV off — caller shows local only
  }
}

export function fetchLeaderboard(date: string): Promise<LeaderboardResponse | null> {
  return call('GET', undefined, `?date=${encodeURIComponent(date)}`);
}

export function submitScore(date: string, name: string, seasons: number): Promise<LeaderboardResponse | null> {
  savePlayerName(name);
  return call('POST', { date, name: name.trim().slice(0, 16) || '無名', seasons });
}
