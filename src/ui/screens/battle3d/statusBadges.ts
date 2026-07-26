import type { TacticalStatus } from '../../../game/types';

/**
 * 狀態徽記 — one glyph + colour per tactical status, for the unit nameplate on
 * the board.
 *
 * Nine statuses exist ([types/tactical.ts] TacticalStatus) and several change
 * the numbers outright — `disorder` makes a unit hit weaker AND take more,
 * `defending` shields it, `feign-rout` is a trap the player set and can easily
 * forget. But only 🔥 burning and 糧 starving were drawn on the board; the rest
 * appeared solely as chips in the side panel, so reading the state of a line
 * meant clicking through it unit by unit.
 *
 * Kept as data (not JSX) so the board nameplate and the side panel can share
 * one source of truth for what each status is called and coloured.
 */

export interface StatusBadge {
  /** Single glyph for the nameplate — a CJK character or an emoji. */
  glyph: string;
  color: string;
  zh: string;
  en: string;
  /** What it actually does, for the tooltip. */
  tipZh: string;
  tipEn: string;
}

export const STATUS_BADGE: Record<TacticalStatus['kind'], StatusBadge> = {
  burning: {
    glyph: '🔥', color: '#ff7050', zh: '燃燒', en: 'Burning',
    tipZh: '每回合折損,直至火滅', tipEn: 'Bleeding men each turn until it burns out',
  },
  disorder: {
    glyph: '亂', color: '#c19a3b', zh: '陷亂', en: 'Disorder',
    tipZh: '陣列已散 — 打得更弱,被打更重(據守或過一回合可復)',
    tipEn: 'Ranks broken — hits weaker and is hit harder until it re-forms',
  },
  confused: {
    glyph: '惑', color: '#c19a3b', zh: '混亂', en: 'Confused',
    tipZh: '中計 — 行動失序', tipEn: 'Taken in by a stratagem — acting out of order',
  },
  defending: {
    glyph: '守', color: '#88b7e8', zh: '據守', en: 'Defending',
    tipZh: '據守待敵 — 受擊減免', tipEn: 'Dug in — incoming damage reduced',
  },
  chained: {
    glyph: '鎖', color: '#88b7e8', zh: '連環', en: 'Chained',
    tipZh: '船身相連 — 傷害分攤,火攻致命', tipEn: 'Hulls linked — damage shared, fire is lethal',
  },
  revealed: {
    glyph: '現', color: '#88b7e8', zh: '現形', en: 'Revealed',
    tipZh: '伏兵已被看破', tipEn: 'The ambush has been spotted',
  },
  demoralized: {
    glyph: '沮', color: '#c89090', zh: '沮喪', en: 'Demoralized',
    tipZh: '士氣受挫', tipEn: 'Morale knocked down',
  },
  starving: {
    glyph: '糧', color: '#d8b24a', zh: '糧盡', en: 'Starving',
    tipZh: '糧盡兵疲 — 逃亡且戰力衰減', tipEn: 'Out of supply — desertion and sapped strength',
  },
  'feign-rout': {
    glyph: '詐', color: '#c178c7', zh: '詐敗', en: 'Feigned Rout',
    tipZh: '偽作潰敗誘敵 — 首個來犯者遭反擊並陷亂',
    tipEn: 'Faking a rout — the first attacker eats a full counter and is disordered',
  },
};

/**
 * Board-nameplate badges, worst-first so the most consequential status is the
 * one that survives a narrow plate.
 *
 * `chained` and `revealed` are deliberately omitted: chained fleets already
 * draw a link line between hulls, and a revealed ambush is announced by the
 * ambush burst plus its own marker. Repeating them here would only crowd the
 * plate.
 */
const PLATE_ORDER: Array<TacticalStatus['kind']> = [
  'burning', 'disorder', 'starving', 'confused', 'demoralized', 'feign-rout', 'defending',
];

export function plateBadges(effects: TacticalStatus[], limit = 3): StatusBadge[] {
  const have = new Set(effects.map((e) => e.kind));
  const out: StatusBadge[] = [];
  for (const kind of PLATE_ORDER) {
    if (have.has(kind)) out.push(STATUS_BADGE[kind]);
    if (out.length >= limit) break;
  }
  return out;
}

/* ─── 非 effects 的狀態 ──────────────────────────────────────────────
 * Three more things change the numbers without living in `effects`, and none
 * of them showed on the model — only as figures in the side panel:
 *
 *   charge   衝鋒勢能 — moved ≥2 hexes, so the next blow lands at up to +32%
 *            (cavalry) / +15% (foot). Cancelled by a braced spear line or by
 *            fieldworks, which is why the arcs in ./facing matter alongside it.
 *   ammo 0   矢盡 — a ranged unit with no volleys left simply cannot fire, yet
 *            it went on drawing its bow on screen.
 *   fatigue  疲憊 — freshMul = 1.05 − min(0.30, fatigue/333): up to −30%
 *            damage. A spent column looked identical to a fresh one.
 *   戰功     驍勇 — `damageDealt` (enemy troops felled) and `kills` (enemy
 *            units routed) are both tracked and were shown NOWHERE on the
 *            board: a column that had broken three enemy formations looked
 *            exactly like one that just arrived. Pure bookkeeping — it never
 *            gates combat — but it is the battle's own record of which of your
 *            units did the work.
 */

/** Fatigue at which the penalty is worth flagging (≈ −15% and worsening). */
export const FATIGUE_BADGE_AT = 160;

/**
 * 驍勇的門檻 — routing two enemy units, or felling more men than the unit
 * fields itself.
 *
 * Note `kills` counts enemy UNITS routed (tactical.ts increments it by 1 per
 * rout), not men — it tops out in the low tens, so a men-scaled threshold
 * would never fire. `damageDealt` is the one measured in troops.
 */
export const VALIANT_ROUTS = 2;
export const VALIANT_DAMAGE_RATIO = 1.0;

export interface DerivedUnitState {
  unitType: string;
  charge?: { dist: number } | null;
  ammo?: number;
  maxAmmo?: number;
  fatigue?: number;
  /** 破敵部數 — enemy UNITS routed (not men). */
  kills?: number;
  /** 陣斬 — enemy troops felled. */
  damageDealt?: number;
  maxTroops?: number;
}

/** Badges for state that isn't in `effects`. Same shape, same nameplate. */
export function derivedBadges(u: DerivedUnitState): StatusBadge[] {
  const out: StatusBadge[] = [];
  if (u.charge && u.charge.dist >= 2 && u.unitType !== 'siege' && u.unitType !== 'navy') {
    out.push({
      glyph: '衝', color: '#8ad8f0', zh: '衝鋒勢', en: 'Charging',
      tipZh: `已奔${u.charge.dist}格 — 下一擊帶衝鋒加成(遇正面槍陣或鹿砦則破)`,
      tipEn: `Ran ${u.charge.dist} hexes — the next blow carries charge bonus (broken by a braced spear line or fieldworks)`,
    });
  }
  if (u.maxAmmo !== undefined && (u.ammo ?? 0) <= 0) {
    out.push({
      glyph: '矢', color: '#e0623a', zh: '矢盡', en: 'Out of arrows',
      tipZh: '箭矢用盡 — 無法齊射,須就糧車/補給格補給',
      tipEn: 'No volleys left — resupply beside a grain wagon or a supply hex',
    });
  }
  const routs = u.kills ?? 0;
  const felled = u.damageDealt ?? 0;
  const outfought = !!u.maxTroops && felled >= u.maxTroops * VALIANT_DAMAGE_RATIO;
  if (routs >= VALIANT_ROUTS || outfought) {
    const parts: string[] = [];
    if (routs > 0) parts.push(`破敵 ${routs} 部`);
    if (felled > 0) parts.push(`陣斬 ${felled.toLocaleString()}`);
    const partsEn: string[] = [];
    if (routs > 0) partsEn.push(`${routs} unit${routs > 1 ? 's' : ''} routed`);
    if (felled > 0) partsEn.push(`${felled.toLocaleString()} felled`);
    out.push({
      glyph: '驍', color: '#e8c060', zh: '驍勇', en: 'Valiant',
      tipZh: parts.join('、') + (outfought ? ' — 逾本部之數' : ''),
      tipEn: partsEn.join(', ') + (outfought ? ' — more than its own numbers' : ''),
    });
  }
  if ((u.fatigue ?? 0) >= FATIGUE_BADGE_AT) {
    const pct = Math.round(Math.min(0.30, (u.fatigue ?? 0) / 333) * 100);
    out.push({
      glyph: '疲', color: '#b09a7a', zh: '疲憊', en: 'Spent',
      tipZh: `師老兵疲 — 戰力約 −${pct}%`,
      tipEn: `Worn down — roughly −${pct}% fighting power`,
    });
  }
  return out;
}
