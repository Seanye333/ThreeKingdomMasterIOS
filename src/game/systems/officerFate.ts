import type { City, Force, Officer } from '../types';
import type { FamilyRelation } from '../types/family';
import { recruiterBonus } from './traitEffects';
import { recruitRefusalPenalty, recruitKinshipBonus } from './relationshipEffects';
import { effectivePrestige } from '../data/prestige';

export const RECRUIT_COST = 200;
export const FREE_AGENT_COST = 100;

/** 勸降三策 — how the persuader leans on the prisoner.
 *  - righteous 曉以大義: halves the resistance of the principled (loyal,
 *    noble, patriotic…) but forfeits every venal opening; lifts the
 *    noble hard-cap. The approach for men of honor.
 *  - riches 許以重利: a fat purse — costs double, adds a flat sweetener,
 *    and works wonders on the greedy; the incorruptible despise it twice
 *    as hard.
 *  - feeling 以情動人: leans on friendship — the captive's best rapport
 *    with anyone in YOUR camp converts to odds; home soil counts double.
 *  Omitted = the classic blended attempt (back-compat). */
export type PersuasionApproach = 'righteous' | 'riches' | 'feeling';

export interface RecruitInput {
  officer: Officer;
  city: City;
  recruiterForce: Force;
  recruiterRuler: Officer;
  /** Optional force-wide reputation snapshot (count of cities owned).
   *  Bigger forces persuade more easily; can be supplied by the store. */
  recruiterReputation?: { citiesOwned: number };
  approach?: PersuasionApproach;
  /** Highest rapport between the captive and any officer of the
   *  recruiting force — fuels the 以情動人 approach. */
  bestRapportWithCaptors?: number;
  /** 舌戰得勝 — a won war of words opens doors gold cannot (one shot). */
  debateWon?: boolean;
  rng?: () => number;
}

export interface RecruitOutput {
  ok: boolean;
  message: string;
  recruitedOfficer?: Officer;
  /** Surfaced for tooltips/UI — the success probability we rolled against. */
  chance?: number;
}

/**
 * How much each personality trait moves the recruit-difficulty needle.
 * Positive = easier to flip; negative = harder.
 */
const TRAIT_MOD: Partial<Record<string, number>> = {
  // Easy to flip
  greedy:           +0.15,
  ambitious:        +0.10,
  cowardly:         +0.10,
  drunkard:         +0.05,
  vainglorious:     +0.10,
  jealous:          +0.10,
  lazy:             +0.05,
  // Phase-37 additions
  'crowd-pleaser':  +0.05,
  'fame-seeker':    +0.10,  // (alias if added; harmless if missing)
  approachable:     +0.05,
  smooth:           +0.05,
  // Hard to flip
  loyal:            -0.30,
  noble:            -0.25,
  filial:           -0.20,
  pious:            -0.15,
  ironhearted:      -0.25,
  stubborn:         -0.10,
  chivalrous:       -0.10,
  // Phase-37 additions
  haughty:          -0.10,  // looks down on lesser men
  aloof:            -0.10,
  'iron-bone':      -0.20,  // 鐵骨 — won't bend under pressure
  incorruptible:    -0.25,  // 廉潔 — refuses gold
  'honor-bound':    -0.20,  // 重義 — repaying favors trumps gold
  ascetic:          -0.15,  // 寡欲 — bribes have no effect
  patriotic:        -0.30,  // 愛國 — won't betray Han if their lord is Han
  'jade-heart':     -0.20,  // 玉心 — immune to corruption
  // Hostile to the recruiter's character
  suspicious:       -0.05,
  arrogant:         -0.05,
  vengeful:         -0.10,
  paranoid:         -0.10,
};

const ANTI_GOLD_TRAITS = new Set(['incorruptible', 'ascetic', 'jade-heart', 'noble', 'honor-bound']);

function traitBonus(traits: string[] | undefined, approach?: PersuasionApproach): number {
  if (!traits) return 0;
  let sum = 0;
  for (const t of traits) {
    let v = TRAIT_MOD[t] ?? 0;
    if (approach === 'righteous') {
      // Appealing to principle: venal openings don't apply, and the
      // principled resist only half as hard.
      v = v > 0 ? 0 : v * 0.5;
    } else if (approach === 'riches' && v < 0 && ANTI_GOLD_TRAITS.has(t)) {
      v *= 2; // waving gold at the incorruptible is an insult
    }
    sum += v;
  }
  return sum;
}

function hometownBonus(officer: Officer, city: City): number {
  // When the recruit is happening AT the officer's hometown, give a flat
  // bonus — being home softens resistance.
  return officer.locationCityId === city.id ? +0.10 : 0;
}

function reputationBonus(rep: { citiesOwned: number } | undefined): number {
  if (!rep) return 0;
  // A 1-city upstart gets nothing. A 10-city warlord gets +0.10.
  // A 30-city near-emperor gets +0.20, capped.
  return Math.min(0.20, rep.citiesOwned * 0.01);
}

/** Famous names draw talent — a lord's own 威名 eases recruitment. */
const TOP_PRESTIGE = new Set(['tiger-general', 'royal-aide', 'able-minister', 'famed-general']);
export function prestigeRecruitBonus(recruiterRuler: Officer): number {
  const title = effectivePrestige(recruiterRuler);
  if (!title) return 0;
  return TOP_PRESTIGE.has(title.id) ? 0.08 : 0.04;
}

/** The cost of one attempt under a given approach (利 pays double). */
export function recruitCostFor(approach?: PersuasionApproach): number {
  return approach === 'riches' ? RECRUIT_COST * 2 : RECRUIT_COST;
}

/** The success odds an attempt would roll against — surfaced to the UI
 *  so the three approaches can be compared before spending the gold. */
export function estimateRecruitChance(input: Omit<RecruitInput, 'rng'>): number {
  const { officer, city, recruiterRuler, recruiterReputation, approach } = input;
  const persuasion = recruiterRuler.stats.charisma;
  const resistance = officer.loyalty;
  let chance = (persuasion - resistance + 50) / 100;
  if (approach === 'righteous') chance -= 0.05; // principle starts colder
  if (approach === 'riches') chance += 0.18;    // gold opens doors…
  chance += traitBonus(officer.traits as string[] | undefined, approach);
  const home = hometownBonus(officer, city);
  chance += approach === 'feeling' ? home * 2 : home;
  if (approach === 'feeling') chance += (input.bestRapportWithCaptors ?? 0) / 180;
  chance += reputationBonus(recruiterReputation);
  chance += prestigeRecruitBonus(recruiterRuler);
  // 'noble' caps gold-flavored persuasion; an appeal to principle can
  // still reach them.
  if ((officer.traits ?? []).includes('noble')) {
    chance = Math.min(chance, approach === 'righteous' ? 0.35 : 0.15);
  }
  // A won debate pierces even principle — they argued, and lost.
  if (input.debateWon) chance = Math.min(0.95, chance + 0.28);
  return clamp01(chance);
}

export function attemptRecruit(input: RecruitInput): RecruitOutput {
  const rng = input.rng ?? Math.random;
  const { officer, city, recruiterForce, recruiterRuler } = input;

  if (officer.status !== 'imprisoned') {
    return { ok: false, message: 'Officer is not a captive.' };
  }
  if (city.gold < recruitCostFor(input.approach)) {
    return { ok: false, message: 'Not enough gold to attempt recruitment.' };
  }

  const persuasion = recruiterRuler.stats.charisma;
  const chance = estimateRecruitChance(input);

  const roll = rng();
  if (roll < chance) {
    const recruited: Officer = {
      ...officer,
      status: 'idle',
      forceId: recruiterForce.id,
      locationCityId: city.id,
      loyalty: Math.max(40, Math.floor(persuasion * 0.7)),
      task: null,
    };
    return {
      ok: true,
      chance,
      message: `${officer.name.en} bows and pledges service to ${recruiterForce.name.en}.`,
      recruitedOfficer: recruited,
    };
  }

  return {
    ok: false,
    chance,
    message: `${officer.name.en} refused. ${recruitCostFor(input.approach)} gold spent.`,
  };
}

export interface FreeAgentRecruitInput {
  officer: Officer;
  city: City;
  recruiterForce: Force;
  recruiterRuler: Officer;
  recruiterReputation?: { citiesOwned: number };
  /** Runtime family for kinship recruit bonus (R1). */
  family?: FamilyRelation[];
  /** Player invites are free (the AI still pays); skip the cost gate. */
  free?: boolean;
  /** 舌戰得勝 — a won war of words sways even the reluctant (one shot). */
  debateWon?: boolean;
  /** 賄賂 — gold-bought goodwill (already paid by the caller); flat odds. */
  bribeBonus?: number;
  rng?: () => number;
}

export function attemptFreeAgentRecruit(
  input: FreeAgentRecruitInput,
): RecruitOutput {
  const rng = input.rng ?? Math.random;
  const { officer, city, recruiterForce, recruiterRuler, recruiterReputation, family } = input;

  if (officer.status !== 'idle' || officer.forceId !== null) {
    return { ok: false, message: 'Officer is not a free agent.' };
  }
  if (!input.free && city.gold < FREE_AGENT_COST) {
    return { ok: false, message: 'Not enough gold to offer them service.' };
  }

  // Free agents — base on charisma, modified by traits and reputation.
  let chance = (recruiterRuler.stats.charisma + 20) / 100;
  chance += traitBonus(officer.traits as string[] | undefined);
  chance += hometownBonus(officer, city);
  chance += reputationBonus(recruiterReputation);
  chance += prestigeRecruitBonus(recruiterRuler);
  // T9 — recruiter's own personality (charming/noble/imperial-blood)
  chance += recruiterBonus(recruiterRuler);
  // R1 — relationship-based: personal enemy refuses, sworn brother / family eager
  chance += recruitRefusalPenalty(officer.id, recruiterRuler.id);
  chance += recruitKinshipBonus(officer.id, recruiterRuler.id, family ?? []);
  // 'noble' free agent: harder, won't accept just because you're rich.
  if ((officer.traits ?? []).includes('noble')) chance -= 0.10;
  // 舌戰 / 賄賂 escalation after a first refusal.
  if (input.debateWon) chance += 0.28;
  chance += input.bribeBonus ?? 0;
  chance = clamp01(chance);

  if (rng() < chance) {
    const recruited: Officer = {
      ...officer,
      status: 'idle',
      forceId: recruiterForce.id,
      locationCityId: city.id,
      loyalty: Math.max(60, Math.floor(recruiterRuler.stats.charisma * 0.8)),
      task: null,
    };
    return {
      ok: true,
      chance,
      message: `${officer.name.en} accepts a place in ${recruiterForce.name.en}.`,
      recruitedOfficer: recruited,
    };
  }

  return {
    ok: false,
    chance,
    message: `${officer.name.en} declines and slips away. ${FREE_AGENT_COST} gold spent.`,
  };
}

/** Pure preview — what's the chance, given inputs, without rolling? */
export function previewRecruitChance(
  officer: Officer,
  city: City,
  recruiterRuler: Officer,
  recruiterReputation?: { citiesOwned: number },
  mode: 'captive' | 'free' = 'free',
): number {
  let chance: number;
  if (mode === 'captive') {
    chance = (recruiterRuler.stats.charisma - officer.loyalty + 50) / 100;
  } else {
    chance = (recruiterRuler.stats.charisma + 20) / 100;
  }
  chance += traitBonus(officer.traits as string[] | undefined);
  chance += hometownBonus(officer, city);
  chance += reputationBonus(recruiterReputation);
  chance += prestigeRecruitBonus(recruiterRuler);
  if ((officer.traits ?? []).includes('noble')) {
    chance = mode === 'captive' ? Math.min(chance, 0.15) : chance - 0.10;
  }
  return clamp01(chance);
}

export function applyExecute(officer: Officer): Officer {
  return {
    ...officer,
    status: 'dead',
    forceId: null,
    locationCityId: null,
    task: null,
    capturedFromForceId: undefined,
  };
}

export function applyRelease(officer: Officer): Officer {
  return {
    ...officer,
    status: 'idle',
    forceId: null,
    task: null,
    capturedFromForceId: undefined,
  };
}

function clamp01(v: number): number {
  return Math.max(0.05, Math.min(0.95, v));
}
