import type { City, EntityId, Force, GameDate, HistoricalEvent, Officer } from '../types';
import type { EventChoice } from '../types/event';
import type { LawSeverity } from './law';

/**
 * 死諫 — the memorial a man stakes his life on.
 *
 * The realm already had 上書 (§ wishes.ts): an officer ASKS you for something,
 * and you grant or refuse. That is a transaction. This is its opposite — a man
 * who wants nothing for himself, standing in the way of something you have
 * already done, and offering his life as the argument.
 *
 * It only fires over acts that a loyal servant could reasonably die opposing:
 * accepting the Nine Bestowments, taking the imperial style while the Han
 * emperor still breathes, or governing by terror. Those are exactly the moments
 * the game otherwise rewards without friction — you receive 九錫, your officers'
 * loyalty goes UP, and nothing in the realm objects. 荀彧 is the objection.
 *
 * Built as a season-reaction in the shape of behaviorEvents.ts: the memorial
 * arrives, and your answer to it is the choice. All consequence rides on the
 * choices, so refusing is a real decision and not a rubber stamp.
 */

export interface RemonstranceContext {
  date: GameDate;
  cities: Record<EntityId, City>;
  officers: Record<EntityId, Officer>;
  forces: Record<EntityId, Force>;
  playerForceId: EntityId | null;
  firedEventIds: EntityId[];
  eventFlags: Record<string, boolean>;
  /** Who holds the Son of Heaven, if anyone — 僭號 only bites while he lives. */
  emperorHeldByForceId?: EntityId | null;
  /** Per-force legal code (state.lawCode), not a single realm-wide setting. */
  lawCode?: Record<EntityId, LawSeverity>;
  rng?: () => number;
}

export type RemonstranceCause = 'nine-bestowments' | 'usurped-style' | 'reign-of-terror';

/** Loyalty at which a man will die rather than watch. Below it he simply leaves. */
export const REMONSTRATOR_MIN_LOYALTY = 80;
/** A remonstrator is a man of principle, not a fighter with an opinion. */
export const REMONSTRATOR_MIN_POLITICS = 68;

/**
 * Who steps forward. The most principled voice in the realm — highest politics
 * among the loyal — because the drama only lands if losing him hurts.
 *
 * Never the ruler (you cannot remonstrate with yourself) and never someone
 * already dead, captive or gone.
 */
export function findRemonstrator(ctx: RemonstranceContext): Officer | null {
  const { playerForceId } = ctx;
  if (!playerForceId) return null;
  const force = ctx.forces[playerForceId];
  if (!force) return null;
  const candidates = Object.values(ctx.officers).filter((o) =>
    o.forceId === playerForceId
    && o.id !== force.rulerOfficerId
    && (o.status === 'idle' || o.status === 'active' || o.status === 'wounded')
    && o.loyalty >= REMONSTRATOR_MIN_LOYALTY
    && (o.stats.politics >= REMONSTRATOR_MIN_POLITICS || (o.traits ?? []).includes('loyal')));
  if (candidates.length === 0) return null;
  return candidates.sort((a, b) =>
    (b.stats.politics + b.loyalty) - (a.stats.politics + a.loyalty)
    || a.id.localeCompare(b.id))[0];
}

/**
 * Fellow men of principle — they take the hardest lesson from how you answer.
 * Scoped to the same force and the same cast of mind, so refusing does not
 * simply dock the whole roster.
 */
function likeMinded(ctx: RemonstranceContext, exceptId: EntityId): Officer[] {
  const { playerForceId } = ctx;
  const force = playerForceId ? ctx.forces[playerForceId] : undefined;
  return Object.values(ctx.officers).filter((o) =>
    o.forceId === playerForceId
    && o.id !== exceptId
    && o.id !== force?.rulerOfficerId
    && o.status !== 'dead'
    && o.stats.politics >= REMONSTRATOR_MIN_POLITICS);
}

interface CauseCopy {
  name: { zh: string; en: string };
  memorial: (who: string, whoEn: string) => { zh: string; en: string };
  /** How far the realm's legitimacy swings on the answer. */
  weight: number;
}

const CAUSE_COPY: Record<RemonstranceCause, CauseCopy> = {
  'nine-bestowments': {
    name: { zh: '死諫 · 九錫', en: 'Remonstrance — the Nine Bestowments' },
    memorial: (who, whoEn) => ({
      zh: `${who}捧表入見,伏地不起:「明公本興義兵以匡朝寧國,秉忠貞之誠,守退讓之實。九錫者,人臣之極,受之則君臣之分絕矣。願明公卻之。」\n\n言畢,置藥於案側,不復抬頭。`,
      en: `${whoEn} comes in with the memorial and will not rise from the floor. "My lord raised a righteous army to steady the court, holding to loyalty and to restraint. The Nine Bestowments are the utmost a subject may take; accept them and the line between lord and sovereign is gone. I beg you refuse them."\n\nHe sets a small box beside the table and does not look up again.`,
    }),
    weight: 8,
  },
  'usurped-style': {
    name: { zh: '死諫 · 僭號', en: 'Remonstrance — the Usurped Style' },
    memorial: (who, whoEn) => ({
      zh: `${who}免冠入諫:「天子尚在,而明公已稱至尊。昔日討董之盟,所爭者何?今日之事,與所討者何異?臣不敢奉詔,願以此身謝天下。」`,
      en: `${whoEn} comes bareheaded. "The Son of Heaven still lives, and already my lord takes his style. What was the coalition against Dong Zhuo for? How is this different from what we marched to punish? I cannot serve this edict; let my life answer for it."`,
    }),
    weight: 10,
  },
  'reign-of-terror': {
    name: { zh: '死諫 · 苛政', en: 'Remonstrance — Rule by Terror' },
    memorial: (who, whoEn) => ({
      zh: `${who}入見,袖出一卷:「此境內半年斷獄之數。刑愈重而盜愈多,民非畏死,是不畏死也。臣屢諫不聽,請以死請。」`,
      en: `${whoEn} draws a scroll from his sleeve. "Half a year of sentences in these provinces. The harsher the law, the more brigands — the people are not unafraid of death; they have stopped caring. I have remonstrated and been ignored. I ask now with my life."`,
    }),
    weight: 6,
  },
};

/** The two answers, and what each truly costs. */
function buildChoices(
  cause: RemonstranceCause,
  who: Officer,
  ctx: RemonstranceContext,
  rulerId: EntityId,
): EventChoice[] {
  const w = CAUSE_COPY[cause].weight;
  const peers = likeMinded(ctx, who.id);
  const playerCities = Object.values(ctx.cities).filter((c) => c.ownerForceId === ctx.playerForceId);

  return [
    {
      id: 'heed',
      label: {
        zh: `納其言 — 收回成命(天命 +${w}、士望歸心,然此局所圖盡棄)`,
        en: `Heed him — stand down (Mandate +${w}, the scholars take note; the prize is forfeit)`,
      },
      effects: [
        // Sparing him is the whole point; he is worth more alive.
        { kind: 'officer-loyalty', officerId: who.id, delta: 12 },
        ...peers.map((p) => ({ kind: 'officer-loyalty' as const, officerId: p.id, delta: 6 })),
        // 寬仁之名 — the realm hears that the lord can be argued with.
        ...playerCities.map((c) => ({ kind: 'city-loyalty' as const, cityId: c.id, delta: 4 })),
        { kind: 'mandate-ruler', rulerOfficerId: rulerId, delta: w },
        { kind: 'flag', key: `remonstrance-heeded-${cause}` },
      ],
    },
    {
      id: 'refuse',
      label: {
        zh: `不納 — 大業豈為一人止(${who.name.zh} 自盡,天命 −${w}、同道寒心)`,
        en: `Refuse — the work does not stop for one man (${who.name.en} takes his life; Mandate −${w})`,
      },
      effects: [
        { kind: 'officer-status', officerId: who.id, status: 'dead' },
        ...peers.map((p) => ({ kind: 'officer-loyalty' as const, officerId: p.id, delta: -10 })),
        ...playerCities.map((c) => ({ kind: 'city-loyalty' as const, cityId: c.id, delta: -3 })),
        { kind: 'mandate-ruler', rulerOfficerId: rulerId, delta: -w },
        { kind: 'flag', key: `remonstrance-refused-${cause}` },
      ],
    },
  ];
}

/** Which transgression, if any, the realm is currently living under. */
export function pendingCause(ctx: RemonstranceContext): RemonstranceCause | null {
  const { playerForceId } = ctx;
  if (!playerForceId) return null;
  const force = ctx.forces[playerForceId];
  if (!force) return null;

  // 僭號 — taking the imperial style while the Han emperor is still held by
  // someone. The gravest of the three, so it is tested first.
  const emperorLives = !!ctx.emperorHeldByForceId;
  if (force.imperialRank === 'emperor' && emperorLives && ctx.emperorHeldByForceId !== playerForceId) {
    return 'usurped-style';
  }
  if (ctx.eventFlags[`nine-bestowments-${playerForceId}`] && force.imperialRank !== 'emperor') {
    return 'nine-bestowments';
  }
  // 苛政 — the strictest code (§ law.ts: lenient / standard / strict) while the
  // people are already sullen. Severity alone is a policy, not a crime; it is
  // severity that has visibly stopped working that a man will die over.
  if (ctx.lawCode?.[playerForceId] === 'strict') {
    const own = Object.values(ctx.cities).filter((c) => c.ownerForceId === playerForceId);
    if (own.length > 0) {
      const avg = own.reduce((a, c) => a + c.loyalty, 0) / own.length;
      if (avg < 45) return 'reign-of-terror';
    }
  }
  return null;
}

/**
 * Roll the memorial for this season. Returns null unless the realm is actually
 * living under one of the three transgressions AND someone principled enough is
 * still serving — a court of yes-men has nobody left to die for the point,
 * which is itself the consequence of every previous refusal.
 */
export function rollRemonstrance(ctx: RemonstranceContext): HistoricalEvent | null {
  const cause = pendingCause(ctx);
  if (!cause) return null;
  const id = `remonstrance-${cause}-${ctx.playerForceId}`;
  if (ctx.firedEventIds.includes(id)) return null;
  const who = findRemonstrator(ctx);
  if (!who) return null;
  const force = ctx.forces[ctx.playerForceId!]!;
  const rulerId = force.rulerOfficerId;
  if (!rulerId) return null;

  // Give the court a season or two to work up its nerve.
  const rng = ctx.rng ?? Math.random;
  if (rng() > 0.45) return null;

  const copy = CAUSE_COPY[cause];
  const body = copy.memorial(who.name.zh, who.name.en);
  return {
    id,
    name: copy.name,
    yearMin: 0,
    yearMax: 9999,
    description: body.en,
    descriptionZh: body.zh,
    effects: [],
    chooserRulerId: rulerId,
    mood: 'somber',
    choices: buildChoices(cause, who, ctx, rulerId),
  };
}
