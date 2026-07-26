import type { DamagePopup, EntityId, Officer, TacticalBattle, TacticalUnit } from '../types';
import { hexDistance, isRouting } from './tactical';
import { canDuel } from './duel';
import { orderForGauntlet, resolveGauntlet } from './gauntlet';

/**
 * 車輪戰 — champions at one man IN TURN, on the battlefield.
 *
 * `gauntlet.ts` has carried this since it was written (a queue against one
 * champion, no rest between bouts, the real duel resolver underneath) and was
 * the ONLY system module in src/game that nothing imported — unreachable.
 *
 * Not to be confused with §6.11 團戰 (teamDuel.ts), which is already built out
 * in full, 3D stage and all: that is a SIMULTANEOUS melee, everyone swinging at
 * once, where being outnumbered means eating every blow but the one you parry.
 * This is the other shape of the same idea and plays quite differently:
 *
 *   團戰  — three at once. The monster is overwhelmed, but he gets to cut into
 *           all three, and 圍攻 lets him parry only the worst blow each round.
 *   車輪戰 — three one after another. Each of yours fights him fresh-ish and
 *           alone (so the early ones will probably lose), but he never catches
 *           his breath, and whatever the first two spend of his wind is banked
 *           for the third. You are buying your ace a weakened opponent with the
 *           blood of the two before him.
 *
 * The battlefield already had 陣前挑將 for 1v1 and `duelFatigue` for a fighter
 * who duelled repeatedly ACROSS turns; the sequential rush inside a single
 * action was the missing shape.
 *
 * Kept apart from tacticalSchemes.ts so the queue logic is testable on its own,
 * and so the shared 1v1 path stays untouched.
 */

/** How many may pile in — three, because that is the story. */
export const GAUNTLET_MAX_CHALLENGERS = 3;
/** Two is the floor; one challenger is just a duel. */
export const GAUNTLET_MIN_CHALLENGERS = 2;

/**
 * Units of `side` that could join a gauntlet against `target` right now.
 *
 * Deliberately stricter than `canChallengeDuel`: everyone must be adjacent to
 * the target and still have an action, because the whole point is a single
 * concerted rush rather than a queue formed over several turns.
 */
export function gauntletChallengers(
  b: TacticalBattle,
  targetId: EntityId,
  officers: Record<EntityId, Officer>,
): TacticalUnit[] {
  const target = b.units.find((u) => u.id === targetId);
  if (!target || target.troops <= 0 || target.isSupply || isRouting(target)) return [];
  const champion = officers[target.officerId];
  if (!champion || !canDuel(champion).ok) return [];

  const able = b.units.filter((u) =>
    u.side !== target.side
    && u.troops > 0
    && u.ap > 0
    && !u.isSupply
    && !isRouting(u)
    && hexDistance(u.coord, target.coord) === 1
    && !!officers[u.officerId]
    && canDuel(officers[u.officerId]).ok);

  if (able.length < GAUNTLET_MIN_CHALLENGERS) return [];

  // 由弱漸強 — `orderForGauntlet` puts the ace last so the earlier bouts wear
  // the champion down for them. Cap at three; the extras hold their action.
  const ordered = orderForGauntlet(able.map((u) => officers[u.officerId]));
  const byOfficer = new Map(able.map((u) => [u.officerId, u]));
  return ordered
    .map((o) => byOfficer.get(o.id))
    .filter((u): u is TacticalUnit => !!u)
    .slice(0, GAUNTLET_MAX_CHALLENGERS);
}

export function canGauntlet(
  b: TacticalBattle,
  targetId: EntityId,
  officers: Record<EntityId, Officer>,
): boolean {
  return gauntletChallengers(b, targetId, officers).length >= GAUNTLET_MIN_CHALLENGERS;
}

/**
 * Run the rush. Every challenger spends their whole action whether or not they
 * get to swing, because the unit committed to the charge — that is the cost of
 * gambling on the gauntlet and having the champion cut down the first two.
 */
export function battleGauntlet(
  b: TacticalBattle,
  targetId: EntityId,
  officers: Record<EntityId, Officer>,
  rng: () => number,
): TacticalBattle {
  const queue = gauntletChallengers(b, targetId, officers);
  if (queue.length < GAUNTLET_MIN_CHALLENGERS) return b;
  const target = b.units.find((u) => u.id === targetId)!;
  const champion = officers[target.officerId];

  // Carry the champion's existing bout fatigue in, same as 陣前挑將 does.
  const carried = Math.min(20, (target.duelFatigue ?? 0) * 5);
  const windedChampion: Officer = carried > 0
    ? { ...champion, stats: { ...champion.stats, war: Math.max(1, champion.stats.war - carried) } }
    : champion;

  const result = resolveGauntlet(windedChampion, queue.map((u) => officers[u.officerId]), rng);

  const log = b.log ? [...b.log] : [];
  const popups: DamagePopup[] = [...(b.damagePopups ?? [])];
  const names = queue.map((u) => officers[u.officerId]?.name.zh ?? '將').join('、');
  log.push({
    turn: b.turn,
    text: `⚔ ${names} 輪番搦戰 ${champion.name.zh} — 車輪戰!`,
    textEn: `${queue.length} champions take ${champion.name.en} in turn — a gauntlet!`,
    kind: 'event',
  });

  const fought = new Set(result.bouts.map((x) => x.challengerId));

  let units = b.units.map((u) => {
    if (u.id === targetId) {
      return { ...u, duelFatigue: (u.duelFatigue ?? 0) + result.bouts.length };
    }
    if (queue.some((q) => q.id === u.id)) {
      // Everyone in the rush is committed; only those who actually traded
      // blows carry a bout's fatigue forward.
      return { ...u, ap: 0, duelFatigue: (u.duelFatigue ?? 0) + (fought.has(u.officerId) ? 1 : 0) };
    }
    return u;
  });

  for (const bout of result.bouts) {
    const cu = queue.find((q) => q.officerId === bout.challengerId);
    const cn = bout.challengerName;
    if (bout.result === 'champion') {
      log.push({
        turn: b.turn,
        text: bout.killed
          ? `${champion.name.zh}神威不減,${cn} 死於陣前!`
          : `${cn} 力戰不支,敗退陣中 — ${champion.name.zh}餘勇可賈。`,
        kind: 'event',
      });
      if (cu) {
        // No officer dies here. 陣前挑將 never kills either — an in-battle bout
        // costs troops and heart, and only the player's explicit choice over a
        // beaten captive (forcedKills) ends a life. A "killed" bout is the
        // champion breaking that contingent outright: it routs.
        const loss = Math.floor(cu.troops * (bout.killed ? 0.25 : 0.08));
        units = units.map((u) => (u.id === cu.id
          ? {
            ...u,
            troops: Math.max(0, u.troops - loss),
            morale: bout.killed ? 0 : Math.max(0, u.morale - 12),
          }
          : u));
      }
    } else {
      log.push({
        turn: b.turn,
        text: `${cn} 挾眾人之勞,終將 ${champion.name.zh} 挑落馬下!`,
        kind: 'event',
      });
    }
    // The champion's dwindling wind is the whole drama — say it out loud.
    log.push({
      turn: b.turn,
      text: `— ${champion.name.zh} 氣力 ${bout.championStaminaBefore} → ${bout.championStaminaAfter}`,
      kind: 'event',
    });
  }

  if (!result.championSurvived) {
    const knocked = Math.floor(target.troops * 0.30);
    units = units.map((u) => {
      if (u.id === targetId) return { ...u, troops: Math.max(0, u.troops - knocked), morale: 0 };
      if (u.side === target.side && u.troops > 0) return { ...u, morale: Math.max(0, u.morale - (target.isCommander ? 15 : 8)) };
      if (u.side !== target.side && u.troops > 0) return { ...u, morale: Math.min(100, u.morale + 10) };
      return u;
    });
    popups.push({
      id: `gauntlet-fell-${b.turn}-${targetId}`,
      coord: target.coord,
      text: '車輪戰!挑落馬下',
      color: '#ffd24a',
      spawnedAt: Date.now(),
    });
    log.push({
      turn: b.turn,
      text: `${champion.name.zh}力盡,終為眾人所破 — 其部大潰!`,
      textEn: `${champion.name.en} is worn down at last — the line breaks!`,
      kind: 'event',
    });
  } else {
    // He held. Everyone watching takes note.
    units = units.map((u) => {
      if (u.id === targetId) return { ...u, morale: Math.min(100, u.morale + 12) };
      if (u.side === target.side && u.troops > 0) return { ...u, morale: Math.min(100, u.morale + 6) };
      if (u.side !== target.side && u.troops > 0) return { ...u, morale: Math.max(0, u.morale - 6) };
      return u;
    });
    popups.push({
      id: `gauntlet-held-${b.turn}-${targetId}`,
      coord: target.coord,
      text: `${result.bouts.length} 戰不落`,
      color: '#e0623a',
      spawnedAt: Date.now(),
    });
    log.push({
      turn: b.turn,
      text: `${champion.name.zh}連戰 ${result.bouts.length} 場而不落 — 萬夫莫敵之勢,三軍側目!`,
      textEn: `${champion.name.en} stands after ${result.bouts.length} bouts — both armies stare.`,
      kind: 'event',
    });
  }

  return { ...b, units, log, damagePopups: popups };
}
