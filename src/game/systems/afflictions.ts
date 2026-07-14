import type { Officer } from '../types';

/**
 * 後遺 — short-lived afflictions an officer carries for a few seasons after a
 * gruelling 單挑 or a humiliating 舌戰:
 *   - 養傷 (wound): a duel left lingering injuries — reduced 武力 until healed.
 *   - 羞憤 (shame): an emotional mind out-argued and shamed — reduced 魅力/智力.
 *
 * Afflictions fold into an officer's effective stats (so they sap battle prowess,
 * duel prowess and debate prowess alike) and tick down one season at a time.
 * The field is optional, so old saves load unchanged.
 */
export type AfflictionKind = 'wound' | 'shame' | 'chronic';

export interface Affliction {
  kind: AfflictionKind;
  /** Seasons remaining before it lifts. 'chronic' never ticks (a large sentinel). */
  seasons: number;
  /** Stat penalties (stored as negative numbers). */
  war?: number;
  intelligence?: number;
  charisma?: number;
  /** 宿疾 label (chronic only) — a named lasting ailment shown in the UI. */
  labelZh?: string;
  labelEn?: string;
}

export type AfflictableStat = 'war' | 'intelligence' | 'charisma';

/** The total penalty an officer's active afflictions impose on one stat (≤0). */
export function afflictionDelta(o: Officer, stat: AfflictableStat): number {
  let d = 0;
  for (const a of o.afflictions ?? []) d += a[stat] ?? 0;
  return d;
}

/** True if the officer currently carries an affliction of the given kind. */
export function hasAffliction(o: Officer, kind: AfflictionKind): boolean {
  return (o.afflictions ?? []).some((a) => a.kind === kind);
}

/** Add (or refresh) an affliction. A new one of the same kind replaces the old,
 *  keeping whichever is harsher (longer-lasting) so it can't be cheaply reset. */
export function withAffliction(o: Officer, aff: Affliction): Officer {
  const prior = (o.afflictions ?? []).find((a) => a.kind === aff.kind);
  const merged: Affliction = prior ? { ...aff, seasons: Math.max(prior.seasons, aff.seasons) } : aff;
  const rest = (o.afflictions ?? []).filter((a) => a.kind !== aff.kind);
  return { ...o, afflictions: [...rest, merged] };
}

/** Decrement every affliction by one season; drop the spent ones. Call once per
 *  season boundary (alongside the wounded-recovery tick). A 傷兵營 (field hospital)
 *  in the officer's city knocks extra seasons off 養傷 wounds via `woundHealBonus`. */
export function tickAfflictions(o: Officer, woundHealBonus = 0): Officer {
  if (!o.afflictions?.length) return o;
  const next = o.afflictions
    // 宿疾 never lifts on its own — only 洗髓/名醫 can cure it.
    .map((a) => (a.kind === 'chronic' ? a : { ...a, seasons: a.seasons - 1 - (a.kind === 'wound' ? woundHealBonus : 0) }))
    .filter((a) => a.kind === 'chronic' || a.seasons > 0);
  return { ...o, afflictions: next.length ? next : undefined };
}

// ─── 宿疾 — the lasting scars a grievous wound can leave ─────────────────────
const CHRONIC_AILMENTS: Affliction[] = [
  { kind: 'chronic', seasons: 9999, war: -4, labelZh: '箭瘡宿疾', labelEn: 'Old Arrow Wound' },
  { kind: 'chronic', seasons: 9999, war: -3, labelZh: '折肱之痛', labelEn: 'A Crippled Arm' },
  { kind: 'chronic', seasons: 9999, intelligence: -4, labelZh: '頭風之疾', labelEn: 'Chronic Migraines' },
  { kind: 'chronic', seasons: 9999, war: -2, charisma: -2, labelZh: '毀容之傷', labelEn: 'A Disfiguring Scar' },
];

/** True if the officer carries a lasting 宿疾. */
export function hasChronicAilment(o: Officer): boolean {
  return (o.afflictions ?? []).some((a) => a.kind === 'chronic');
}

/** The officer's 宿疾, if any (for display). */
export function chronicAilmentOf(o: Officer): Affliction | null {
  return (o.afflictions ?? []).find((a) => a.kind === 'chronic') ?? null;
}

/** Pick a 宿疾 a critical wound left behind (deterministic on the rng roll). */
export function rollChronicAilment(rng: () => number): Affliction {
  return CHRONIC_AILMENTS[Math.floor(rng() * CHRONIC_AILMENTS.length)] ?? CHRONIC_AILMENTS[0];
}

/** Strip every 宿疾 (洗髓/名醫). Returns the officer with chronic afflictions cleared. */
export function cureChronicAilments(o: Officer): Officer {
  if (!o.afflictions?.length) return o;
  const next = o.afflictions.filter((a) => a.kind !== 'chronic');
  return { ...o, afflictions: next.length ? next : undefined };
}

// ─── Stock afflictions ──────────────────────────────────────────────────────

/** 養傷 — a duel that left a mark. Heavier when the loser was nearly cut down. */
export function duelWound(severe: boolean): Affliction {
  return { kind: 'wound', seasons: severe ? 3 : 2, war: severe ? -10 : -6 };
}

/** 羞憤 — an emotional mind shamed in debate stews on it for a few seasons. */
export function debateShame(): Affliction {
  return { kind: 'shame', seasons: 2, charisma: -6, intelligence: -4 };
}

/** Traits that make an officer take a 舌戰 loss to heart (and so be shamed). */
const EMOTIONAL_TRAITS = ['wrathful', 'arrogant', 'vainglorious', 'stubborn', 'reckless', 'impatient'];
export function isEmotional(o: Officer): boolean {
  return (o.traits as string[] | undefined ?? []).some((t) => EMOTIONAL_TRAITS.includes(t));
}
