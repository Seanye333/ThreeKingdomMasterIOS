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
