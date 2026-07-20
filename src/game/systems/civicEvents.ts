/**
 * 內政事件 — civic events that turn the internal-affairs stats (貪腐/練度/屯田)
 * from background numbers into moments the player remembers in the season report.
 *
 * These are recurring, stat-driven, auto-resolved events (distinct from the
 * one-shot scripted history beats in historicalEvents.ts). Each owned city can
 * fire at most ONE civic event per season, checked in priority order:
 *
 *   - 貪腐醜聞  (corruption ≥ 55) — a graft scandal erupts: an official absconds
 *                with public funds, loyalty craters. The PUNISHMENT for letting
 *                corruption fester; the cure is the 巡查肅貪 command.
 *   - 校場揚威  (drill ≥ 80)      — a grand military review lifts public spirit.
 *   - 屯田豐收  (autumn, big garrison + sound agriculture) — the soldier-farms
 *                bring in a bumper harvest of grain.
 *   ── 2026-07, the §1.11–§1.14 civic meters ──
 *   - 冤獄平反  (caseload ≥ 70) — a capable magistrate overturns a wrongful
 *                conviction; the city takes heart and the docket eases.
 *   - 豪強蔭附  (hidden ≥ 25) — a great house openly enrols a whole village as
 *                its tenants; the registers thin further and the people notice.
 *   - 米價騰貴  (hoard ≥ 25) — the corner bites: bread riots at the granary gate.
 *   - 義倉施粥  (hoard ≥ 15 AND a well-loved city) — the local gentry break their
 *                own hoard to feed the poor. Grace happens too.
 *   - 童謠載道  (culture ≥ 45) — a rhyme in the streets carries the realm's name
 *                further than a proclamation.
 *
 * Pure & deterministic given the rng; the caller (resolution.ts) commits the
 * returned city patches and report entries.
 */
import type { City, EntityId, ReportEntry } from '../types';

export interface CivicEventOutput {
  cities: Record<EntityId, City>;
  entries: ReportEntry[];
}

const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, n));

export function rollCivicEvents(input: {
  cities: Record<EntityId, City>;
  season: string;
  rng: () => number;
  /** Used only to flavour-tag the player's own events; effects are identical. */
  playerForceId?: EntityId | null;
}): CivicEventOutput {
  const { season, rng } = input;
  const cities = { ...input.cities };
  const entries: ReportEntry[] = [];

  for (const city of Object.values(input.cities)) {
    if (!city.ownerForceId) continue;

    // ── 貪腐醜聞 — graft scandal (the cost of neglecting 巡查肅貪) ──
    const corruption = city.corruption ?? 0;
    if (corruption >= 55 && rng() < corruption / 400) {
      const stolen = Math.min(city.gold, Math.round(200 + corruption * 12));
      const loyaltyHit = 4;
      cities[city.id] = {
        ...cities[city.id],
        gold: Math.max(0, cities[city.id].gold - stolen),
        loyalty: clamp(cities[city.id].loyalty - loyaltyHit, 0, 100),
        // Exposed in the open — graft drops some, but the rot isn't cleared
        // (only 巡查肅貪 does that properly).
        corruption: clamp(corruption - 10, 0, 100),
      };
      entries.push({
        cityId: city.id,
        kind: 'note',
        text: `${city.name.en}: a corruption scandal — an official absconded with ${stolen}g of public funds; the people seethe (loyalty −${loyaltyHit}). Order 巡查肅貪 to root out the rest.`,
        textZh: `${city.name.zh}:貪腐醜聞爆發 —— 貪官攜公帑 ${stolen} 金潛逃,民怨沸騰(民忠 −${loyaltyHit})。宜速遣員巡查肅貪。`,
      });
      continue;
    }

    // ── 校場揚威 — a grand review of a well-drilled garrison ──
    const drill = city.drill ?? 0;
    if (drill >= 80 && rng() < 0.15) {
      const loyaltyGain = 2;
      cities[city.id] = {
        ...cities[city.id],
        loyalty: clamp(cities[city.id].loyalty + loyaltyGain, 0, 100),
      };
      entries.push({
        cityId: city.id,
        kind: 'edict',
        text: `${city.name.en}: a grand muster on the drill-ground — the garrison's discipline awes the populace (loyalty +${loyaltyGain}).`,
        textZh: `${city.name.zh}:大閱校場,軍威赫赫,士民振奮(民忠 +${loyaltyGain})。`,
      });
      continue;
    }

    // ── 冤獄平反 — a magistrate overturns a wrongful conviction (§1.11) ──
    const docket = city.caseload ?? 0;
    if (docket >= 70 && rng() < 0.18) {
      const eased = Math.min(docket, 12);
      cities[city.id] = {
        ...cities[city.id],
        caseload: clamp(docket - eased, 0, 100),
        loyalty: clamp(cities[city.id].loyalty + 3, 0, 100),
      };
      entries.push({
        cityId: city.id,
        kind: 'note',
        text: `${city.name.en}: a magistrate reopened an old case and freed an innocent man — the city takes heart (loyalty +3, docket −${eased}).`,
        textZh: `${city.name.zh}:有司重審舊獄,平反冤囚 —— 市人相慶,爭道其名(民忠 +3、積案 −${eased})。`,
      });
      continue;
    }

    // ── 豪強蔭附 — a great house enrols a village off the books (§1.12) ──
    const hidden = city.hiddenHouseholds ?? 0;
    if (hidden >= 25 && rng() < 0.16) {
      cities[city.id] = {
        ...cities[city.id],
        hiddenHouseholds: clamp(hidden + 2, 0, 45),
        loyalty: clamp(cities[city.id].loyalty - 2, 0, 100),
      };
      entries.push({
        cityId: city.id,
        kind: 'note',
        text: `${city.name.en}: a great house openly took a whole village under its wing — the registers thin again (hidden +2, loyalty −2).`,
        textZh: `${city.name.zh}:豪右公然納一村為佃客,版籍益虛(隱戶 +2、民忠 −2)。宜遣吏括戶,或輕其徭役。`,
      });
      continue;
    }

    // ── 米價騰貴 / 義倉施粥 — the corner bites, or the gentry relent (§1.14) ──
    const hoard = city.hoardedGrain ?? 0;
    if (hoard >= 25 && rng() < 0.2) {
      cities[city.id] = {
        ...cities[city.id],
        loyalty: clamp(cities[city.id].loyalty - 4, 0, 100),
      };
      entries.push({
        cityId: city.id,
        kind: 'note',
        text: `${city.name.en}: grain is worth its weight in silver — a crowd broke against the granary gate (loyalty −4).`,
        textZh: `${city.name.zh}:米珠薪桂,饑民鼓譟於倉門之外(民忠 −4)。宜抑兼併,或開常平以平之。`,
      });
      continue;
    }
    if (hoard >= 15 && cities[city.id].loyalty >= 70 && rng() < 0.14) {
      const released = Math.min(hoard, 8);
      cities[city.id] = {
        ...cities[city.id],
        hoardedGrain: clamp(hoard - released, 0, 40),
        loyalty: clamp(cities[city.id].loyalty + 2, 0, 100),
      };
      entries.push({
        cityId: city.id,
        kind: 'edict',
        text: `${city.name.en}: the local gentry opened their own granaries and fed the poor unasked (hoard −${released}, loyalty +2).`,
        textZh: `${city.name.zh}:邑中大姓自發開倉施粥,不待官命(囤積 −${released}、民忠 +2)。`,
      });
      continue;
    }

    // ── 童謠載道 — a lettered city's rhyme travels further than an edict (§1.13) ──
    if ((city.culture ?? 0) >= 45 && rng() < 0.12) {
      cities[city.id] = {
        ...cities[city.id],
        loyalty: clamp(cities[city.id].loyalty + 2, 0, 100),
        culture: clamp((city.culture ?? 0) + 1, 0, 100),
      };
      entries.push({
        cityId: city.id,
        kind: 'edict',
        text: `${city.name.en}: a rhyme about the city's peace is on every child's lips — it travels further than any proclamation (loyalty +2, culture +1).`,
        textZh: `${city.name.zh}:童謠載道,傳頌昇平 —— 較之榜文,行之更遠(民忠 +2、文教 +1)。`,
      });
      continue;
    }

    // ── 屯田豐收 — a bumper harvest from the soldier-farms ──
    if (
      season === 'autumn' &&
      city.troops >= 8000 &&
      city.agriculture >= 60 &&
      rng() < 0.2
    ) {
      const bonusFood = Math.round(city.troops * 0.06);
      cities[city.id] = {
        ...cities[city.id],
        food: cities[city.id].food + bonusFood,
      };
      entries.push({
        cityId: city.id,
        kind: 'edict',
        text: `${city.name.en}: the military farms bring in a bumper harvest — granaries swell (+${bonusFood} food).`,
        textZh: `${city.name.zh}:屯田大熟,軍糧充盈(糧 +${bonusFood})。`,
      });
      continue;
    }
  }

  return { cities, entries };
}
