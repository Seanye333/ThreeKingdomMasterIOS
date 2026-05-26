import type { EntityId, HeroicDeeds, Officer, ReportEntry } from '../types';

/**
 * Per-officer epithets ("deed titles") earned by crossing thresholds in
 * specific 武功榜 stats. Distinct from civic/military titles (which are
 * assigned positions). These are honorifics — once earned, never lost.
 */
export interface DeedTitle {
  id: string;
  name: { zh: string; en: string };
  stat: keyof Pick<
    HeroicDeeds,
    | 'killsTroops'
    | 'duelsWon'
    | 'captured'
    | 'citiesTaken'
    | 'espionageSuccess'
    | 'civicWorks'
    | 'battlesWon'
    | 'trainingsCompleted'
    | 'childrenSired'
  >;
  threshold: number;
  /** Optional loyalty bonus when serving any lord (one-shot on grant). */
  loyaltyOnGrant?: number;
}

export const DEED_TITLES: DeedTitle[] = [
  // Killing fields
  { id: 'slayer-thousand',     name: { zh: '千人斬', en: 'Slayer of a Thousand' },     stat: 'killsTroops',        threshold: 1000,  loyaltyOnGrant: 2 },
  { id: 'slayer-myriad',       name: { zh: '萬人敵', en: 'Slayer of Ten Thousand' },   stat: 'killsTroops',        threshold: 10000, loyaltyOnGrant: 4 },
  { id: 'flying-general',      name: { zh: '飛將', en: 'Flying General' },             stat: 'killsTroops',        threshold: 50000, loyaltyOnGrant: 6 },
  // Duels
  { id: 'champion',            name: { zh: '武勇之將', en: 'Champion of Single Combat' }, stat: 'duelsWon',         threshold: 5,     loyaltyOnGrant: 3 },
  { id: 'peerless',            name: { zh: '無雙', en: 'Peerless' },                   stat: 'duelsWon',           threshold: 15,    loyaltyOnGrant: 5 },
  // Captures
  { id: 'captor',              name: { zh: '擒將', en: 'Captor of Generals' },         stat: 'captured',           threshold: 3,     loyaltyOnGrant: 2 },
  { id: 'great-captor',        name: { zh: '大擒手', en: 'Great Capturer' },           stat: 'captured',           threshold: 10,    loyaltyOnGrant: 4 },
  // Sieges
  { id: 'sieger',              name: { zh: '攻城將', en: 'Sieger' },                   stat: 'citiesTaken',        threshold: 3,     loyaltyOnGrant: 3 },
  { id: 'hundred-city',        name: { zh: '百城將', en: 'Hundred-City General' },     stat: 'citiesTaken',        threshold: 10,    loyaltyOnGrant: 6 },
  // Espionage
  { id: 'schemer',             name: { zh: '謀士', en: 'Schemer' },                    stat: 'espionageSuccess',   threshold: 3,     loyaltyOnGrant: 2 },
  { id: 'demon-strategist',    name: { zh: '鬼謀', en: 'Demon Strategist' },           stat: 'espionageSuccess',   threshold: 10,    loyaltyOnGrant: 5 },
  // Civic
  { id: 'steady-admin',        name: { zh: '治世能臣', en: 'Steady Administrator' },   stat: 'civicWorks',         threshold: 20,    loyaltyOnGrant: 2 },
  { id: 'royal-aide',          name: { zh: '王佐之才', en: 'Royal Aide' },             stat: 'civicWorks',         threshold: 50,    loyaltyOnGrant: 5 },
  // Career
  { id: 'always-victorious',   name: { zh: '常勝', en: 'Always Victorious' },          stat: 'battlesWon',         threshold: 10,    loyaltyOnGrant: 3 },
  { id: 'famed-general',       name: { zh: '名將', en: 'Famed General' },              stat: 'battlesWon',         threshold: 30,    loyaltyOnGrant: 6 },
  // Mentor / family
  { id: 'mentor',              name: { zh: '師者', en: 'Mentor' },                     stat: 'trainingsCompleted', threshold: 5,     loyaltyOnGrant: 2 },
  { id: 'father-of-many',      name: { zh: '多子多孫', en: 'Father of Many' },         stat: 'childrenSired',      threshold: 3,     loyaltyOnGrant: 2 },
];

export const DEED_TITLES_BY_ID: Record<string, DeedTitle> = Object.fromEntries(
  DEED_TITLES.map((t) => [t.id, t]),
);

/**
 * Inspect every officer's deeds, grant any newly-earned titles. Returns
 * the updated deeds + officers (loyalty bumps) + report entries for each
 * grant. Idempotent: titles already in deeds.titles are skipped.
 */
export function grantDeedTitles(
  deeds: Record<EntityId, HeroicDeeds>,
  officers: Record<EntityId, Officer>,
): {
  deeds: Record<EntityId, HeroicDeeds>;
  officers: Record<EntityId, Officer>;
  entries: ReportEntry[];
} {
  const nextDeeds = { ...deeds };
  const nextOfficers = { ...officers };
  const entries: ReportEntry[] = [];

  for (const d of Object.values(deeds)) {
    const o = officers[d.officerId];
    if (!o || o.status === 'dead') continue;
    const have = new Set(d.titles ?? []);
    let earned: string[] | null = null;
    let loyaltyBump = 0;
    for (const title of DEED_TITLES) {
      if (have.has(title.id)) continue;
      if ((d[title.stat] ?? 0) < title.threshold) continue;
      if (!earned) earned = [...(d.titles ?? [])];
      earned.push(title.id);
      loyaltyBump += title.loyaltyOnGrant ?? 0;
      entries.push({
        cityId: o.locationCityId,
        kind: 'talent',
        text: `${o.name.en} earns the epithet "${title.name.en}".`,
        textZh: `${o.name.zh}得號「${title.name.zh}」。`,
      });
    }
    if (earned) {
      nextDeeds[d.officerId] = { ...d, titles: earned };
      if (loyaltyBump > 0) {
        nextOfficers[o.id] = {
          ...o,
          loyalty: Math.min(100, o.loyalty + loyaltyBump),
        };
      }
    }
  }

  return { deeds: nextDeeds, officers: nextOfficers, entries };
}
