import type { City, EntityId, ReportEntry, Season } from '../types';
import { CITY_SPECIALTY, SPECIALTY_ROLE, citySpecialty } from '../data/specialties';

/**
 * 名物盛衰 — regional economic shocks keyed to a city's signature good. A horse
 * frontier suffers 馬瘟, a pearl bed runs dry (珠枯), locusts strip the grain
 * basins (蝗災), and now and then a bumper year (豐年) gluts a famous trade.
 * They make the specialty map dynamic and reward spreading your holdings across
 * more than one good. One-shot effects on the struck city — no lingering state.
 *
 * Rolled once per season (after the harvest) for the WHOLE map, AI included.
 */
export interface SpecialtyEventInput {
  cities: Record<EntityId, City>;
  rng: () => number;
  season: Season;
  /** Famine/plague frequency knob ('low' ×0.5 … 'high' ×1.5). */
  calamityMul?: number;
}

export interface SpecialtyEventOutput {
  cities: Record<EntityId, City>;
  entries: ReportEntry[];
}

function entry(city: City, kind: ReportEntry['kind'], zh: string, en: string): ReportEntry {
  return { cityId: city.id, kind, text: `${city.name.en}: ${en}`, textZh: `${city.name.zh}：${zh}` };
}

export function rollSpecialtyEvents(input: SpecialtyEventInput): SpecialtyEventOutput {
  const cities = { ...input.cities };
  const entries: ReportEntry[] = [];
  const mul = input.calamityMul ?? 1;

  // ~20% of seasons carry one regional event (scaled by the calamity knob).
  if (input.rng() > 0.2 * mul) return { cities, entries };

  // Pick an owned, non-ruined city that actually makes a famous good.
  const pool = Object.values(cities).filter((c) => c.ownerForceId && !c.ruined && CITY_SPECIALTY[c.id]);
  if (pool.length === 0) return { cities, entries };
  const c = pool[Math.floor(input.rng() * pool.length)];
  const sid = CITY_SPECIALTY[c.id]!;
  const role = SPECIALTY_ROLE[sid];
  const spec = citySpecialty(c.id)!;
  // A bumper year is a touch rarer than a shock (45% good, 55% bad).
  const good = input.rng() < 0.45;

  if (good) {
    // ── 豐年/盛市 — a windfall in the city's signature trade ──
    if (role === 'warhorse') {
      const gain = 500 + Math.floor(input.rng() * 900);
      cities[c.id] = { ...c, warhorses: Math.min(6000, (c.warhorses ?? 0) + gain) };
      entries.push(entry(c, 'harvest', `水草豐美,馬群大蕃 +${gain.toLocaleString()} 戰馬。`, `lush pasture — the herds swell by ${gain.toLocaleString()} warhorses.`));
    } else if (role === 'iron') {
      const gain = 600 + Math.floor(input.rng() * 1000);
      cities[c.id] = { ...c, iron: Math.min(8000, (c.iron ?? 0) + gain) };
      entries.push(entry(c, 'harvest', `礦脈新得,冶鐵大進 +${gain.toLocaleString()} 鐵。`, `a rich new seam — +${gain.toLocaleString()} iron smelted.`));
    } else if (role === 'medicine') {
      const gain = 300 + Math.floor(input.rng() * 500);
      cities[c.id] = { ...c, medicine: Math.min(4000, (c.medicine ?? 0) + gain) };
      entries.push(entry(c, 'harvest', `藥圃豐收 +${gain.toLocaleString()} 藥材。`, `a bumper herb harvest — +${gain.toLocaleString()} medicine.`));
    } else if (spec.foodMul > 1) {
      const gain = 1500 + Math.floor(input.rng() * 2500);
      cities[c.id] = { ...c, food: c.food + gain, loyalty: Math.min(100, c.loyalty + 2) };
      entries.push(entry(c, 'harvest', `${spec.zh}豐年,倉廩充實 +${gain.toLocaleString()} 糧,民心 +2。`, `a bumper ${spec.zh} year — +${gain.toLocaleString()} grain, +2 loyalty.`));
    } else {
      const gain = 600 + Math.floor(input.rng() * 1200);
      cities[c.id] = { ...c, gold: c.gold + gain, loyalty: Math.min(100, c.loyalty + 1) };
      entries.push(entry(c, 'income', `${spec.zh}行情大好,商賈雲集 +${gain.toLocaleString()} 金。`, `${spec.zh} trade booms — +${gain.toLocaleString()} gold.`));
    }
    return { cities, entries };
  }

  // ── 衰歇/災疫 — a shock that strikes the signature trade ──
  if (role === 'warhorse') {
    const lost = Math.floor((c.warhorses ?? 0) * (0.35 + input.rng() * 0.25));
    cities[c.id] = { ...c, warhorses: Math.max(0, (c.warhorses ?? 0) - lost), loyalty: Math.max(0, c.loyalty - 3) };
    entries.push(entry(c, 'plague', `馬瘟流行,斃馬 ${lost.toLocaleString()},民心 −3。`, `horse plague — ${lost.toLocaleString()} mounts lost, −3 loyalty.`));
  } else if (role === 'iron') {
    const lost = Math.floor((c.iron ?? 0) * (0.3 + input.rng() * 0.3));
    cities[c.id] = { ...c, iron: Math.max(0, (c.iron ?? 0) - lost) };
    entries.push(entry(c, 'famine', `礦脈崩陷,鐵儲 −${lost.toLocaleString()},冶事中輟。`, `a mine collapse — ${lost.toLocaleString()} iron lost.`));
  } else if (spec.foodMul > 1) {
    const lostFood = Math.floor(c.food * (0.2 + input.rng() * 0.25));
    const lostPop = Math.floor(c.population * 0.02);
    cities[c.id] = { ...c, food: Math.max(0, c.food - lostFood), population: Math.max(1000, c.population - lostPop), loyalty: Math.max(0, c.loyalty - 3) };
    entries.push(entry(c, 'famine', `蝗災蔽天,${spec.zh}歉收 −${lostFood.toLocaleString()} 糧,流亡 ${lostPop.toLocaleString()},民心 −3。`, `a locust plague ravages the ${spec.zh} fields — −${lostFood.toLocaleString()} grain, −${lostPop.toLocaleString()} people.`));
  } else {
    // luxury / salt / copper / fish — the trade itself collapses for a season.
    const lostGold = Math.floor(c.gold * (0.25 + input.rng() * 0.25)) + 200;
    cities[c.id] = { ...c, gold: Math.max(0, c.gold - lostGold), loyalty: Math.max(0, c.loyalty - 2) };
    const zh = role === 'rations' ? '鹽井涸竭' : role === 'coin' ? '錢法大壞' : sid === 'pearl' ? '珠枯不還' : sid === 'silk' || sid === 'brocade' ? '蠶災絲貴' : `${spec.zh}市衰`;
    entries.push(entry(c, 'note', `${zh},${spec.zh}之利驟減 −${lostGold.toLocaleString()} 金,民心 −2。`, `${spec.zh} trade collapses — −${lostGold.toLocaleString()} gold, −2 loyalty.`));
  }
  return { cities, entries };
}
