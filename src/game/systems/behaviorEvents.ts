import type { City, EntityId, Force, GameDate, Officer, TaxRate } from '../types';
import type { EventEffect, EventChoice, HistoricalEvent } from '../types/event';

/**
 * 動態事件 — emergent events driven by *how the player is playing*, not by the
 * calendar. Each reads the current force/economy/court state and, when a
 * behavioural threshold is crossed, builds a {@link HistoricalEvent} on the fly
 * so it flows through the same firing → EventModal → choice pipeline as scripted
 * history. The player's ruler is set as the chooser, so the decision is theirs.
 *
 * De-duplication is free: the store appends a fired event's `id` to
 * `firedEventIds`, and we skip any id already there — so each behavioural beat
 * fires at most once per campaign. No new persisted state is introduced.
 */
export interface BehaviorEventContext {
  date: GameDate;
  cities: Record<EntityId, City>;
  officers: Record<EntityId, Officer>;
  forces: Record<EntityId, Force>;
  taxPolicy: Record<EntityId, TaxRate>;
  playerForceId: EntityId | null;
  firedEventIds: EntityId[];
  rng?: () => number;
}

const statAvg = (o: Officer): number =>
  (o.stats.leadership + o.stats.war + o.stats.intelligence + o.stats.politics + o.stats.charisma) / 5;

/** A behavioural candidate: a predicate over current state + a builder that
 *  produces the firing event when the predicate holds. */
interface Candidate {
  id: EntityId;
  build: () => HistoricalEvent | null;
}

/**
 * Returns at most one emergent event for this season, or null. Eligible-and-
 * unfired candidates each roll a per-season chance so the beat doesn't fire the
 * very instant a threshold is crossed; since it can only fire once per game, it
 * still lands within a season or two of becoming eligible.
 */
export function rollBehaviorEvent(ctx: BehaviorEventContext): HistoricalEvent | null {
  const { playerForceId } = ctx;
  if (!playerForceId) return null;
  const force = ctx.forces[playerForceId];
  if (!force) return null;
  const rulerId = force.rulerOfficerId;
  const fired = new Set(ctx.firedEventIds);
  const rng = ctx.rng ?? Math.random;

  const cities = Object.values(ctx.cities).filter((c) => c.ownerForceId === playerForceId);
  if (cities.length === 0) return null;
  const totalGold = cities.reduce((a, c) => a + c.gold, 0);
  const avgLoyalty = cities.reduce((a, c) => a + c.loyalty, 0) / cities.length;
  const tax = ctx.taxPolicy[playerForceId] ?? 'normal';
  const idleTalent = Object.values(ctx.officers)
    .filter((o) => o.forceId === playerForceId && o.status === 'idle' && statAvg(o) >= 70)
    .sort((a, b) => statAvg(b) - statAvg(a));

  const cityLoyaltyAll = (delta: number): EventEffect[] =>
    cities.map((c) => ({ kind: 'city-loyalty', cityId: c.id, delta }));

  const candidates: Candidate[] = [
    // 倉廩盈溢 — a swollen treasury invites a choice: spend it on the people,
    // on the army, or sit on it.
    {
      id: 'behavior-treasury',
      build: () => {
        if (totalGold < 8000) return null;
        const choices: EventChoice[] = [
          {
            id: 'feast',
            label: { zh: '大宴群臣,與民同樂', en: 'Hold a grand feast for people and court' },
            effects: [...cityLoyaltyAll(6), { kind: 'force-gold', forceId: playerForceId, delta: -2000 }],
          },
          {
            id: 'arm',
            label: { zh: '充實武備,招兵買馬', en: 'Pour it into the army' },
            effects: [
              { kind: 'force-gold', forceId: playerForceId, delta: -3000 },
              { kind: 'force-troops-multiplier', forceId: playerForceId, multiplier: 1.08 },
            ],
          },
          {
            id: 'hoard',
            label: { zh: '積穀防饑,謹守府庫', en: 'Keep the coffers full against lean years' },
            effects: [],
          },
        ];
        return event(
          'behavior-treasury', rulerId, ctx.date,
          { zh: '倉廩盈溢', en: 'A Swollen Treasury' },
          {
            zh: '府庫充盈,金帛山積。長史進言:「府庫既實,主公何不有所為?」',
            en: 'The granaries are full and gold piles high. Your chief clerk asks: "The coffers brim over, my lord — to what end shall we put them?"',
          },
          choices,
        );
      },
    },

    // 苛政猛於虎 — heavy taxes plus sullen cities force a reckoning.
    {
      id: 'behavior-heavy-tax',
      build: () => {
        if (tax !== 'heavy' || avgLoyalty >= 50 || cities.length < 2) return null;
        const choices: EventChoice[] = [
          {
            id: 'ease',
            label: { zh: '輕徭薄賦,與民休息', en: 'Ease the burden — lighten taxes' },
            effects: cityLoyaltyAll(8),
          },
          {
            id: 'crackdown',
            label: { zh: '嚴刑彈壓,催徵如故', en: 'Hold the line — collect by force' },
            effects: [...cityLoyaltyAll(-5), { kind: 'force-gold', forceId: playerForceId, delta: 1500 }],
          },
        ];
        return event(
          'behavior-heavy-tax', rulerId, ctx.date,
          { zh: '苛政猛於虎', en: 'Taxes Heavier Than a Tiger' },
          {
            zh: '重稅之下,民有菜色,境內怨聲漸起。老吏垂淚諫曰:「苛政猛於虎也。」',
            en: 'Under heavy levies the people grow gaunt and resentment spreads. An old official weeps: "Harsh rule is fiercer than any tiger."',
          },
          choices,
        );
      },
    },

    // 群賢閒置 — a bench of idle talent is a standing reproach (and a risk).
    {
      id: 'behavior-idle-talent',
      build: () => {
        if (idleTalent.length < 3) return null;
        const honored = idleTalent.slice(0, 5);
        const slighted = idleTalent[0];
        const choices: EventChoice[] = [
          {
            id: 'honor',
            label: { zh: '量才授官,以禮待之', en: 'Honour them with posts and stipends' },
            effects: [
              ...honored.map((o): EventEffect => ({ kind: 'officer-loyalty', officerId: o.id, delta: 5 })),
              { kind: 'force-gold', forceId: playerForceId, delta: -1000 },
            ],
          },
          {
            id: 'ignore',
            label: { zh: '置之不理,任其投閒', en: 'Leave them idle' },
            effects: [{ kind: 'officer-loyalty', officerId: slighted.id, delta: -10 }],
          },
        ];
        return event(
          'behavior-idle-talent', rulerId, ctx.date,
          { zh: '群賢閒置', en: 'Talent Left Idle' },
          {
            zh: '帳下賢才雲集,卻多投閒置散。有人嘆曰:「明珠暗投,豈不惜哉?」',
            en: 'Able men crowd your halls, yet many sit unused. One sighs: "Bright pearls cast into the dark — what a waste."',
          },
          choices,
        );
      },
    },
  ];

  for (const cand of candidates) {
    if (fired.has(cand.id)) continue;
    const built = cand.build();
    if (!built) continue;
    // A per-season chance so the beat doesn't fire the instant it's eligible.
    if (rng() < 0.5) return built;
  }
  return null;
}

/** Assemble a behavioural event. Top-level effects stay empty — all consequence
 *  rides on the choices — and the player's ruler is the chooser so the modal
 *  always offers the decision. yearMin/Max are wide; eligibility is decided here,
 *  not by the date window. */
function event(
  id: EntityId,
  rulerId: EntityId,
  _date: GameDate,
  name: { zh: string; en: string },
  desc: { zh: string; en: string },
  choices: EventChoice[],
): HistoricalEvent {
  return {
    id,
    name,
    yearMin: 0,
    yearMax: 9999,
    description: desc.en,
    descriptionZh: desc.zh,
    effects: [],
    chooserRulerId: rulerId,
    choices,
  };
}
