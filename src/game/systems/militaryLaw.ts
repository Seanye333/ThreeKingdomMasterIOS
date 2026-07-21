/**
 * 軍法・賞罰 (§4.10) — 賞不逾時, 罰不遷列.
 *
 * The game has recorded every officer's deeds since the first campaign: battles
 * won, cities taken, duels, prisoners, heads. It has never asked the one
 * question a lord in this period was judged on — **did you pay for them?**
 *
 * 賞不逾時 (reward before the season turns) is not a proverb about generosity;
 * it is about what happens when you don't. A man who has taken three cities and
 * been given nothing does not simply carry on. His loyalty erodes every season
 * the ledger stays open, and §7.5 is waiting at the bottom of that slope.
 *
 * The mirror is 罰: a commander who has lost armies and answered for none of it
 * teaches everyone else that losing is free.
 *
 * Merit is **derived** from the deeds already tracked, minus what has been paid.
 * There is no new accrual hook anywhere — an officer's outstanding merit is a
 * pure function of his record and your generosity. Pure module; the store pays,
 * resolution.ts charges the resentment.
 */
import type { HeroicDeeds, Officer } from '../types';

/** Outstanding merit at which resentment begins. */
export const MERIT_GRUDGE = 12;
/** …and at which it doubles. */
export const MERIT_GRUDGE_HEAVY = 26;
/** Gold per point of merit when you settle the ledger. */
export const GOLD_PER_MERIT = 55;

/** 軍功 — the whole of what this officer has earned, in one number. */
export function meritScore(deeds: HeroicDeeds | undefined): number {
  if (!deeds) return 0;
  const raw = (deeds.battlesWon ?? 0) * 3
    + (deeds.citiesTaken ?? 0) * 8
    + (deeds.duelsWon ?? 0) * 2
    + (deeds.debateRouts ?? 0) * 2
    + (deeds.captured ?? 0) * 2
    + (deeds.espionageSuccess ?? 0) * 2
    + (deeds.killsTroops ?? 0) / 2000
    + (deeds.civicWorks ?? 0) * 0.5;
  return Math.round(raw * 10) / 10;
}

/** 軍過 — armies lost. */
export function faultScore(deeds: HeroicDeeds | undefined): number {
  return (deeds?.battlesLost ?? 0) * 3;
}

/** What is still owed to this officer. */
export function outstandingMerit(officer: Officer, deeds: HeroicDeeds | undefined): number {
  return Math.max(0, Math.round((meritScore(deeds) - (officer.meritRewarded ?? 0)) * 10) / 10);
}

/** What he has not yet answered for. */
export function outstandingFault(officer: Officer, deeds: HeroicDeeds | undefined): number {
  return Math.max(0, faultScore(deeds) - (officer.faultPunished ?? 0));
}

/**
 * 功高不賞則怨 — the per-season loyalty drift of an unsettled ledger. Small,
 * relentless, and entirely your own doing.
 */
export function meritResentment(outstanding: number): number {
  if (outstanding >= MERIT_GRUDGE_HEAVY) return -2;
  if (outstanding >= MERIT_GRUDGE) return -1;
  return 0;
}

export interface RewardQuote {
  /** Gold the treasury must find. */
  gold: number;
  /** Loyalty the officer gains. */
  loyalty: number;
  /** Experience granted for the recognition. */
  xp: number;
  merit: number;
}

/** 行賞 — settle an officer's account. */
export function rewardQuote(outstanding: number): RewardQuote {
  const merit = Math.max(0, outstanding);
  return {
    gold: Math.round(merit * GOLD_PER_MERIT),
    loyalty: Math.min(18, Math.round(merit * 0.8)),
    xp: Math.round(merit * 12),
    merit,
  };
}

export type PunishmentId = 'admonish' | 'flog' | 'demote' | 'execute';

export interface Punishment {
  id: PunishmentId;
  zh: string;
  en: string;
  motto: string;
  /** Fault points this answers for (Infinity = the whole ledger). */
  clears: number;
  /** Loyalty change for the man punished. */
  loyaltySelf: number;
  /** Loyalty change for every OTHER officer of the force. */
  loyaltyOthers: number;
  /** Seasons of 失威 added. */
  disgrace: number;
  /** He may simply leave rather than accept it (0–1). */
  defectionRisk: number;
  descZh: string;
  descEn: string;
}

export const PUNISHMENTS: Record<PunishmentId, Punishment> = {
  admonish: {
    id: 'admonish', zh: '申飭', en: 'Admonish', motto: '責而不辱',
    clears: 3, loyaltySelf: -1, loyaltyOthers: 0, disgrace: 0, defectionRisk: 0,
    descZh: '當眾責問,不傷其體面。清一次敗績,眾人未必心服。',
    descEn: 'A public rebuke that costs him nothing but pride. Clears one defeat; convinces no one.',
  },
  flog: {
    id: 'flog', zh: '杖責', en: 'Flog', motto: '明法而後戰',
    clears: 6, loyaltySelf: -6, loyaltyOthers: 2, disgrace: 1, defectionRisk: 0.05,
    descZh: '軍前杖之。他記恨,而全軍看見軍法是真的。',
    descEn: 'Beaten before the army. He resents it; everyone else learns the code is real.',
  },
  demote: {
    id: 'demote', zh: '降職', en: 'Demote', motto: '奪其兵柄',
    clears: 12, loyaltySelf: -12, loyaltyOthers: 3, disgrace: 2, defectionRisk: 0.15,
    descZh: '奪其兵柄,以觀後效。重罰,亦是重賭 —— 他可能就此他去。',
    descEn: 'Stripped of command pending better conduct. Heavy — and he may simply leave.',
  },
  execute: {
    id: 'execute', zh: '斬首', en: 'Execute', motto: '揮淚斬馬謖',
    clears: Infinity, loyaltySelf: 0, loyaltyOthers: 5, disgrace: 0, defectionRisk: 0,
    descZh: '斬一人以警百人。軍法自此無人敢試 —— 而你少了一個將。',
    descEn: 'One head to instruct a hundred. No one tests the code again — and you are a general short.',
  },
};

export const PUNISHMENT_ORDER: PunishmentId[] = ['admonish', 'flog', 'demote', 'execute'];

/** Which punishments actually fit the fault on the books. */
export function fittingPunishments(fault: number): PunishmentId[] {
  if (fault <= 0) return [];
  return PUNISHMENT_ORDER.filter((id) => id === 'execute' || fault >= 3 || id === 'admonish');
}

/**
 * 賞罰不明,則士不用命 — the force-wide read on how the ledgers stand. Positive
 * means merit is being paid and faults answered; negative means neither is.
 * Feeds nothing automatically — it is the number the court panel shows you
 * before your best general walks.
 */
export function ledgerHealth(entries: Array<{ merit: number; fault: number }>): {
  owed: number;
  unanswered: number;
  zh: string;
  en: string;
} {
  const owed = Math.round(entries.reduce((s, e) => s + e.merit, 0) * 10) / 10;
  const unanswered = entries.reduce((s, e) => s + e.fault, 0);
  const zh = owed >= 40 ? '功高不賞,人心已動' : owed >= 15 ? '賞有逾時' : unanswered >= 12 ? '罰不及過' : '賞罰分明';
  const en = owed >= 40 ? 'Great merit unpaid — loyalty is slipping' : owed >= 15 ? 'Rewards overdue'
    : unanswered >= 12 ? 'Defeats unanswered' : 'Rewards and penalties are in order';
  return { owed, unanswered, zh, en };
}
