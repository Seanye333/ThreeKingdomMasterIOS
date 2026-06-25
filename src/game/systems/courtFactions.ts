import type { EntityId, Officer } from '../types';

export type FactionId = 'reformer' | 'eunuch' | 'gentry' | 'military';

export const FACTION_LABEL: Record<FactionId, { en: string; zh: string }> = {
  reformer: { en: 'Reformist', zh: '革新派' },
  eunuch:   { en: 'Inner Court', zh: '宦黨' },
  gentry:   { en: 'Gentry', zh: '門閥' },
  military: { en: 'Military', zh: '軍方' },
};

/**
 * Auto-assign a court faction to each officer based on their stat profile
 * and personality traits. Output is keyed by force, listing each officer
 * with their assigned faction. Officers without a clear lean are omitted.
 */
export function deriveCourtFactions(
  officers: Record<EntityId, Officer>,
  /** 門閥權重 — optional per-officer gentry lean from clan standing (世家). */
  clanWeight?: Record<EntityId, number>,
): Record<EntityId, Array<{ officerId: EntityId; faction: FactionId }>> {
  const out: Record<EntityId, Array<{ officerId: EntityId; faction: FactionId }>> = {};
  for (const o of Object.values(officers)) {
    if (!o.forceId || o.status === 'dead' || o.status === 'imprisoned') continue;
    const f = classify(o, clanWeight?.[o.id] ?? 0);
    if (!f) continue;
    if (!out[o.forceId]) out[o.forceId] = [];
    out[o.forceId].push({ officerId: o.id, faction: f });
  }
  return out;
}

function classify(o: Officer, clanWeight = 0): FactionId | null {
  const traits = o.traits ?? [];
  // Sycophant/manipulative/palace-creature officers gravitate to the inner court.
  if (traits.includes('sycophant') || traits.includes('cunning')
      || traits.includes('dark-political') || traits.includes('court-favorite')
      || traits.includes('smiling-tiger') || traits.includes('smiling-blade')) return 'eunuch';
  // Pure warriors (high war/lead, low politics) → military faction.
  if (o.stats.war >= 80 && o.stats.politics < 60) return 'military';
  if (o.stats.leadership >= 80 && o.stats.politics < 60) return 'military';
  // 世家門閥 — a scion of a great/gentry house with standing in the bureaucracy
  // reads as 門閥 even without the noble traits (家世自重).
  if (clanWeight >= 1 && o.stats.politics >= 60) return 'gentry';
  if (clanWeight >= 0.5 && o.stats.politics >= 70) return 'gentry';
  // Old-money politics + noble/haughty-leaning traits → gentry.
  if (o.stats.politics >= 75 && (traits.includes('noble') || traits.includes('arrogant')
      || traits.includes('refined') || traits.includes('haughty') || traits.includes('aloof'))) {
    return 'gentry';
  }
  // High intelligence + high politics → reformist; so do populists and the upright.
  if (o.stats.intelligence >= 80 && o.stats.politics >= 65) return 'reformer';
  if (traits.includes('benevolent') || traits.includes('honest-to-fault')
      || traits.includes('crowd-pleaser') || traits.includes('meritocratic')
      || traits.includes('hates-evil')) return 'reformer';
  return null;
}
