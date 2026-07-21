/**
 * 門生故吏 (§3.8) — the man who put you forward owns a piece of you.
 *
 * 舉薦 already surfaces hidden talent (§3.1): 徐庶薦諸葛亮, 荀彧薦郭嘉. What the
 * game then forgot is the half of the institution that made 察舉 dangerous as
 * well as useful — **the recommender remained the recommended man's 舉主 for
 * life**. 門生故吏遍天下 is the phrase used of the Yuan, and it is a description
 * of a *military asset*: four generations of recommendations meant that when
 * 袁紹 raised a banner, other men's officers came with him.
 *
 * So a recommendation now leaves a mark: `Officer.patronId`. What it does:
 *
 *   — 主辱臣憂: a client's loyalty tracks his patron's. A disaffected patron
 *     quietly disaffects his clients, wherever they are posted;
 *   — 故吏相隨: when a patron breaks away, his clients in the same city are
 *     pulled with him *before* the ordinary shaky-loyalty sympathisers, and a
 *     client will follow at a loyalty that would never have moved him alone;
 *   — and the reverse: a patron kept honoured and content is worth a standing
 *     loyalty bonus across everyone he ever named.
 *
 * Pure. resolution.ts drifts the loyalties; ambition.ts asks who follows.
 */
import type { EntityId, Officer } from '../types';

/** Patron loyalty at or below which the whole client network starts to sour. */
export const PATRON_SOUR = 45;
/** …and at or above which it firms up. */
export const PATRON_CONTENT = 80;

/**
 * 主辱臣憂 — the per-season loyalty drift a client takes from his patron's
 * standing. Zero when the patron is merely ordinary, so this is only ever
 * felt at the extremes.
 */
export function patronDrift(args: {
  patron?: Officer;
  client: Officer;
}): number {
  const p = args.patron;
  if (!p || p.status === 'dead') return 0;
  // Only while they serve the same lord — a patron who went elsewhere pulls
  // (see followsPatron) rather than drifts.
  if (p.forceId !== args.client.forceId) return 0;
  if (p.id === args.client.id) return 0;
  if (p.loyalty <= PATRON_SOUR) return -1;
  if (p.loyalty >= PATRON_CONTENT) return 0.5;
  return 0;
}

/**
 * 故吏相隨 — will this client follow his patron out?
 *
 * Deliberately a far lower bar than ordinary sympathy: the tie is an obligation,
 * not an opinion. A client of high personal loyalty still resists; a 忠 officer
 * never moves at all.
 */
export function followsPatron(args: {
  client: Officer;
  /** Same city as the departing patron (a distant client cannot simply walk). */
  sameCity: boolean;
  /** Client bears the 忠義 temperament. */
  steadfast?: boolean;
}): boolean {
  if (args.steadfast) return false;
  if (!args.sameCity) return false;
  if (args.client.status !== 'idle' && args.client.status !== 'active') return false;
  // 60 vs the ordinary sympathiser's 45 — obligation reaches further than discontent.
  return args.client.loyalty < 60;
}

/** Everyone this officer ever put forward, among the given corps. */
export function clientsOf(patronId: EntityId, officers: Record<EntityId, Officer>): Officer[] {
  return Object.values(officers).filter((o) => o.patronId === patronId && o.id !== patronId);
}

/** 門生故吏遍天下 — how wide a net one officer has spun. */
export function patronageReach(patronId: EntityId, officers: Record<EntityId, Officer>): {
  clients: number;
  sameForce: number;
  zh: string;
  en: string;
} {
  const clients = clientsOf(patronId, officers);
  const patron = officers[patronId];
  const sameForce = clients.filter((c) => c.forceId === patron?.forceId).length;
  const zh = clients.length >= 5 ? '門生故吏遍天下'
    : clients.length >= 2 ? '門生故吏' : clients.length === 1 ? '有所舉薦' : '未嘗舉士';
  const en = clients.length >= 5 ? 'Clients everywhere'
    : clients.length >= 2 ? 'A following of clients' : clients.length === 1 ? 'One client' : 'No clients';
  return { clients: clients.length, sameForce, zh, en };
}
