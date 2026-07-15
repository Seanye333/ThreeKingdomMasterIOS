import type { ReportEntry, EntityId, GameDate, Force, City } from '../types';

/**
 * 德政 — a force's civic virtue, read off how well it governs its cities: a
 * 文化名城 (文教≥60) or a 政清人和 city (clean & content) each count, a merely
 * cultured one counts a little. 善政招祥瑞 — Heaven favours the well-governed
 * with auspicious omens. Capped so a sprawling realm can't run away with it.
 */
export function forceVirtue(forceId: EntityId, cities: Record<EntityId, City>): number {
  let v = 0;
  for (const c of Object.values(cities)) {
    if (c.ownerForceId !== forceId) continue;
    if ((c.culture ?? 0) >= 60) v += 2;               // 文化名城
    else if ((c.culture ?? 0) >= 30) v += 1;          // 文教興隆
    if ((c.corruption ?? 0) <= 2 && c.loyalty >= 90) v += 2; // 政清人和
  }
  return Math.min(12, v);
}

/**
 * 天命 — Heaven's Mandate. A 0–100 value per force representing cosmic
 * legitimacy. Drifts based on events: omens raise or lower it, famous
 * defeats lower it, founding rituals raise it.
 *
 *   90+  天命所歸 — recruit ×1.3, loyalty +5, rare omen bias
 *   60-89 順天承運 — slight recruit / loyalty bonus
 *   30-59 苟延天命 — no modifiers
 *   <30  天命已去 — defection chance up, recruit −20%
 */
export interface MandateState {
  /** Per-force 0–100 mandate value. */
  byForce: Record<EntityId, number>;
}

export const MANDATE_LABEL = (v: number): { en: string; zh: string; tone: 'high' | 'mid' | 'low' } => {
  if (v >= 90) return { en: 'Heaven\'s Chosen', zh: '天命所歸', tone: 'high' };
  if (v >= 60) return { en: 'Mandate Held',     zh: '順天承運', tone: 'high' };
  if (v >= 30) return { en: 'Mandate Wavering', zh: '苟延天命', tone: 'mid' };
  return { en: 'Mandate Lost',  zh: '天命已去', tone: 'low' };
};

export type Omen =
  | 'comet'          // 彗星 — usually inauspicious
  | 'eclipse'        // 日蝕 — court foreboding
  | 'five-stars'     // 五星連珠 — extremely auspicious
  | 'yellow-dragon'  // 黃龍 — auspicious, dynasty change
  | 'white-tiger'    // 白虎 — military fortune
  | 'red-bird'       // 朱雀 — south force gain
  | 'turtle-trigram' // 龜書 — wisdom omen
  | 'qilin'          // 麒麟 — sage emperor
  | 'two-suns'       // 兩日並出 — civil war
  | 'fish-letters';  // 魚腹丹書 — Liu Bang / Yellow-Turban style prophecy

export const OMEN_LABEL: Record<Omen, { zh: string; en: string; auspicious: boolean }> = {
  comet:          { zh: '彗星見於東方',      en: 'Comet in the east',           auspicious: false },
  eclipse:        { zh: '日蝕，朝野失色',    en: 'Solar eclipse',                auspicious: false },
  'five-stars':   { zh: '五星連珠',          en: 'Five planets in alignment',    auspicious: true  },
  'yellow-dragon':{ zh: '黃龍見於濟陰',      en: 'Yellow dragon sighted',        auspicious: true  },
  'white-tiger':  { zh: '白虎現於山澤',      en: 'White tiger appears',          auspicious: true  },
  'red-bird':     { zh: '朱雀銜書',          en: 'Vermilion bird with scroll',   auspicious: true  },
  'turtle-trigram':{ zh: '龜書出於洛水',     en: 'Trigrams on a turtle\'s back', auspicious: true  },
  qilin:          { zh: '麒麟降於郊原',      en: 'Qilin descends',               auspicious: true  },
  'two-suns':     { zh: '兩日並出',          en: 'Two suns rise together',       auspicious: false },
  'fish-letters': { zh: '魚腹丹書',          en: 'Prophecy in a fish belly',     auspicious: false },
};

const ALL_OMENS: Omen[] = Object.keys(OMEN_LABEL) as Omen[];

export function createInitialMandate(forceIds: EntityId[]): MandateState {
  return {
    byForce: Object.fromEntries(forceIds.map((id) => [id, 50])),
  };
}

/**
 * Roll a seasonal omen. 8% chance per season. When fires, picks an omen and
 * targets a random force (with bias: auspicious omens favor low-mandate
 * forces — 天命循環).
 */
export function rollOmen(input: {
  forces: Record<EntityId, Force>;
  mandate: MandateState;
  date: GameDate;
  rng: () => number;
  /** 善政招祥瑞 — cities, so an auspicious omen can favour a well-governed realm. */
  cities?: Record<EntityId, City>;
  /** §8.2-deep 靈台 — the player's best Star Terrace level (0–3). The 太史令
   *  may ritually deflect an ill omen off the player (20%/level). */
  playerLingtaiLevel?: number;
  playerForceId?: EntityId | null;
}): { mandate: MandateState; entry: ReportEntry | null } {
  if (input.rng() > 0.08) return { mandate: input.mandate, entry: null };

  const omen = ALL_OMENS[Math.floor(input.rng() * ALL_OMENS.length)];
  const info = OMEN_LABEL[omen];
  const forces = Object.values(input.forces);
  if (forces.length === 0) return { mandate: input.mandate, entry: null };

  // Pick a force — auspicious omens prefer mid-mandate AND virtuous rule
  // (善政招祥瑞); inauspicious prefer the high & mighty. Heaven raises the humble
  // and the well-governed, and casts down the proud.
  const cities = input.cities ?? {};
  const auspiciousKey = (f: Force) => (input.mandate.byForce[f.id] ?? 50) - forceVirtue(f.id, cities) * 3;
  const sorted = [...forces].sort((a, b) => {
    const mb = input.mandate.byForce[b.id] ?? 50;
    const ma = input.mandate.byForce[a.id] ?? 50;
    return info.auspicious ? auspiciousKey(a) - auspiciousKey(b) : mb - ma;
  });
  let target = sorted[Math.floor(input.rng() * Math.min(3, sorted.length))];

  // 禳星 — the astronomers read the portent early and turn it aside.
  if (
    !info.auspicious &&
    input.playerForceId &&
    target.id === input.playerForceId &&
    (input.playerLingtaiLevel ?? 0) > 0 &&
    input.rng() < 0.2 * Math.min(3, input.playerLingtaiLevel ?? 0)
  ) {
    const other = sorted.filter((f) => f.id !== input.playerForceId);
    if (other.length === 0) return { mandate: input.mandate, entry: null };
    target = other[Math.floor(input.rng() * Math.min(3, other.length))];
  }

  // 德配天命 — a virtuous realm draws a fuller blessing from an auspicious omen.
  const virtueBonus = info.auspicious && forceVirtue(target.id, cities) >= 4 ? 4 : 0;
  const delta = info.auspicious ? 8 + Math.floor(input.rng() * 8) + virtueBonus : -(6 + Math.floor(input.rng() * 8));
  const cur = input.mandate.byForce[target.id] ?? 50;
  const next: MandateState = {
    byForce: {
      ...input.mandate.byForce,
      [target.id]: Math.max(0, Math.min(100, cur + delta)),
    },
  };

  const sign = delta > 0 ? '+' : '';
  return {
    mandate: next,
    entry: {
      cityId: null,
      kind: 'note',
      text: `${info.zh}（${info.en}） — ${target.name.zh} 天命 ${sign}${delta}`,
      textZh: `${info.zh} — ${target.name.zh}天命${sign}${delta}。`,
    },
  };
}

/**
 * Recruit cost / chance multiplier from mandate.
 */
export function mandateRecruitMultiplier(mandate: number): number {
  if (mandate >= 90) return 1.30;
  if (mandate >= 60) return 1.10;
  if (mandate >= 30) return 1.00;
  return 0.80;
}
