import type { BilingualName, EntityId, Officer } from '../types';

/**
 * 門閥世族 — the great aristocratic clans whose members recur across the
 * roster and whose collective weight shapes a realm's politics. Membership is
 * an explicit, curated id set (NOT surname matching — 王平 of 巴西 is no kin to
 * 琅琊王氏), each clan carrying its 郡望 (seat) and the standing perks it lends a
 * realm that keeps it content. See systems/clans.ts for the live loop.
 */
export interface Clan {
  id: string;
  name: BilingualName;
  /** 郡望 — the clan's ancestral seat, for flavor. */
  seat: BilingualName;
  /** Curated member officer ids. */
  members: EntityId[];
  /** Standing perks a realm enjoys while this clan is content & in service. */
  perk: {
    /** Recruit-success bonus (访贤/劝降) lent to the realm. */
    recruitBonus: number;
    /** Internal-affairs multiplier bump (clans run the bureaucracy). */
    internalBonus: number;
  };
}

export const CLANS: Clan[] = [
  {
    id: 'sima',
    name: { zh: '司馬氏', en: 'Sima Clan' },
    seat: { zh: '河內', en: 'Henei' },
    members: ['sima-yi', 'sima-shi', 'sima-zhao', 'sima-yan', 'sima-fu'],
    perk: { recruitBonus: 0.08, internalBonus: 0.05 },
  },
  {
    id: 'yuan',
    name: { zh: '袁氏', en: 'Yuan Clan' },
    seat: { zh: '汝南', en: 'Runan' },
    members: ['yuan-shao', 'yuan-shu', 'yuan-tan', 'yuan-shang', 'yuan-xi'],
    perk: { recruitBonus: 0.1, internalBonus: 0.04 },
  },
  {
    id: 'xun',
    name: { zh: '荀氏', en: 'Xun Clan' },
    seat: { zh: '潁川', en: 'Yingchuan' },
    members: ['xun-yu', 'xun-you', 'xun-chen'],
    perk: { recruitBonus: 0.06, internalBonus: 0.08 },
  },
  {
    id: 'zhuge',
    name: { zh: '諸葛氏', en: 'Zhuge Clan' },
    seat: { zh: '琅琊', en: 'Langya' },
    members: ['zhuge-liang', 'zhuge-jin', 'zhuge-ke', 'zhuge-dan'],
    perk: { recruitBonus: 0.05, internalBonus: 0.07 },
  },
  {
    id: 'chen',
    name: { zh: '陳氏', en: 'Chen Clan' },
    seat: { zh: '潁川', en: 'Yingchuan' },
    members: ['chen-qun', 'chen-tai', 'chen-deng'],
    perk: { recruitBonus: 0.05, internalBonus: 0.07 },
  },
  {
    id: 'yang',
    name: { zh: '楊氏', en: 'Yang Clan' },
    seat: { zh: '弘農', en: 'Hongnong' },
    members: ['yang-xiu', 'yang-biao'],
    perk: { recruitBonus: 0.05, internalBonus: 0.05 },
  },
  {
    id: 'zhong',
    name: { zh: '鍾氏', en: 'Zhong Clan' },
    seat: { zh: '潁川', en: 'Yingchuan' },
    members: ['zhong-yao', 'zhong-hui'],
    perk: { recruitBonus: 0.04, internalBonus: 0.06 },
  },
  {
    id: 'cui',
    name: { zh: '崔氏', en: 'Cui Clan' },
    seat: { zh: '清河', en: 'Qinghe' },
    members: ['cui-yan', 'cui-zhouping', 'cui-zhou-ping'],
    perk: { recruitBonus: 0.05, internalBonus: 0.06 },
  },
  {
    id: 'wang',
    name: { zh: '王氏', en: 'Wang Clan' },
    seat: { zh: '琅琊・東海', en: 'Langya / Donghai' },
    members: ['wang-lang', 'wang-su', 'wang-xiang'],
    perk: { recruitBonus: 0.05, internalBonus: 0.06 },
  },
];

export const CLANS_BY_ID: Record<string, Clan> = Object.fromEntries(
  CLANS.map((c) => [c.id, c]),
);

const CLAN_OF_OFFICER: Record<EntityId, string> = (() => {
  const m: Record<EntityId, string> = {};
  for (const c of CLANS) for (const id of c.members) m[id] = c.id;
  return m;
})();

/** The clan id an officer belongs to, or null for the unaffiliated. */
export function clanOf(o: Officer | undefined | null): string | null {
  return o ? CLAN_OF_OFFICER[o.id] ?? null : null;
}

/** 寒門 — an officer of humble birth, with no great-clan backing. Commoner-
 *  generated officers (id `commoner-*`) and unaffiliated named officers both
 *  count as non-aristocratic, but only the generated nobodies are true 寒門. */
export function isCommoner(o: Officer | undefined | null): boolean {
  return !!o && o.id.startsWith('commoner-');
}

/** Whether an officer carries great-clan blood. */
export function isAristocrat(o: Officer | undefined | null): boolean {
  return clanOf(o) !== null;
}
