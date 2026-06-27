/**
 * 说客 — turning the interactive 舌戰 into a live strategic verb (§3.4). Instead
 * of five scripted training-ground bouts, a silver-tongued envoy can ride to a
 * REACHABLE rival city and either:
 *   • 说降 (defect): talk a disgruntled enemy officer into crossing over, or
 *   • 游说结盟 (ally): sway a neutral/rival lord into an alliance.
 * The bout itself runs through the existing interactive debate engine; this
 * module decides who is a valid mark and builds the dynamic scenario whose
 * outcome (via scenarioOutcome → applyScenarioEffects) lands real consequences.
 *
 * Reach is grounded: only cities adjacent to one of your own are in play, so a
 * 说客 is a frontier tool, not an everywhere-at-once cheat. The 200-gold cost and
 * the organic fallout (a defection emptied, an alliance struck) gate the spam —
 * no extra persisted state needed.
 */
import type { City, DiplomaticState, EntityId, Force, Officer } from '../types';
import type { DebateDifficulty, DebateTopic } from './wordWar';
import type { DebateScenario, ScenarioEffect } from './debateScenarios';

/** Only the wavering can be talked over; a contented officer won't hear of it. */
export const DEFECT_LOYALTY_MAX = 65;
/** Gold the envoy's city spends to mount the embassy (paid win or lose). */
export const PERSUADE_COST = 200;
/** Cap the mark list so a sprawling frontier doesn't overwhelm the picker. */
const MAX_TARGETS = 14;

export type PersuasionKind = 'defect' | 'ally';

export interface PersuasionTarget {
  kind: PersuasionKind;
  /** The officer you debate (the disgruntled officer, or the rival lord). */
  officerId: EntityId;
  officerName: { zh: string; en: string };
  forceId: EntityId;
  forceName: { zh: string; en: string };
  cityId: EntityId;
  cityName: { zh: string; en: string };
  /** For 说降, how loyal they still are to their lord (lower = easier). */
  loyalty?: number;
  topic: DebateTopic;
  difficulty: DebateDifficulty;
}

function difficultyFor(o: Officer): DebateDifficulty {
  return o.stats.intelligence >= 88 ? 'peerless' : o.stats.intelligence >= 68 ? 'veteran' : 'rookie';
}

/** Cities held by a rival that border one of the player's own — the 说客's reach. */
export function reachableRivalCities(
  cities: Record<EntityId, City>,
  playerForceId: EntityId,
): Set<EntityId> {
  const mine = Object.values(cities).filter((c) => c.ownerForceId === playerForceId);
  const reach = new Set<EntityId>();
  for (const c of mine) {
    for (const nid of c.adjacentCityIds) {
      const n = cities[nid];
      if (n && n.ownerForceId && n.ownerForceId !== playerForceId) reach.add(n.id);
    }
  }
  return reach;
}

export function persuasionTargets(ctx: {
  officers: Record<EntityId, Officer>;
  cities: Record<EntityId, City>;
  forces: Record<EntityId, Force>;
  diplomacy: DiplomaticState;
  playerForceId: EntityId | null;
}): PersuasionTarget[] {
  const { officers, cities, forces, diplomacy, playerForceId } = ctx;
  if (!playerForceId) return [];
  const reach = reachableRivalCities(cities, playerForceId);
  if (reach.size === 0) return [];

  const alliedWith = (fid: EntityId) => {
    const a = playerForceId < fid ? playerForceId : fid;
    const b = playerForceId < fid ? fid : playerForceId;
    return diplomacy.relations[`${a}|${b}`]?.status === 'allied';
  };
  const rulerIds = new Set(Object.values(forces).map((f) => f.rulerOfficerId));
  const nm = (o: Officer) => o.name;

  // 说降 — disgruntled enemy officers (not their lord) in a reachable city.
  const defects: PersuasionTarget[] = Object.values(officers)
    .filter((o) =>
      o.forceId && o.forceId !== playerForceId &&
      (o.status === 'idle' || o.status === 'active') &&
      !rulerIds.has(o.id) &&
      o.loyalty < DEFECT_LOYALTY_MAX &&
      o.locationCityId && reach.has(o.locationCityId))
    .sort((a, b) => a.loyalty - b.loyalty)
    .slice(0, MAX_TARGETS)
    .map((o) => ({
      kind: 'defect' as const,
      officerId: o.id, officerName: nm(o),
      forceId: o.forceId!, forceName: forces[o.forceId!]?.name ?? { zh: '?', en: '?' },
      cityId: o.locationCityId!, cityName: cities[o.locationCityId!]?.name ?? { zh: '?', en: '?' },
      loyalty: o.loyalty,
      topic: 'interest',
      difficulty: difficultyFor(o),
    }));

  // 游说结盟 — a rival/neutral lord whose seat is reachable and not already allied.
  const allies: PersuasionTarget[] = Object.values(forces)
    .filter((f) => f.id !== playerForceId && !alliedWith(f.id))
    .map((f) => officers[f.rulerOfficerId])
    .filter((lord): lord is Officer =>
      !!lord && (lord.status === 'idle' || lord.status === 'active') &&
      !!lord.locationCityId && reach.has(lord.locationCityId))
    .map((lord) => ({
      kind: 'ally' as const,
      officerId: lord.id, officerName: nm(lord),
      forceId: lord.forceId!, forceName: forces[lord.forceId!]?.name ?? { zh: '?', en: '?' },
      cityId: lord.locationCityId!, cityName: cities[lord.locationCityId!]?.name ?? { zh: '?', en: '?' },
      topic: 'strategy',
      difficulty: difficultyFor(lord),
    }));

  return [...defects, ...allies];
}

/** Build the dynamic scenario for a mark — its win/lose/rout effects are the
 *  real consequences the host applies through applyScenarioEffects. */
export function buildPersuasionScenario(target: PersuasionTarget): DebateScenario {
  const oz = target.officerName.zh, oe = target.officerName.en;
  const fz = target.forceName.zh, fe = target.forceName.en;
  if (target.kind === 'defect') {
    return {
      id: `persuade-${target.officerId}`,
      kind: 'persuade-defect',
      titleZh: `說降 ${oz}`, titleEn: `Talk ${oe} Over`,
      introZh: `${fz}麾下的 ${oz} 心懷不滿。曉以利害、辯得他心服,他或願棄暗投明。`,
      introEn: `${oe}, serving ${fe}, harbours resentment. Win him over in debate and he may cross to your banner.`,
      topic: target.topic,
      opponentId: target.officerId,
      winEffects: [
        { kind: 'recruit', targetId: target.officerId, textZh: `${oz}為所動,願率部來投!`, textEn: `${oe} is won over — he brings his command across to you!` },
      ],
      loseEffects: [
        { kind: 'note', textZh: `${oz}不為所動,反生戒心。`, textEn: `${oe} is unmoved — and now wary of you.` },
      ],
      routEffects: [
        { kind: 'note', textZh: `字字誅心,${oz}幡然來歸!`, textEn: `Every word strikes home — ${oe} comes over heart and soul!` },
      ],
    };
  }
  return {
    id: `ally-${target.forceId}`,
    kind: 'sway-neutral',
    titleZh: `游說 ${oz} 結盟`, titleEn: `Sway ${oe} into Alliance`,
    introZh: `${oz}尚在觀望。憑三寸不爛之舌,說動他與你結盟,共抗強敵。`,
    introEn: `${oe} watches and waits. With a silver tongue, talk him into an alliance against the common foe.`,
    topic: target.topic,
    opponentId: target.officerId,
    winEffects: [
      { kind: 'ally', targetId: target.forceId, amount: 40, textZh: `${fz}欣然結盟!`, textEn: `${fe} gladly agrees to an alliance!` },
    ],
    loseEffects: [
      { kind: 'ally', targetId: target.forceId, amount: -8, textZh: `${oz}不為所動,拂袖而去。`, textEn: `${oe} is unmoved and takes his leave.` },
    ],
    routEffects: [
      { kind: 'gold', amount: 300, textZh: `${oz}大為折服,並饋贈軍資 300。`, textEn: `${oe}, thoroughly won over, gifts 300 gold toward the war.` },
    ],
  };
}

// keep ScenarioEffect import meaningful for downstream typing.
export type { ScenarioEffect };
