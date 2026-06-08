import type { City, Force, Officer } from '../types';
import type { FamilyRelation } from '../types/family';
import { recruiterBonus } from './traitEffects';
import { recruitRefusalPenalty, recruitKinshipBonus } from './relationshipEffects';
import { effectivePrestige } from '../data/prestige';

export const RECRUIT_COST = 200;
export const FREE_AGENT_COST = 100;

export interface RecruitInput {
  officer: Officer;
  city: City;
  recruiterForce: Force;
  recruiterRuler: Officer;
  /** Optional force-wide reputation snapshot (count of cities owned).
   *  Bigger forces persuade more easily; can be supplied by the store. */
  recruiterReputation?: { citiesOwned: number };
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

function traitBonus(traits: string[] | undefined): number {
  if (!traits) return 0;
  let sum = 0;
  for (const t of traits) sum += TRAIT_MOD[t] ?? 0;
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

export function attemptRecruit(input: RecruitInput): RecruitOutput {
  const rng = input.rng ?? Math.random;
  const { officer, city, recruiterForce, recruiterRuler, recruiterReputation } = input;

  if (officer.status !== 'imprisoned') {
    return { ok: false, message: 'Officer is not a captive.' };
  }
  if (city.gold < RECRUIT_COST) {
    return { ok: false, message: 'Not enough gold to attempt recruitment.' };
  }

  // Base: ruler's charisma vs prisoner's loyalty.
  const persuasion = recruiterRuler.stats.charisma;
  const resistance = officer.loyalty;
  let chance = (persuasion - resistance + 50) / 100;
  chance += traitBonus(officer.traits as string[] | undefined);
  chance += hometownBonus(officer, city);
  chance += reputationBonus(recruiterReputation);
  chance += prestigeRecruitBonus(recruiterRuler);
  // 'noble' trait makes gold-based recruitment impossible.
  if ((officer.traits ?? []).includes('noble')) {
    chance = Math.min(chance, 0.15);
  }
  chance = clamp01(chance);

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
    message: `${officer.name.en} refused. ${RECRUIT_COST} gold spent.`,
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
  if (city.gold < FREE_AGENT_COST) {
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
  };
}

export function applyRelease(officer: Officer): Officer {
  return {
    ...officer,
    status: 'idle',
    forceId: null,
    task: null,
  };
}

function clamp01(v: number): number {
  return Math.max(0.05, Math.min(0.95, v));
}
