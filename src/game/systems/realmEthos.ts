import type { Officer, HeroicDeeds, EntityId } from '../types';
import { martialXiuwei } from './martialArts';
import { debateXiuwei } from './debateArts';

/**
 * 尚武・崇文之風 (§6.18) — a realm's character, read off what its people
 * actually spend their lives becoming. Every officer's drilled 修為 and won
 * bouts pull their court one way or the other: a house of duellists hardens
 * into 尚武之風, a house of scholars mellows into 崇文之風, and a house of
 * both is 文武兼修.
 *
 * Nothing here is stored — the ethos is DERIVED from the roster each time it
 * is asked for, so it drifts naturally as officers are recruited, trained,
 * poached and buried. No migration, no bookkeeping, and it can never fall out
 * of sync with the officers it describes.
 */

/** 風氣 — where a realm sits on the martial ↔ literary axis. */
export type EthosLean = 'martial' | 'literary' | 'balanced' | 'undistinguished';

export interface RealmEthos {
  /** 武風 — accumulated martial character (0..~100). */
  martial: number;
  /** 文風 — accumulated literary character (0..~100). */
  literary: number;
  lean: EthosLean;
  /** How pronounced the character is (0..1) — drives how hard the perks bite. */
  strength: number;
  zh: string;
  en: string;
}

/** A realm needs a real body of accomplishment before it has a character at all. */
export const ETHOS_FLOOR = 18;
/** The gap between the two sides that reads as a genuine lean. */
export const ETHOS_LEAN_GAP = 12;

/**
 * Read a force's ethos off its officers. 修為 counts double the deeds: what a
 * realm *cultivates* says more about it than what it happens to have won.
 */
export function realmEthos(
  officers: Record<EntityId, Officer>,
  deeds: Record<EntityId, HeroicDeeds>,
  forceId: EntityId | null | undefined,
): RealmEthos {
  const none: RealmEthos = { martial: 0, literary: 0, lean: 'undistinguished', strength: 0, zh: '無所偏尚', en: 'Undistinguished' };
  if (!forceId) return none;
  const roster = Object.values(officers).filter((o) => o.forceId === forceId && o.status !== 'dead' && o.status !== 'unsearched');
  if (!roster.length) return none;

  let mSum = 0, lSum = 0;
  for (const o of roster) {
    const d = deeds[o.id];
    mSum += martialXiuwei(o) * 2 + Math.min(40, (d?.duelsWon ?? 0) * 4);
    lSum += debateXiuwei(o) * 2 + Math.min(40, (d?.debatesWon ?? 0) * 4);
  }
  // Per-head averages, so a sprawling empire isn't automatically "cultured" —
  // character is about the calibre of the court, not its size.
  const scale = roster.length * 2.4; // 修為 100 + a full deed bar ≈ 100
  const martial = Math.round(Math.min(100, mSum / scale));
  const literary = Math.round(Math.min(100, lSum / scale));

  const top = Math.max(martial, literary);
  if (top < ETHOS_FLOOR) return { ...none, martial, literary };
  const gap = martial - literary;
  const lean: EthosLean = gap >= ETHOS_LEAN_GAP ? 'martial'
    : gap <= -ETHOS_LEAN_GAP ? 'literary' : 'balanced';
  // 兼修 is only impressive when BOTH sides are strong, so balance scores on the
  // weaker arm — a realm mediocre at both is balanced, but not distinguished.
  const strength = Math.max(0, Math.min(1, (lean === 'balanced' ? Math.min(martial, literary) : top) / 100));
  const label = lean === 'martial' ? { zh: '尚武之風', en: 'Martial Ethos' }
    : lean === 'literary' ? { zh: '崇文之風', en: 'Literary Ethos' }
    : { zh: '文武兼修', en: 'Both Arts Honoured' };
  return { martial, literary, lean, strength, zh: label.zh, en: label.en };
}

// ─── What the character actually buys ────────────────────────────────────────
// Every perk is small and reaches an existing system, so an ethos is felt
// across a campaign rather than read off a panel.

/** 學宮養士 — a realm's character speeds the schools that match it (§6.10/§6.14). */
export function ethosSchoolBonus(e: RealmEthos): { martial: number; literary: number } {
  if (e.strength < 0.3) return { martial: 0, literary: 0 };
  const strong = e.strength >= 0.6 ? 2 : 1;
  if (e.lean === 'martial') return { martial: strong, literary: 0 };
  if (e.lean === 'literary') return { martial: 0, literary: strong };
  if (e.lean === 'balanced') return { martial: 1, literary: 1 };
  return { martial: 0, literary: 0 };
}

/** 民心所向 — a cultured court steadies its cities; a martial one does not. */
export function ethosLoyaltyAura(e: RealmEthos): number {
  if (e.lean === 'literary' && e.strength >= 0.4) return e.strength >= 0.7 ? 2 : 1;
  if (e.lean === 'balanced' && e.strength >= 0.5) return 1;
  return 0;
}

/** 武風懾人 — a martial realm's champions are likelier to be ducked (§6.13). */
export function ethosDreadBonus(e: RealmEthos): number {
  if (e.lean !== 'martial' || e.strength < 0.4) return 0;
  return e.strength >= 0.7 ? 0.08 : 0.04;
}

/** 招賢之偏 — a realm's character draws its own kind (recruit odds, ±%). */
export function ethosRecruitAffinity(e: RealmEthos, candidate: Officer): number {
  if (e.strength < 0.35) return 0;
  const warlike = candidate.stats.war >= candidate.stats.intelligence;
  const pull = e.strength >= 0.7 ? 0.1 : 0.05;
  if (e.lean === 'martial') return warlike ? pull : -pull * 0.6;
  if (e.lean === 'literary') return warlike ? -pull * 0.6 : pull;
  return 0; // 兼修 courts take all comers evenly
}

/** A one-line readout for the UI / report. */
export function ethosLine(e: RealmEthos): { zh: string; en: string } {
  if (e.lean === 'undistinguished') {
    return { zh: '國中未成風氣 — 文武皆無所尚。', en: 'No settled character yet — neither arms nor letters stand out.' };
  }
  const depth = e.strength >= 0.7 ? { zh: '蔚然成風', en: 'deeply ingrained' } : e.strength >= 0.4 ? { zh: '漸成風氣', en: 'taking hold' } : { zh: '初見端倪', en: 'faintly felt' };
  return {
    zh: `${e.zh}(武 ${e.martial}・文 ${e.literary})— ${depth.zh}。`,
    en: `${e.en} (arms ${e.martial} / letters ${e.literary}) — ${depth.en}.`,
  };
}
