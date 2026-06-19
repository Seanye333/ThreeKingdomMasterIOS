/**
 * Personal-tactics → tactical-battle actions.
 *
 * Each officer has a list of personal 戰法 (TacticId) from OFFICER_TACTICS.
 * This module exposes them as additional buttons in the tactical battle by
 * mapping each tactic to an existing StratagemId based on its category, so
 * we reuse the combat code in applyStratagem() without writing 589 unique
 * handlers.
 *
 * Famous signature tactics override the category default with a stronger
 * effect when invoked (longer burn duration, larger range, etc.).
 */
import {
  TACTIC_DEFS,
  categoryOfTactic,
  deriveTactics,
  isTacticSignature,
  type TacticCategory,
} from '../data/officerAttributes';
import type { Officer, StratagemId, TacticalUnit } from '../types';

export interface PersonalTacticAction {
  /** A synthetic id used for cooldown tracking: "personal:<tacticId>". */
  id: string;
  /** The original strategic-level tactic id. */
  tacticId: string;
  /** Display names. */
  nameZh: string;
  nameEn: string;
  /** Which underlying stratagem code path executes when this is used. */
  underlying: StratagemId;
  /** Hex range (Chebyshev). */
  range: number;
  /** Cooldown turns. */
  cooldown: number;
  /** Whether this is a famous named tactic — gets ★ badge + boosted effect. */
  isSignature: boolean;
  /** Short flavor description for the tooltip. */
  description: string;
  /** Category for visual grouping. */
  category: TacticCategory;
}

/**
 * Each category maps to a baseline stratagem template.
 * We reuse the existing combat handlers for fire/confusion/charge etc.
 */
export const CATEGORY_TEMPLATE: Record<TacticCategory, { underlying: StratagemId; range: number; cooldown: number; descPrefix: string }> = {
  melee:    { underlying: 'charge',          range: 1, cooldown: 2, descPrefix: '近戰猛攻：' },
  ranged:   { underlying: 'rain-of-arrows',  range: 4, cooldown: 1, descPrefix: '遠射齊發：' },
  mystic:   { underlying: 'fire-attack',     range: 3, cooldown: 0, descPrefix: '玄妙之計：' },
  disrupt:  { underlying: 'confusion',       range: 4, cooldown: 0, descPrefix: '惑敵亂心：' },
  strategy: { underlying: 'rally',           range: 2, cooldown: 2, descPrefix: '統御之策：' },
};

/**
 * Signature tactics that should override the category default with a specific
 * stratagem mapping (e.g. 借東風 directly maps to fire-attack, 草船借箭 to
 * rain-of-arrows, 神算 to precognition, etc.). Anything not listed here
 * still gets a personal action — just routed via the category template.
 */
// T4 — Signature/legendary tactics have HIGHER cooldowns than basic ones.
// Trading rarity for impact: a legendary tactic should fire once or twice
// per battle, not be spammed.
export const SIGNATURE_OVERRIDES: Record<string, { underlying: StratagemId; range: number; cooldown: number }> = {
  'borrow-wind':     { underlying: 'fire-attack',    range: 4, cooldown: 5 }, // 借東風 — legendary
  'borrow-arrow':    { underlying: 'rain-of-arrows', range: 5, cooldown: 3 }, // 草船借箭
  'eight-gates':     { underlying: 'precognition',   range: 0, cooldown: 4 }, // 八門遁甲
  'empty-fort':      { underlying: 'precognition',   range: 0, cooldown: 8 }, // 空城計 — once
  'qimen-dunjia':    { underlying: 'precognition',   range: 0, cooldown: 5 },
  'seven-lamp':      { underlying: 'precognition',   range: 0, cooldown: 6 }, // 七星燈
  'star-prayer':     { underlying: 'precognition',   range: 0, cooldown: 5 },
  'burn-bowang':     { underlying: 'fire-attack',    range: 4, cooldown: 4 }, // 火燒博望
  'burn-yiling':     { underlying: 'fire-attack',    range: 4, cooldown: 5 }, // 火燒連營
  'fire-attack':     { underlying: 'fire-attack',    range: 3, cooldown: 0 },
  'water-attack':    { underlying: 'fire-attack',    range: 3, cooldown: 0 }, // visually burning but lore = drowning
  'thunder':         { underlying: 'lightning',      range: 4, cooldown: 0 },
  'five-thunder':    { underlying: 'lightning',      range: 5, cooldown: 0 },
  'meteor':          { underlying: 'lightning',      range: 4, cooldown: 0 },
  'catapult':        { underlying: 'rain-of-arrows', range: 4, cooldown: 1 },
  'crossbow':        { underlying: 'rain-of-arrows', range: 4, cooldown: 1 },
  'fire-arrow':      { underlying: 'rain-of-arrows', range: 4, cooldown: 1 },
  'volley':          { underlying: 'rain-of-arrows', range: 4, cooldown: 1 },
  'zhuge-bow':       { underlying: 'rain-of-arrows', range: 5, cooldown: 2 }, // 諸葛弩
  'charge':          { underlying: 'charge',         range: 1, cooldown: 2 },
  'rush':            { underlying: 'charge',         range: 1, cooldown: 2 },
  'changban':        { underlying: 'gallop',         range: 3, cooldown: 3 },
  'thousand-ride':   { underlying: 'gallop',         range: 3, cooldown: 3 },
  'pass-six':        { underlying: 'dragon-veil',    range: 0, cooldown: 3 },
  'lone-blade':      { underlying: 'dragon-veil',    range: 0, cooldown: 3 },
  'iron-wall':       { underlying: 'defend',         range: 0, cooldown: 0 },
  'last-stand':      { underlying: 'defend',         range: 0, cooldown: 0 },
  'rouse':           { underlying: 'rally',          range: 2, cooldown: 2 },
  'seven-grab':      { underlying: 'rally',          range: 3, cooldown: 5 }, // 七擒孟獲
  'ruse':            { underlying: 'confusion',      range: 4, cooldown: 0 },
  'beauty':          { underlying: 'confusion',      range: 3, cooldown: 0 },
  'chain':           { underlying: 'chain-ships',    range: 3, cooldown: 0 },
  'pitfall':         { underlying: 'false-retreat',  range: 0, cooldown: 0 },
  'feign-mad':       { underlying: 'false-retreat',  range: 0, cooldown: 0 },
  'chu-songs':       { underlying: 'supply-strike',  range: 0, cooldown: 0 },
  'self-injury':     { underlying: 'false-retreat',  range: 0, cooldown: 0 },
  'borrow-knife':    { underlying: 'confusion',      range: 4, cooldown: 0 },
  'hide-knife':      { underlying: 'confusion',      range: 4, cooldown: 0 },
  'diaochan':        { underlying: 'confusion',      range: 4, cooldown: 0 },
  'ambush':          { underlying: 'charge',         range: 1, cooldown: 2 },
  'white-robe':      { underlying: 'gallop',         range: 3, cooldown: 3 },
};

/**
 * Build the per-unit list of personal-tactic actions based on the officer
 * and the unit's stats. Filters out tactics that don't fit the unit type
 * (e.g. ranged tactics on a navy unit are still ok, but cavalry-specific
 * ones like 千里走單騎 require cavalry).
 */
export function personalTacticsForUnit(
  officer: Officer | null,
  unit: TacticalUnit,
  /** Max actions to return. Default 8 keeps the panel tidy; the fullscreen
   *  panel passes a higher cap (and scrolls) so no 戰法 is silently hidden. */
  limit = 8,
): PersonalTacticAction[] {
  if (!officer) return [];
  const tactics = deriveTactics(officer.stats, officer.id);
  // Cap to keep the panel manageable. Signature tactics always come first.
  const sorted = [...tactics].sort((a, b) => {
    const sa = isTacticSignature(a) ? 0 : 1;
    const sb = isTacticSignature(b) ? 0 : 1;
    return sa - sb;
  });

  const out: PersonalTacticAction[] = [];
  for (const tid of sorted) {
    const def = TACTIC_DEFS[tid as keyof typeof TACTIC_DEFS];
    if (!def) continue;
    const category = categoryOfTactic(tid);
    const tpl = CATEGORY_TEMPLATE[category];
    const sig = SIGNATURE_OVERRIDES[tid];
    const isSig = isTacticSignature(tid);
    // Cavalry-themed tactics: skip if unit isn't cavalry/infantry.
    if (sig?.underlying === 'gallop' && unit.unitType !== 'cavalry') continue;
    // Ranged tactics: only valid if unit can shoot (archers / siege / navy).
    if (category === 'ranged' && !['archers', 'siege', 'navy'].includes(unit.unitType)) continue;
    out.push({
      id: `personal:${tid}`,
      tacticId: tid,
      nameZh: def.zh,
      nameEn: def.en,
      underlying: sig?.underlying ?? tpl.underlying,
      range: sig?.range ?? tpl.range,
      cooldown: sig?.cooldown ?? tpl.cooldown,
      isSignature: isSig,
      description: `${tpl.descPrefix}${def.zh} (${def.en})`,
      category,
    });
  }
  return out.slice(0, Math.max(1, limit));
}
