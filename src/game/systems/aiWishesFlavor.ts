import type { EntityId, Force, Officer, ReportEntry } from '../types';
import { MILITARY_RANKS, MILITARY_RANKS_BY_ID } from '../data/titles';
import { PEERAGES } from '../data/peerage';

/**
 * Each season generate 0-2 flavor entries showing AI courts processing
 * their officers' petitions. Granting actually does something now —
 * promotion bumps the officer's military rank, reward gives loyalty,
 * transfer is just flavor. Surfaces in season report.
 */
export function rollAIWishFlavor(
  officers: Record<EntityId, Officer>,
  forces: Record<EntityId, Force>,
  playerForceId: EntityId | null,
  rng: () => number,
): { officers: Record<EntityId, Officer>; entries: ReportEntry[] } {
  const out = { ...officers };
  const entries: ReportEntry[] = [];
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
    const granted = rng() < 0.6;
    const isAmbitious = traits.includes('ambitious') || traits.includes('arrogant');
    const kind = isAmbitious
      ? (rng() < 0.3 && (o.renown ?? 0) >= 120 ? 'peerage' : 'promotion')
      : (rng() < 0.34 ? 'reward' : rng() < 0.5 ? 'transfer' : 'gift');

    if (kind === 'peerage') {
      // 求爵 — granting bumps the officer one peerage tier (real, like promotion).
      const curIdx = o.peerageId ? PEERAGES.findIndex((p) => p.id === o.peerageId) : -1;
      const next = curIdx + 1 < PEERAGES.length ? PEERAGES[curIdx + 1] : null;
      if (granted && next) {
        out[o.id] = { ...o, peerageId: next.id, loyalty: Math.min(100, o.loyalty + 5) };
        entries.push({
          cityId: o.locationCityId, kind: 'note',
          text: `${force.name.en}: ${o.name.en} enfeoffed as ${next.name.en}.`,
          textZh: `${force.name.zh}：封${o.name.zh}為${next.name.zh}。`,
        });
      } else {
        out[o.id] = { ...o, loyalty: Math.max(0, o.loyalty - 8) };
        entries.push({
          cityId: o.locationCityId, kind: 'note',
          text: `${force.name.en}: ${o.name.en} seeks a fief; ${force.name.en} declines (loyalty −8).`,
          textZh: `${force.name.zh}：${o.name.zh}求封爵,不許(忠誠 −8)。`,
        });
      }
      continue;
    }

    if (kind === 'promotion' && granted) {
      // Real promotion: try to bump rank one tier up if eligible.
      const currentTier = MILITARY_RANKS_BY_ID[o.rank]?.tier ?? 0;
      const best = Math.max(o.stats.war, o.stats.leadership);
      const next = [...MILITARY_RANKS]
        .sort((a, b) => b.tier - a.tier)
        .find((r) => r.tier > currentTier && best >= r.minStat);
      if (next) {
        out[o.id] = {
          ...o,
          rank: next.id,
          loyalty: Math.min(100, o.loyalty + 4 + next.loyaltyBonus),
        };
        entries.push({
          cityId: o.locationCityId,
          kind: 'note',
          text: `${force.name.en}: ${o.name.en} promoted to ${next.name.en} (+loyalty).`,
          textZh: `${force.name.zh}：晉${o.name.zh}為${next.name.zh}（忠誠 +）。`,
        });
        continue;
      }
      // Fall through: no rank to grant — treat as reward.
    }
    if (kind === 'promotion' && !granted) {
      out[o.id] = { ...o, loyalty: Math.max(0, o.loyalty - 6) };
      entries.push({
        cityId: o.locationCityId,
        kind: 'note',
        text: `${force.name.en}: ${o.name.en} requests promotion; ${force.name.en} declines (loyalty −6).`,
        textZh: `${force.name.zh}：${o.name.zh}請晉爵，却（忠誠 −6）。`,
      });
      continue;
    }
    // Reward / transfer / gift fall-through: small loyalty delta (gift also renown).
    const delta = granted ? 4 : -6;
    out[o.id] = {
      ...o,
      loyalty: Math.max(0, Math.min(100, o.loyalty + delta)),
      ...(kind === 'gift' && granted ? { renown: (o.renown ?? 0) + 12 } : {}),
    };
    const verbZh = granted ? '准' : '却';
    const subjectZh = kind === 'reward' ? '請賞' : kind === 'gift' ? '請賜物' : '請改任';
    const subjectEn = kind === 'reward' ? 'requests reward' : kind === 'gift' ? 'asks for a reward' : 'requests transfer';
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
