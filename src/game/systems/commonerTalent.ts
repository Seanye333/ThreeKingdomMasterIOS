/**
 * 求賢令出寒門 — while a force's Call for Talent rings, commoners answer.
 *
 * Each season a force has the 求賢令 recruit bonus active, there's a
 * chance a brand-new officer of humble birth presents themselves at one
 * of its cities: generated name, modest stats with a real chance of a
 * hidden gem, loyal to whoever gave a nobody a chance. The named-roster
 * world stays intact — these are the unnamed thousands history forgot.
 */
import type { City, EntityId, Officer } from '../types';

export const COMMONER_ARRIVAL_CHANCE = 0.35;

const SURNAMES = ['李', '王', '張', '趙', '陳', '楊', '周', '吳', '徐', '孫', '馬', '胡', '郭', '何', '高', '羅'];
const SURNAMES_EN = ['Li', 'Wang', 'Zhang', 'Zhao', 'Chen', 'Yang', 'Zhou', 'Wu', 'Xu', 'Sun', 'Ma', 'Hu', 'Guo', 'He', 'Gao', 'Luo'];
const GIVEN = ['平', '安', '勝', '達', '通', '威', '霸', '雄', '俊', '傑', '武', '文', '義', '信', '忠', '勇'];
const GIVEN_EN = ['Ping', 'An', 'Sheng', 'Da', 'Tong', 'Wei', 'Ba', 'Xiong', 'Jun', 'Jie', 'Wu', 'Wen', 'Yi', 'Xin', 'Zhong', 'Yong'];

function rollStat(rng: () => number): number {
  // Humble origins: 30–70 typical…
  let v = 30 + Math.floor(rng() * 41);
  // …with a 12% chance of brilliance the gentry never saw coming.
  if (rng() < 0.12) v += 15 + Math.floor(rng() * 21);
  return Math.min(98, v);
}

export function generateCommonerOfficer(input: {
  year: number;
  forceId: EntityId;
  cityId: EntityId;
  /** Existing officer ids — guarantees a fresh id. */
  takenIds: ReadonlySet<string>;
  rng: () => number;
}): Officer {
  const { rng } = input;
  const si = Math.floor(rng() * SURNAMES.length);
  const gi = Math.floor(rng() * GIVEN.length);
  let id = `commoner-${SURNAMES_EN[si].toLowerCase()}-${GIVEN_EN[gi].toLowerCase()}`;
  let n = 2;
  while (input.takenIds.has(id)) id = `commoner-${SURNAMES_EN[si].toLowerCase()}-${GIVEN_EN[gi].toLowerCase()}-${n++}`;
  return {
    id,
    name: { zh: `${SURNAMES[si]}${GIVEN[gi]}`, en: `${SURNAMES_EN[si]} ${GIVEN_EN[gi]}` },
    birthYear: input.year - 18 - Math.floor(rng() * 15),
    stats: {
      leadership: rollStat(rng),
      war: rollStat(rng),
      intelligence: rollStat(rng),
      politics: rollStat(rng),
      charisma: rollStat(rng),
    },
    loyalty: 80, // a nobody given a chance remembers it
    locationCityId: input.cityId,
    forceId: input.forceId,
    status: 'active',
    task: null,
    equipment: [],
    skills: [],
    rank: 'soldier',
  } as Officer;
}

/** Cities eligible to receive a commoner for a force. */
export function commonerArrivalCity(
  cities: Record<EntityId, City>,
  forceId: EntityId,
  rng: () => number,
): City | null {
  const owned = Object.values(cities).filter((c) => c.ownerForceId === forceId);
  if (owned.length === 0) return null;
  return owned[Math.floor(rng() * owned.length)];
}
