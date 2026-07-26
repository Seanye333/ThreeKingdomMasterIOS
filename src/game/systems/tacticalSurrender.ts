/**
 * 陣前招降 — call across the line for a broken enemy officer to lay down arms.
 *
 * The battlefield had no way to do this at all. A unit whose heart has gone
 * (morale 0) routs and flees toward its own edge, and your only interaction
 * with it is to run it down and kill it. Officers could be *taken* only after
 * the day was decided, by a charisma roll you never saw coming. Yet everything
 * a persuasion attempt needs was already in the game: 魅力, 忠誠, 故主之義
 * (whose banner they used to follow), the relationship graph, and the fact that
 * the man in front of you is visibly finished.
 *
 * The design keeps it a *gamble on a broken man*, not a recruitment button:
 *  - only a foe who is routing, shaken, or nearly wiped out will even hear it;
 *  - one call per unit per battle, so it can't be spammed until it lands;
 *  - a refusal STEELS them (+morale), so a bad call makes your day harder;
 *  - loyal men and men who hate you refuse outright, no roll;
 *  - a yielded officer is your prisoner only if your side still holds the field
 *    when it is over — lose the day and their own people take them back.
 *
 * Both sides can do it. The AI calls on your broken units too (see tacticalAi).
 */

import type { EntityId, Officer, TacticalBattle, TacticalUnit } from '../types';
import { hexDistance, isRouting } from './tactical';
import { areSwornBrothers, areFamily, runtimeFeudPair } from './relationshipEffects';

/** A shout carries about this far across a battlefield. */
export const SURRENDER_RANGE = 2;
/** Action points a call costs the officer who makes it. */
export const SURRENDER_AP_COST = 1;
/** Loyalty at or above which an officer will not hear the offer at all. */
export const SURRENDER_LOYALTY_WALL = 95;
/** Morale a refusal gives back — defiance steels a shaken unit. */
export const SURRENDER_REFUSAL_MORALE = 10;
/** Morale the yielding officer's neighbours lose when a banner goes over. */
export const SURRENDER_CONTAGION = 8;

export type SurrenderRefusal =
  | 'not-broken'      // still has fight in it
  | 'too-far'
  | 'no-ap'
  | 'already-called'  // one call per unit per battle
  | 'unshakeable'     // loyalty wall
  | 'bad-blood';      // a feud with the caller — they would rather die

export interface SurrenderCheck {
  ok: boolean;
  reason?: SurrenderRefusal;
  /** 0..1 — only meaningful when ok. */
  chance: number;
}

/** True if this unit is broken enough to be worth calling to. */
export function isBroken(u: TacticalUnit): boolean {
  return isRouting(u) || u.morale <= 25 || (u.maxTroops > 0 && u.troops / u.maxTroops <= 0.25);
}

/** Which force a side belongs to, so 故主之義 can be checked. */
function forceOf(b: TacticalBattle, side: 'attacker' | 'defender'): EntityId | null {
  return side === 'attacker' ? b.attackerForceId : b.defenderForceId;
}

/**
 * Can `caller` call on `target`, and with what odds.
 *
 * Every input here already existed; nothing new is tracked on the officer.
 */
export function surrenderCheck(
  b: TacticalBattle,
  caller: TacticalUnit,
  target: TacticalUnit,
  officers: Record<EntityId, Officer>,
): SurrenderCheck {
  const no = (reason: SurrenderRefusal): SurrenderCheck => ({ ok: false, reason, chance: 0 });
  if (caller.ap < SURRENDER_AP_COST) return no('no-ap');
  if (hexDistance(caller.coord, target.coord) > SURRENDER_RANGE) return no('too-far');
  if ((b.surrenderCalls ?? []).includes(target.id)) return no('already-called');
  if (!isBroken(target)) return no('not-broken');

  const co = officers[caller.officerId];
  const to = officers[target.officerId];
  if (!co || !to) return no('not-broken');
  if (runtimeFeudPair(co.id, to.id, b.oathBonds)) return no('bad-blood');
  if (to.loyalty >= SURRENDER_LOYALTY_WALL) return no('unshakeable');

  let p = 0.10;
  // 魅力 — the voice doing the calling.
  p += (co.stats.charisma - 60) / 200;
  // 忠誠 — the tie it has to break.
  p += (60 - to.loyalty) / 200;
  // How finished they are.
  if (isRouting(target)) p += 0.20;
  else if (target.morale <= 15) p += 0.12;
  else p += 0.05;
  if (target.maxTroops > 0 && target.troops / target.maxTroops <= 0.2) p += 0.10;
  // 故主之義 — calling a man back to the banner he once followed.
  const callerForce = forceOf(b, caller.side);
  if (callerForce && to.formerForceId === callerForce) p += 0.18;
  // 親故相勸 — a sworn brother or kinsman on the other side is hard to refuse.
  if (areSwornBrothers(co.id, to.id, b.oathBonds)) p += 0.22;
  else if (areFamily(co.id, to.id, b.familyTies ?? [])) p += 0.14;
  // A commander does not abandon the host they lead while it still stands.
  if (target.isCommander) p -= 0.18;
  // 戰局氣勢 — a man is likelier to yield to the side that is plainly winning.
  const favor = caller.side === 'attacker' ? (b.momentum ?? 0) : -(b.momentum ?? 0);
  p += Math.max(-0.06, Math.min(0.06, favor / 1600));

  return { ok: true, chance: Math.max(0, Math.min(0.75, p)) };
}

/** Enemy units this officer could call to right now. */
export function surrenderTargets(
  b: TacticalBattle,
  callerId: EntityId,
  officers: Record<EntityId, Officer>,
): TacticalUnit[] {
  const caller = b.units.find((u) => u.id === callerId);
  if (!caller) return [];
  return b.units.filter(
    (u) => u.side !== caller.side && u.troops > 0 && surrenderCheck(b, caller, u, officers).ok,
  );
}

export interface SurrenderResult {
  battle: TacticalBattle;
  /** True when the officer laid down arms. */
  yielded: boolean;
  /** Set when the call could not be made at all (no AP spent). */
  blocked?: SurrenderRefusal;
}

/**
 * Make the call. On success the unit leaves the field and its officer is
 * recorded as having yielded to the caller's side; on refusal the target takes
 * heart and the caller has spent the action for nothing.
 */
export function callSurrender(
  b: TacticalBattle,
  callerId: EntityId,
  targetId: EntityId,
  officers: Record<EntityId, Officer>,
  rng: () => number,
): SurrenderResult {
  const caller = b.units.find((u) => u.id === callerId);
  const target = b.units.find((u) => u.id === targetId);
  if (!caller || !target) return { battle: b, yielded: false, blocked: 'not-broken' };
  const check = surrenderCheck(b, caller, target, officers);
  if (!check.ok) return { battle: b, yielded: false, blocked: check.reason };

  const co = officers[caller.officerId];
  const to = officers[target.officerId];
  const callerName = co?.name.zh ?? '我軍';
  const targetName = to?.name.zh ?? '敵將';
  const callerNameEn = co?.name.en ?? 'Our officer';
  const targetNameEn = to?.name.en ?? 'the enemy officer';
  const log = b.log ? [...b.log] : [];
  const surrenderCalls = [...(b.surrenderCalls ?? []), target.id];
  const yielded = rng() < check.chance;

  if (!yielded) {
    log.push({
      turn: b.turn,
      text: `${callerName}臨陣招降 —— ${targetName}厲聲拒之:「豈有降將軍耶!」殘部反為之一振。`,
      textEn: `${callerNameEn} calls for their surrender — ${targetNameEn} spits it back, and the broken ranks stiffen.`,
      kind: 'event',
    });
    return {
      battle: {
        ...b,
        surrenderCalls,
        log,
        units: b.units.map((u) => {
          if (u.id === callerId) return { ...u, ap: u.ap - SURRENDER_AP_COST };
          if (u.id === targetId) return { ...u, morale: Math.min(100, u.morale + SURRENDER_REFUSAL_MORALE) };
          return u;
        }),
      },
      yielded: false,
    };
  }

  log.push({
    turn: b.turn,
    text: `${callerName}臨陣招降 —— ${targetName}擲刃於地,率殘部歸降!`,
    textEn: `${callerNameEn} calls for their surrender — ${targetNameEn} throws down their blade and yields.`,
    kind: 'event',
  });

  // 一將歸降,左右奪氣 — a banner going over shakes whoever watched it happen.
  const shaken = new Set(
    b.units
      .filter((u) => u.side === target.side && u.id !== target.id && u.troops > 0
        && hexDistance(u.coord, target.coord) <= 2)
      .map((u) => u.id),
  );

  return {
    battle: {
      ...b,
      surrenderCalls,
      log,
      surrendered: [...(b.surrendered ?? []), { officerId: target.officerId, toSide: caller.side }],
      // The yielded contingent leaves the field; its strength counts against its
      // own side exactly as a destroyed unit would (losses are derived from
      // startTroops minus what still stands).
      units: b.units
        .filter((u) => u.id !== targetId)
        .map((u) => {
          if (u.id === callerId) return { ...u, ap: u.ap - SURRENDER_AP_COST };
          if (shaken.has(u.id)) return { ...u, morale: Math.max(0, u.morale - SURRENDER_CONTAGION) };
          return u;
        }),
    },
    yielded: true,
  };
}
