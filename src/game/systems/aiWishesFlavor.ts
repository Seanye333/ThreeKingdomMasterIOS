import type { EntityId, Force, Officer, ReportEntry } from '../types';

/**
 * Each season generate 0-2 flavor entries showing AI courts processing
 * their officers' petitions. These are cosmetic — no state mutation
 * beyond a tiny loyalty bump/drop for color. Surfaces in season report.
 */
export function rollAIWishFlavor(
  officers: Record<EntityId, Officer>,
  forces: Record<EntityId, Force>,
  playerForceId: EntityId | null,
  rng: () => number,
): { officers: Record<EntityId, Officer>; entries: ReportEntry[] } {
  const out = { ...officers };
  const entries: ReportEntry[] = [];
  // Pick 0-2 AI officers at random with non-loyal traits.
  const candidates = Object.values(officers).filter(
    (o) =>
      o.forceId &&
      o.forceId !== playerForceId &&
      o.status === 'idle' &&
      !(o.traits ?? []).includes('loyal'),
  );
  if (candidates.length === 0) return { officers: out, entries };
  const count = Math.floor(rng() * 3); // 0, 1, or 2
  for (let i = 0; i < count; i++) {
    const o = candidates[Math.floor(rng() * candidates.length)];
    const force = forces[o.forceId!];
    if (!force) continue;
    const traits = o.traits ?? [];
    const granted = rng() < 0.6; // 60% granted by default
    const isAmbitious = traits.includes('ambitious') || traits.includes('arrogant');
    const kind = isAmbitious ? 'promotion' : (rng() < 0.5 ? 'reward' : 'transfer');
    const delta = granted ? 4 : -6;
    out[o.id] = { ...o, loyalty: Math.max(0, Math.min(100, o.loyalty + delta)) };
    const verbZh = granted ? '准' : '却';
    const subjectZh = kind === 'promotion' ? '請晉爵' : kind === 'reward' ? '請賞' : '請改任';
    const subjectEn = kind === 'promotion' ? 'requests promotion' : kind === 'reward' ? 'requests reward' : 'requests transfer';
    const verbEn = granted ? 'grants' : 'declines';
    entries.push({
      cityId: o.locationCityId,
      kind: 'note',
      text: `${force.name.en}: ${o.name.en} ${subjectEn}; ${force.name.en} ${verbEn} (loyalty ${delta >= 0 ? '+' : ''}${delta}).`,
      textZh: `${force.name.zh}：${o.name.zh}${subjectZh}，${verbZh}（忠誠 ${delta >= 0 ? '+' : ''}${delta}）。`,
    });
  }
  return { officers: out, entries };
}
