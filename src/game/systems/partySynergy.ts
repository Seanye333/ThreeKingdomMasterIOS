import type { Officer } from '../types';
import { inferUnitType } from './tactical';

/**
 * 出陣羈絆 — lineup archetypes. Distinct from 名將成套 (setBonds.ts, which
 * rewards fielding a *specific famous roster* together): these reward the
 * *shape* of the marching party — its balance of wits and valour, its spread
 * of arms, its shared roots, its unity of command — so a player who builds a
 * "deck" around a composition (not just around named cards) is paid for it in
 * the field. Modest, additive, capped; applies to whoever assembles it (the
 * AI can trip an archetype too, though it rarely stacks them the way a player
 * deliberately would). Both the 出陣卡組 preview and the auto-resolve read the
 * same function, so the readout never lies.
 */
export interface PartySynergy {
  id: string;
  zh: string;
  en: string;
  descZh: string;
  descEn: string;
  /** Power multiplier this single archetype contributes (before the cap). */
  mul: number;
}

export interface PartySynergyResult {
  synergies: PartySynergy[];
  /** Combined power multiplier, capped at +CAP. */
  powerMul: number;
}

/** Total lineup edge never exceeds this, however many archetypes stack. */
export const PARTY_SYNERGY_CAP = 0.06;

export function partySynergies(pool: Array<Officer | null | undefined>): PartySynergyResult {
  const party = pool.filter((o): o is Officer => !!o);
  const out: PartySynergy[] = [];
  // A lone commander is not a "lineup" — no archetype fires.
  if (party.length < 2) return { synergies: out, powerMul: 1 };

  const push = (s: PartySynergy) => out.push(s);

  // 智勇相濟 — a valorous arm (武≥85) beside a keen mind (智≥85), two different
  // officers, so a solo 文武全才 doesn't count (that's their own carry).
  const valorIdx = party.findIndex((o) => o.stats.war >= 85);
  const mindIdx = party.findIndex((o, i) => i !== valorIdx && o.stats.intelligence >= 85);
  if (valorIdx >= 0 && mindIdx >= 0) {
    push({ id: 'wits-valor', zh: '智勇相濟', en: 'Wits & Valor', descZh: '猛將謀士並肩,攻守兼備', descEn: 'A warrior and a strategist stand shoulder to shoulder', mul: 1.03 });
  }

  // 諸兵種協同 — the party spans several arms (proxied from each officer's
  // inferred unit type). Combined arms cover each other's weaknesses.
  const arms = new Set(party.map((o) => inferUnitType(o)));
  if (arms.size >= 3) {
    push({ id: 'combined-arms-3', zh: '諸兵種協同', en: 'Combined Arms', descZh: '三軍兵種齊備,長短相濟', descEn: 'Three or more arms fight as one', mul: 1.035 });
  } else if (arms.size >= 2) {
    push({ id: 'combined-arms-2', zh: '兵種相濟', en: 'Mixed Arms', descZh: '兵種互補,以長攻短', descEn: 'Complementary arms', mul: 1.02 });
  }

  // 猛虎成群 — three or more fierce generals (武≥82) in one column.
  if (party.filter((o) => o.stats.war >= 82).length >= 3) {
    push({ id: 'tiger-pack', zh: '猛虎成群', en: 'Pack of Tigers', descZh: '三員猛將同陣,銳不可當', descEn: 'Three fierce generals in one line', mul: 1.035 });
  }

  // 謀士如雲 — three or more keen minds (智≥80) share the tent.
  if (party.filter((o) => o.stats.intelligence >= 80).length >= 3) {
    push({ id: 'many-minds', zh: '謀士如雲', en: 'Council of Minds', descZh: '群謀畢至,運籌帷幄', descEn: 'A council of keen minds', mul: 1.02 });
  }

  // 鄉黨相扶 — two or more share a hometown (patriotic cohesion).
  const homes = new Map<string, number>();
  for (const o of party) if (o.hometownCityId) homes.set(o.hometownCityId, (homes.get(o.hometownCityId) ?? 0) + 1);
  if ([...homes.values()].some((n) => n >= 2)) {
    push({ id: 'kinsmen', zh: '鄉黨相扶', en: 'Kinsmen of One Land', descZh: '同鄉子弟,患難相扶', descEn: 'Officers of the same homeland', mul: 1.02 });
  }

  // 老少相濟 — a generational spread (veteran steadiness + youthful drive).
  const births = party.map((o) => o.birthYear).filter((y) => typeof y === 'number');
  if (births.length >= 2 && Math.max(...births) - Math.min(...births) >= 25) {
    push({ id: 'generations', zh: '老少相濟', en: 'Elder & Youth', descZh: '宿將壓陣,少銳爭先', descEn: 'Veteran steadiness meets youthful drive', mul: 1.02 });
  }

  // 同心同德 — a full party (≥3) wholly of one force and highly loyal.
  const forceIds = new Set(party.map((o) => o.forceId));
  const avgLoyalty = party.reduce((s, o) => s + (o.loyalty ?? 0), 0) / party.length;
  if (party.length >= 3 && forceIds.size === 1 && avgLoyalty >= 85) {
    push({ id: 'one-heart', zh: '同心同德', en: 'Of One Heart', descZh: '三軍用命,萬眾一心', descEn: 'A wholly loyal, unified command', mul: 1.02 });
  }

  const raw = out.reduce((s, syn) => s + (syn.mul - 1), 0);
  const powerMul = 1 + Math.min(PARTY_SYNERGY_CAP, raw);
  return { synergies: out, powerMul };
}
