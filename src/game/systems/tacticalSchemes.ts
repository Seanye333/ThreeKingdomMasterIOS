/**
 * 戰陣機略 — mid-battle duels (陣前單挑), the pre-battle champion's challenge
 * (致師), pre-battle preparations (戰前準備) and in-battle stratagems (計略),
 * split out of tactical.ts (which keeps the core: setup / movement / combat /
 * turn loop). This module sits ABOVE the core: it imports tactical's leaf
 * helpers and is called by the UI, the store and the battle AI — the core
 * never calls back into it.
 */
import type {
  DamagePopup,
  EntityId,
  HexCoord,
  Officer,
  StratagemId,
  TacticalBattle,
  TacticalStatus,
  TacticalUnit,
  TerrainKind,
} from '../types';
import {
  battleStratagemSituation, hexDistance, hexNeighbours, isRouting,
  shipPowerMul, tileAt, unitAt, FATIGUE_PER_VOLLEY, type WindDirection,
  COMBAT_LETHALITY, ARM_ARMOR, counterMultiplier, hexDirection, dirGap, shieldWallMul,
} from './tactical';
import { stratagemDamageMul } from './traitEffects';
import { resolveDuel, canDuel, staticProwess } from './duel';

/** 陣前挑將 — whether the challenger may call out the adjacent enemy officer to
 *  a mid-battle single combat (both able-bodied, neither routing, adjacent). */
export function canChallengeDuel(
  challenger: TacticalUnit,
  target: TacticalUnit,
  officers: Record<EntityId, Officer>,
): boolean {
  if (challenger.ap <= 0 || challenger.side === target.side) return false;
  if (isRouting(challenger) || isRouting(target)) return false;
  if (challenger.isSupply || target.isSupply) return false;
  if (hexDistance(challenger.coord, target.coord) !== 1) return false;
  const co = officers[challenger.officerId];
  const to = officers[target.officerId];
  if (!co || !to) return false;
  return canDuel(co).ok && canDuel(to).ok;
}

/**
 * 陣前單挑 — two adjacent enemy officers cross blades mid-battle, resolved by the
 * same odds as the 演武場 (resolveDuel). 車輪戰: each bout already fought this
 * battle blunts a fighter's effective 武力, so relays of fresh challengers can
 * wear down a peerless champion. The loser's unit reels — a clean knockout
 * shatters its heart into a rout (潰走), a points loss merely shakes it — while
 * the victor's banner soars (氣勢大振). A challenge spends the challenger's turn.
 */
export function challengeDuel(
  b: TacticalBattle,
  challengerId: EntityId,
  targetId: EntityId,
  officers: Record<EntityId, Officer>,
  rng: () => number,
): TacticalBattle {
  const challenger = b.units.find((u) => u.id === challengerId);
  const target = b.units.find((u) => u.id === targetId);
  if (!challenger || !target) return b;
  if (!canChallengeDuel(challenger, target, officers)) return b;
  const co = officers[challenger.officerId];
  const to = officers[target.officerId];

  // 車輪戰 — prior bouts blunt a fighter (−5 武力 each, floored at −20).
  const winded = (o: Officer, u: TacticalUnit): Officer => {
    const pen = Math.min(20, (u.duelFatigue ?? 0) * 5);
    return pen > 0 ? { ...o, stats: { ...o.stats, war: Math.max(1, o.stats.war - pen) } } : o;
  };
  const result = resolveDuel({ attacker: winded(co, challenger), defender: winded(to, target), rng });

  const log = b.log ? [...b.log] : [];
  const popups: DamagePopup[] = [];
  log.push({ turn: b.turn, text: `⚔ ${co.name.zh} 出陣搦戰 ${to.name.zh} — 陣前單挑!`, kind: 'event' });

  // Both fighters spend a bout (車輪戰); the challenger spends the whole turn.
  let units = b.units.map((u) => {
    if (u.id === challengerId) return { ...u, ap: 0, duelFatigue: (u.duelFatigue ?? 0) + 1 };
    if (u.id === targetId) return { ...u, duelFatigue: (u.duelFatigue ?? 0) + 1 };
    return u;
  });

  if (result.winner === 'draw') {
    log.push({ turn: b.turn, text: '兩將鬥得難解難分,各自鳴金 — 勝負未分。', kind: 'event' });
    return { ...b, units, log };
  }

  const winnerUnit = result.winner === 'attacker' ? challenger : target;
  const loserUnit = result.winner === 'attacker' ? target : challenger;
  const winnerOff = officers[winnerUnit.officerId];
  const loserOff = officers[loserUnit.officerId];
  const knockout = result.knockout;
  const loserTroopLoss = Math.floor(loserUnit.troops * (knockout ? 0.30 : 0.10));

  units = units.map((u) => {
    if (u.id === loserUnit.id) {
      const morale = knockout ? 0 : Math.max(0, u.morale - 35); // 挑落 → 潰走
      return { ...u, troops: Math.max(0, u.troops - loserTroopLoss), morale };
    }
    if (u.id === winnerUnit.id) return { ...u, morale: Math.min(100, u.morale + 15) };
    if (u.side === winnerUnit.side && u.troops > 0) return { ...u, morale: Math.min(100, u.morale + 5) };
    if (u.side === loserUnit.side && u.troops > 0) return { ...u, morale: Math.max(0, u.morale - 5) };
    return u;
  });

  popups.push({
    id: `duel-${Date.now()}`,
    coord: loserUnit.coord,
    text: knockout ? '挑落馬下!' : '陣前小挫',
    color: '#ffd24a',
    spawnedAt: Date.now(),
  });
  log.push({
    turn: b.turn,
    text: knockout
      ? `${winnerOff?.name.zh ?? '勝者'}神威凜凜,將 ${loserOff?.name.zh ?? '敵將'} 挑落馬下 — 其部潰散奔逃!`
      : `${winnerOff?.name.zh ?? '勝者'}佔得上風,${loserOff?.name.zh ?? '敵將'} 部曲奪氣。`,
    kind: 'event',
  });
  // 主將敗北 — a routed commander drags the whole army's heart down further.
  if (knockout && loserUnit.isCommander) {
    units = units.map((u) => (u.side === loserUnit.side && u.id !== loserUnit.id && u.troops > 0
      ? { ...u, morale: Math.max(0, u.morale - 10) } : u));
    log.push({ turn: b.turn, text: `主將敗於陣前 — ${loserUnit.side === 'attacker' ? '攻方' : '守方'}三軍奪氣!`, kind: 'event' });
  }

  return { ...b, units, log, damagePopups: [...(b.damagePopups ?? []), ...popups] };
}

// ─── 致師 — the pre-battle champion's challenge ──────────────────────────────
// Before a blow is struck, a side may send its best out to call for single
// combat. Unlike a mid-battle 陣前單挑 (which sways the two units), a 致師 win
// SETS THE TONE of the whole battle: the victor's host rides in heartened, the
// bested host cowed — a larger army-wide morale swing, spent as the side's
// one turn-1 special. A 平手 leaves both armies tense, no edge gained.

/** The champion a side fields for a 致師: its strongest duel-capable, non-supply
 *  fighter, the commander winning a tie. Null if the side has no able champion. */
export function pickDuelChampion(
  b: TacticalBattle,
  side: 'attacker' | 'defender',
  officers: Record<EntityId, Officer>,
): TacticalUnit | null {
  let best: TacticalUnit | null = null;
  let bestScore = -Infinity;
  for (const u of b.units) {
    if (u.side !== side || u.troops <= 0 || u.isSupply || isRouting(u)) continue;
    const o = officers[u.officerId];
    if (!o || !canDuel(o).ok) continue;
    const score = staticProwess(o) + (u.isCommander ? 0.5 : 0); // commander breaks ties
    if (score > bestScore) { bestScore = score; best = u; }
  }
  return best;
}

/** Whether a side may issue a 致師: turn 1, its special unspent, and both sides
 *  can field a champion. */
export function canIssuePreBattleDuel(
  b: TacticalBattle,
  side: 'attacker' | 'defender',
  officers: Record<EntityId, Officer>,
): boolean {
  if (b.turn !== 1) return false;
  if (b.preDuelUsed?.[side] || b.prepUsed?.[side]) return false;
  const foe: 'attacker' | 'defender' = side === 'attacker' ? 'defender' : 'attacker';
  return !!pickDuelChampion(b, side, officers) && !!pickDuelChampion(b, foe, officers);
}

/**
 * Fold a settled 致師 into the battle: the victor's host takes heart, the bested
 * host is cowed, and the challenging side's turn-1 special is spent. Morale only;
 * the duel's personal toll (wounds/kill/車輪) is applied by the duel path itself.
 */
export function applyPreBattleDuel(
  b: TacticalBattle,
  challengerSide: 'attacker' | 'defender',
  winnerSide: 'attacker' | 'defender' | 'draw',
): TacticalBattle {
  const loserSide: 'attacker' | 'defender' | null =
    winnerSide === 'draw' ? null : winnerSide === 'attacker' ? 'defender' : 'attacker';
  const units = b.units.map((u) => {
    if (u.troops <= 0) return u;
    if (winnerSide === 'draw') return { ...u, morale: Math.max(0, u.morale - 5) }; // 對峙 — both tense
    if (u.side === winnerSide) return { ...u, morale: Math.min(100, u.morale + 18) }; // 士氣大振
    if (u.side === loserSide) return { ...u, morale: Math.max(0, u.morale - 22) };   // 奪其先聲
    return u;
  });
  const text = winnerSide === 'draw'
    ? '致師搦戰 — 兩將鬥得難分難解,兩軍對峙凝立。'
    : `致師奏功 — ${winnerSide === 'attacker' ? '攻方' : '守方'}陣前折服敵將,三軍士氣大振!`;
  return {
    ...b,
    units,
    preDuelUsed: { ...b.preDuelUsed, [challengerSide]: true },
    log: [...(b.log ?? []), { turn: b.turn, text, kind: 'event' as const }],
  };
}

/**
 * 敵將致師 — the AI side may open with its own challenge. It calls you out when
 * it likes its odds (its champion at least a match for yours), eagerly when much
 * stronger. Auto-resolved (the foe doesn't wait for the player) and NON-lethal at
 * the gate — a beaten champion is mauled and their host cowed, not slain before a
 * blow. Returns the (possibly unchanged) battle and a banner line when issued.
 */
export function aiMaybePreBattleDuel(
  b: TacticalBattle,
  aiSide: 'attacker' | 'defender',
  officers: Record<EntityId, Officer>,
  rng: () => number,
): { battle: TacticalBattle; issued: boolean; line?: { zh: string; en: string } } {
  if (!canIssuePreBattleDuel(b, aiSide, officers)) return { battle: b, issued: false };
  const foeSide: 'attacker' | 'defender' = aiSide === 'attacker' ? 'defender' : 'attacker';
  const aiUnit = pickDuelChampion(b, aiSide, officers);
  const foeUnit = pickDuelChampion(b, foeSide, officers);
  if (!aiUnit || !foeUnit) return { battle: b, issued: false };
  const aiOff = officers[aiUnit.officerId];
  const foeOff = officers[foeUnit.officerId];
  if (!aiOff || !foeOff) return { battle: b, issued: false };
  const edge = staticProwess(aiOff) - staticProwess(foeOff);
  // 量力 — challenge when not clearly outmatched; an edge makes the AI eager.
  const eager = aiOff.traits?.some((tr) => tr === 'matchless' || tr === 'duelist' || tr === 'reckless' || tr === 'martial-valor');
  const chance = Math.max(0, Math.min(0.6, 0.22 + edge * 0.02)) + (eager ? 0.15 : 0);
  if (edge < -8 || rng() >= chance) return { battle: b, issued: false };

  const r = resolveDuel({ attacker: aiOff, defender: foeOff, rng });
  const winnerSide: 'attacker' | 'defender' | 'draw' =
    r.winner === 'draw' ? 'draw' : r.winner === 'attacker' ? aiSide : foeSide;
  let nb = applyPreBattleDuel(b, aiSide, winnerSide);
  // The bested champion is personally mauled (non-lethal at the gate); both tire.
  const loserUnitId = winnerSide === 'draw' ? null
    : winnerSide === aiSide ? foeUnit.id : aiUnit.id;
  nb = {
    ...nb,
    units: nb.units.map((u) => {
      let nu = u;
      if (u.id === loserUnitId) nu = { ...nu, troops: Math.round(nu.troops * 0.82) };
      if (u.id === aiUnit.id || u.id === foeUnit.id) nu = { ...nu, duelFatigue: (nu.duelFatigue ?? 0) + 24 };
      return nu;
    }),
  };
  const line = winnerSide === 'draw'
    ? { zh: `${aiOff.name.zh} 出陣致師,與 ${foeOff.name.zh} 鬥得難分難解!`, en: `${aiOff.name.en} challenges ${foeOff.name.en} — and the bout is a draw!` }
    : winnerSide === aiSide
      ? { zh: `${aiOff.name.zh} 致師逞威,陣前折服 ${foeOff.name.zh}!`, en: `${aiOff.name.en} rides out and bests ${foeOff.name.en} before the hosts!` }
      : { zh: `${foeOff.name.zh} 接戰致師,反挫 ${aiOff.name.zh} 之鋒!`, en: `${foeOff.name.en} answers the challenge and turns back ${aiOff.name.en}!` };
  return { battle: nb, issued: true, line };
}

// ─── Stratagems ──────────────────────────────────────────────────────

/* ─── 戰前準備 — one preparation per side, before the first move ────────
   伏兵 ambush: your strongest non-commander contingent slips into
     concealment (the existing hidden mechanics: revealed by adjacency or
     its own first strike, which lands at the ambush bonus — ×1.5 at night).
   夜襲 night raid: the battle opens under darkness — ranged eyes shorten,
     ambushes bite harder, every line fights at night odds.
   地道 tunnel: siege attackers only — sappers carry your weakest
     contingent under the wall line; it surfaces inside the city. */
export type BattlePrepKind = 'ambush' | 'night' | 'tunnel' | 'caltrops-trap' | 'fire-prep' | 'decoy';

/**
 * 計接戰場 — when an abstract-combat scheme (§5.3) is played out on the hex grid,
 * it manifests as a real opening: 火攻/火矢 → flames already licking the enemy
 * front; 埋伏 → a hidden contingent; 夜襲 → the battle opens in darkness; 斷糧 →
 * the enemy host already going hungry. Connects the two combat layers.
 */
export function applyOpeningScheme(b: TacticalBattle, scheme: string): TacticalBattle {
  const enemy: 'attacker' | 'defender' = 'defender'; // the scheme is the attacker's plot
  if (scheme === 'fire-attack' || scheme === 'fire-arrow') {
    if (b.weather === 'rain' || b.weather === 'snow') return b;
    // Set the foremost enemy unit's ground alight.
    const front = b.units.filter((u) => u.side === enemy && u.troops > 0)
      .sort((a, c) => a.coord.col - c.coord.col)[0]; // defenders sit east; lowest col = nearest the attacker
    if (!front) return b;
    return {
      ...b,
      groundFires: [...(b.groundFires ?? []), { coord: front.coord, turnsLeft: 3 }],
      log: [...(b.log ?? []), { turn: 1, text: '🔥 火計既發 — 敵營一隅已騰起烈焰!', kind: 'event' as const }],
    };
  }
  if (scheme === 'ambush' || scheme === 'set-ambush-path') {
    return applyBattlePrep(b, 'attacker', 'ambush').battle;
  }
  if (scheme === 'night-raid') {
    return applyBattlePrep(b, 'attacker', 'night').battle;
  }
  if (scheme === 'cut-supply' || scheme === 'cut-supply-strike') {
    const prey = b.units.filter((u) => u.side === enemy && u.troops > 0 && !u.isSupply)
      .sort((a, c) => c.troops - a.troops)[0];
    if (!prey) return b;
    return {
      ...b,
      units: b.units.map((u) => (u.id === prey.id
        ? { ...u, effects: u.effects.some((e) => e.kind === 'starving') ? u.effects : [...u.effects, { kind: 'starving' as const, turnsLeft: 4 }], morale: Math.max(0, u.morale - 12) }
        : u)),
      log: [...(b.log ?? []), { turn: 1, text: '🌾 糧道已斷 — 敵一軍乏食、士氣低落!', kind: 'event' as const }],
    };
  }
  return b;
}

export function applyBattlePrep(
  b: TacticalBattle,
  side: 'attacker' | 'defender',
  kind: BattlePrepKind,
  /** Officer table — lets a wary defender 看破 a 地道, and gates nothing else. */
  officers?: Record<EntityId, Officer>,
): { battle: TacticalBattle; ok: boolean; reason?: string } {
  if (b.turn !== 1) return { battle: b, ok: false, reason: 'the battle is already joined' };
  if (b.prepUsed?.[side]) return { battle: b, ok: false, reason: 'already prepared' };
  const mark = (nb: TacticalBattle, text: string): TacticalBattle => ({
    ...nb,
    prepUsed: { ...b.prepUsed, [side]: kind },
    log: [...(nb.log ?? []), { turn: 1, text, kind: 'event' as const }],
  });
  const foe: 'attacker' | 'defender' = side === 'attacker' ? 'defender' : 'attacker';
  // The wits of the opposing marshal — used by tunnel counterplay (地道破解).
  const foeCommanderInt = (): number => {
    let best = 0;
    for (const u of b.units) {
      if (u.side !== foe || u.troops <= 0 || !u.isCommander) continue;
      const o = officers?.[u.officerId];
      if (o) best = Math.max(best, o.stats.intelligence
        + (o.skills?.includes('celestial-tactician') || o.skills?.includes('crouching-dragon') ? 8 : 0));
    }
    return best;
  };

  // 拒馬陷坑 — the DEFENDER'S exclusive prep: a line of caltrops & pits across
  // the mid-field. The first ranks to cross it bleed and bog down — murder on
  // a cavalry charge. (Mirrors the attacker-only 地道, balancing the asymmetry.)
  if (kind === 'caltrops-trap') {
    if (side !== 'defender') return { battle: b, ok: false, reason: 'only defenders lay traps before their own walls' };
    const occupied = new Set(b.units.filter((u) => u.troops > 0).map((u) => `${u.coord.col},${u.coord.row}`));
    const trapCol = Math.max(2, Math.floor(b.width / 2) + 1); // a little forward of centre, toward the attacker
    const midRow = Math.floor(b.height / 2);
    const placed: NonNullable<TacticalBattle['cityStructures']> = [];
    for (const row of [midRow - 1, midRow, midRow + 1]) {
      const key = `${trapCol},${row}`;
      if (occupied.has(key)) continue;
      const g = tileAt(b, { col: trapCol, row })?.terrain;
      if (g === 'wall' || g === 'gate' || g === 'marsh') continue;
      placed.push({ slotIndex: 200 + placed.length, buildingId: 'caltrops', level: 2, coord: { col: trapCol, row }, hp: 200 });
    }
    if (placed.length === 0) return { battle: b, ok: false, reason: 'no ground to lay the trap line' };
    return {
      battle: mark({ ...b, cityStructures: [...(b.cityStructures ?? []), ...placed] },
        '🪤 拒馬陷坑已布 — 一道鐵蒺藜橫亙陣前,騎陣慎入!'),
      ok: true,
    };
  }

  // 火計備料 — the ATTACKER caches oil & kindling on the approaches: the battle
  // opens with the enemy front already smouldering, and any fire spreads hotter
  // (handled by groundFires + the wind-fed spread). Doused by rain/snow.
  if (kind === 'fire-prep') {
    if (side !== 'attacker') return { battle: b, ok: false, reason: 'the assault lays the kindling' };
    if (b.weather === 'rain' || b.weather === 'snow') return { battle: b, ok: false, reason: 'too wet to lay a fire' };
    const front = b.units.filter((u) => u.side === foe && u.troops > 0)
      .sort((a, z) => a.coord.col - z.coord.col)[0];
    if (!front) return { battle: b, ok: false, reason: 'no enemy front to set alight' };
    return {
      battle: mark({ ...b, groundFires: [...(b.groundFires ?? []), { coord: front.coord, turnsLeft: 3 }] },
        '🔥 火計備料 — 油薪已伏敵營之前,烈焰騰起,風助火勢!'),
      ok: true,
    };
  }

  // 疑兵 — either side plants false banners & raises dust: the enemy, misreading
  // the host's strength, opens the fight hesitant (−10 morale across their line).
  if (kind === 'decoy') {
    const shaken = b.units.map((u) => (u.side === foe && u.troops > 0 ? { ...u, morale: Math.max(0, u.morale - 10) } : u));
    return {
      battle: mark({ ...b, units: shaken },
        '🚩 疑兵之計 — 虛張旗鼓、揚塵蔽野,敵疑我眾而心怯(士氣挫)。'),
      ok: true,
    };
  }

  if (kind === 'night') {
    // 夜襲劫營 — the enemy is roused from camp in disarray: every foe opens the
    // fight shaken (−18 morale). Night also cuts archery and emboldens ambush.
    const foe = side === 'attacker' ? 'defender' : 'attacker';
    const raided = b.units.map((u) =>
      u.side === foe && u.troops > 0 ? { ...u, morale: Math.max(0, u.morale - 18) } : u);
    return {
      battle: mark({ ...b, timeOfDay: 'night', units: raided },
        '🌙 夜襲劫營!敵軍倉促應戰、陣腳大亂(士氣挫),弓弩難及,伏兵愈利。'),
      ok: true,
    };
  }

  if (kind === 'ambush') {
    const candidates = b.units
      .filter((u) => u.side === side && !u.isCommander && u.troops > 0 && !u.hidden)
      .sort((a, z) => z.troops - a.troops);
    if (candidates.length === 0) return { battle: b, ok: false, reason: 'no contingent to conceal' };
    const chosen = candidates[0];
    return {
      battle: mark(
        { ...b, units: b.units.map((u) => (u.id === chosen.id ? { ...u, hidden: true } : u)) },
        '⚔ 伏兵已設 — 一軍銜枚潛行,候敵自投。',
      ),
      ok: true,
    };
  }

  // tunnel
  if (side !== 'attacker') return { battle: b, ok: false, reason: 'defenders dig no tunnels' };
  const wallCols = b.tiles.filter((t) => t.terrain === 'wall' || t.terrain === 'gate').map((t) => t.coord.col);
  if (wallCols.length === 0) return { battle: b, ok: false, reason: 'no walls to tunnel under' };
  const wallCol = Math.max(...wallCols);
  const movers = b.units
    .filter((u) => u.side === 'attacker' && !u.isCommander && u.troops > 0 && u.coord.col <= wallCol)
    .sort((a, z) => a.troops - z.troops);
  if (movers.length === 0) return { battle: b, ok: false, reason: 'no contingent to send below' };
  const occupied = new Set(b.units.filter((u) => u.troops > 0).map((u) => `${u.coord.col},${u.coord.row}`));
  const exit = b.tiles.find((t) =>
    t.coord.col === wallCol + 1
    && !occupied.has(`${t.coord.col},${t.coord.row}`)
    && !['wall', 'gate', 'river', 'deep-water'].includes(t.terrain));
  if (!exit) return { battle: b, ok: false, reason: 'no ground inside the walls' };
  // 地道破解 — a wary, sharp-witted defender hears the digging and is ready: the
  // tunnellers still surface inside the walls, but into a counter-ambush — they
  // arrive shaken (−30 morale) and in disarray (陣腳大亂), not at full poise.
  const detected = Math.random() < Math.max(0, Math.min(0.6, (foeCommanderInt() - 70) / 60));
  const surfaced = b.units.map((u) => {
    if (u.id !== movers[0].id) return u;
    const moved = { ...u, coord: exit.coord };
    if (!detected) return moved;
    return {
      ...moved,
      morale: Math.max(0, moved.morale - 30),
      effects: moved.effects.some((e) => e.kind === 'disorder') ? moved.effects : [...moved.effects, { kind: 'disorder' as const, turnsLeft: 2 }],
    };
  });
  return {
    battle: mark({ ...b, units: surfaced },
      detected
        ? '⛏ 地道既成,然守將早有提防 — 伏卒湧出即遭迎頭痛擊,陣腳大亂!'
        : '⛏ 地道既成 — 一軍自城下湧出,已在牆內!'),
    ok: true,
  };
}

/**
 * 廟算 — pick sensible battle preps for an AI-controlled side at turn 1, gated by
 * the marshal's wits & nerve and what the ground allows. Returns a priority list
 * (the caller tries each until one takes), or [] for a dullard / a quiet field.
 * Without this an AI side fought every played-out battle BARE while the human
 * freely set ambushes — the whole §5.7 prep system lay dormant against the AI.
 */
export function pickAiBattlePrep(
  b: TacticalBattle,
  side: 'attacker' | 'defender',
  officers: Record<EntityId, Officer>,
): BattlePrepKind[] {
  const commander = b.units.find((u) => u.side === side && u.isCommander && u.troops > 0);
  const o = commander ? officers[commander.officerId] : undefined;
  const int = o?.stats.intelligence ?? 55;
  const traits = (o?.traits as string[] | undefined) ?? [];
  // Dullards rarely scheme; a 智將 almost always does.
  if (Math.random() > Math.max(0.12, Math.min(0.9, (int - 35) / 75))) return [];
  const hasForest = b.tiles.some((t) => t.terrain === 'forest');
  const hasWalls = b.tiles.some((t) => t.terrain === 'wall' || t.terrain === 'gate');
  const foe: 'attacker' | 'defender' = side === 'attacker' ? 'defender' : 'attacker';
  const foeCavalry = b.units.some((u) => u.side === foe && u.troops > 0 && u.unitType === 'cavalry');
  const dry = b.weather !== 'rain' && b.weather !== 'snow';
  const aggressive = traits.includes('aggressive') || traits.includes('brave') || traits.includes('reckless') || traits.includes('cruel');
  const out: BattlePrepKind[] = [];
  if (side === 'attacker') {
    // 識名戰場 — on a wind-swept field (赤壁/夷陵/新野) a wits-about marshal
    // reaches for the signature fire FIRST: the locked 東南風 is made for it.
    if (b.weather === 'wind' && int >= 65) out.push('fire-prep');
    if (hasWalls && int >= 68) out.push('tunnel');                                  // 地道 against walls
    if (int >= 72 && dry && (traits.includes('fire-tactician') || int >= 85)) out.push('fire-prep'); // 火計備料
    if (hasForest || int >= 78) out.push('ambush');                                 // 伏兵 in cover / by wits
    if (int >= 64 && (aggressive || hasForest)) out.push('night');                  // 夜襲劫營
    out.push('decoy');                                                              // 疑兵 fallback
  } else {
    if (foeCavalry || int >= 70) out.push('caltrops-trap');                         // 拒馬陷坑 vs horse
    if (hasForest || int >= 78) out.push('ambush');
    if (int >= 70 && aggressive) out.push('night');
    out.push('decoy');
  }
  return out;
}

/**
 * Apply an AI-chosen prep to each NON-player, non-practice side at battle setup
 * (turn 1). The human's own side is left untouched — they pick via the prep UI.
 */
export function applyAiBattlePreps(
  b: TacticalBattle,
  playerForceId: EntityId | null,
  officers: Record<EntityId, Officer>,
): TacticalBattle {
  if (b.practice || b.turn !== 1) return b;
  let battle = b;
  for (const side of ['attacker', 'defender'] as const) {
    const forceId = side === 'attacker' ? battle.attackerForceId : battle.defenderForceId;
    if (forceId == null || forceId === playerForceId) continue; // neutral or human-controlled
    if (battle.prepUsed?.[side]) continue;                       // a scheme already set one
    for (const kind of pickAiBattlePrep(battle, side, officers)) {
      const r = applyBattlePrep(battle, side, kind, officers);
      if (r.ok) { battle = r.battle; break; }
    }
  }
  return battle;
}

export function applyStratagem(
  b: TacticalBattle,
  unitId: EntityId,
  stratagem: StratagemId,
  targetCoord: HexCoord,
  officers: Record<EntityId, Officer>,
  /** Signature tactic riding this cast — 借東風 literally turns the sky. */
  tacticId?: string,
): { battle: TacticalBattle; ok: boolean; reason?: string } {
  const unit = b.units.find((u) => u.id === unitId);
  if (!unit) return { battle: b, ok: false, reason: 'no unit' };
  const cooldownKey = `${unitId}-${stratagem}`;
  const onCd = (b.stratagemCooldowns[cooldownKey] ?? 0) > b.turn;
  if (onCd) return { battle: b, ok: false, reason: 'on cooldown' };
  if (unit.ap < 1) return { battle: b, ok: false, reason: 'no AP' };
  // 借東風 — before the fire lands, the caster prays the wind round to blow from
  // himself toward the enemy line, so the burn that follows spreads INTO their
  // fleet (the Red Cliffs button). It is NOT a sure thing: success scales with
  // the caster's wits, and a wiser enemy sage may 逆風 — pray it back. Heaven
  // does not always answer. (Gated here so a wasted/cooldown cast doesn't move
  // the sky for free; the result also opens a re-cast window via cooldown.)
  if (tacticId === 'borrow-wind') {
    const caster = officers[unit.officerId];
    const casterInt = caster?.stats.intelligence ?? 70;
    const foes = b.units.filter((u) => u.side !== unit.side && u.troops > 0);
    // 逆風 — the wisest opposing strategist resists; a true master can cancel it.
    let foeSage = 0;
    for (const u of foes) {
      const o = officers[u.officerId];
      if (!o) continue;
      const adept = o.skills?.includes('celestial-tactician') || o.skills?.includes('crouching-dragon') || o.skills?.includes('young-phoenix');
      if (o.stats.intelligence >= 80 || adept) foeSage = Math.max(foeSage, o.stats.intelligence + (adept ? 6 : 0));
    }
    const resist = foeSage > casterInt ? Math.min(0.6, (foeSage - casterInt) / 55) : 0;
    const success = Math.max(0.2, Math.min(0.97, 0.82 + (casterInt - 85) / 110)) * (1 - resist);
    const nameZh = caster?.name.zh ?? '';
    if (foes.length > 0 && Math.random() < success) {
      const avgCol = foes.reduce((sum, u) => sum + u.coord.col, 0) / foes.length;
      const avgRow = foes.reduce((sum, u) => sum + u.coord.row, 0) / foes.length;
      const dCol = avgCol - unit.coord.col;
      const dRow = avgRow - unit.coord.row;
      const dir: WindDirection = Math.abs(dCol) >= Math.abs(dRow)
        ? (dCol >= 0 ? 'east' : 'west')
        : (dRow >= 0 ? 'south' : 'north');
      b = {
        ...b,
        weather: 'wind',
        windDirection: dir,
        log: [...(b.log ?? []), {
          turn: b.turn,
          text: `🌬 ${nameZh}祭風祈禳,風雲突變 — ${dir === 'east' ? '東' : dir === 'west' ? '西' : dir === 'south' ? '南' : '北'}風大作!`,
          kind: 'event' as const,
        }],
      };
    } else {
      // 風不應禱 — the ritual fails (heaven, or an enemy sage praying it back).
      b = {
        ...b,
        log: [...(b.log ?? []), {
          turn: b.turn,
          text: resist > 0.25
            ? `🌬 ${nameZh}祭風,然敵營亦有高人逆風相抗 — 風終不至。`
            : `🌬 ${nameZh}祭風祈禳,然天意難測 — 風候未應。`,
          kind: 'event' as const,
        }],
      };
    }
  }

  const off = officers[unit.officerId];

  // 看破/反計 — a rival master strategist on the receiving side may see through
  // a 計略 and foil it; the caster wastes the turn (AP + cooldown spent).
  // 看破 reaches every PLOT (計謀), not just five — a 連環/劫糧/兵糧攻 is as
  // readable to a master as a 火計. Physical flourishes (突/衝/接舷/落石) are not
  // schemes and stand outside it.
  const COUNTERABLE: StratagemId[] = ['fire-attack', 'confusion', 'false-retreat', 'lightning', 'rain-of-arrows', 'chain-ships', 'supply-strike', 'raid-supply'];
  if (COUNTERABLE.includes(stratagem)) {
    const t0 = unitAt(b, targetCoord);
    const foeSide = t0 ? t0.side : unit.side === 'attacker' ? 'defender' : 'attacker';
    let seer: Officer | null = null;
    for (const u of b.units) {
      if (u.side !== foeSide || u.troops <= 0) continue;
      const o = officers[u.officerId];
      if (!o) continue;
      if (!(o.skills?.includes('celestial-tactician') || o.skills?.includes('crouching-dragon') || o.skills?.includes('young-phoenix'))) continue;
      if (!seer || o.stats.intelligence > seer.stats.intelligence) seer = o;
    }
    if (seer) {
      // 七星增計 — schemes cast from within the 七星陣 are far harder to read
      // (the formation veils the gambit): the enemy's 看破 chance drops 40%.
      const sevenStar = (unit.side === 'attacker' ? b.attackerFormation : b.defenderFormation) === 'seven-star';
      const chance = Math.max(0, Math.min(0.5, (seer.stats.intelligence - (off?.stats.intelligence ?? 60) + 18) / 100)) * (sevenStar ? 0.6 : 1);
      if (Math.random() < chance) {
        return {
          battle: {
            ...b,
            units: b.units.map((u) => (u.id === unitId ? { ...u, ap: u.ap - 1 } : u)),
            stratagemCooldowns: { ...b.stratagemCooldowns, [cooldownKey]: b.turn + 2 },
            log: [...(b.log ?? []), { turn: b.turn, text: `${seer.name.zh}看破此計 — 計不得售!`, kind: 'event' as const }],
          },
          ok: true,
        };
      }
    }
  }

  switch (stratagem) {
    case 'fire-attack': {
      if ((off?.stats.intelligence ?? 0) < 70)
        return { battle: b, ok: false, reason: 'requires INT 70' };
      if (hexDistance(unit.coord, targetCoord) > 3)
        return { battle: b, ok: false, reason: 'out of range' };
      const target = unitAt(b, targetCoord);
      const bareTile = tileAt(b, targetCoord);
      const tileFlammable = !!bareTile && ['forest', 'plain', 'road', 'bridge'].includes(bareTile.terrain);
      if ((!target || target.side === unit.side) && !(target == null && tileFlammable && b.weather !== 'rain'))
        return { battle: b, ok: false, reason: 'invalid target' };
      // Wind doubles fire duration; rain halves it. 火攻 master stokes it +1 turn.
      const baseTurns = b.weather === 'wind' ? 5 : b.weather === 'rain' ? 1 : 3;
      const turns = baseTurns + ((off?.traits as string[] | undefined ?? []).includes('fire-tactician') ? 1 : 0);
      let updated = target && target.side !== unit.side
        ? setStatus(b, target.id, { kind: 'burning', turnsLeft: turns })
        : b;
      // The ground itself catches — a spreading field fire (火攻).
      const groundTile = tileAt(b, targetCoord);
      if (groundTile && (groundTile.terrain === 'forest' || groundTile.terrain === 'plain' || groundTile.terrain === 'road') && b.weather !== 'rain') {
        updated = {
          ...updated,
          groundFires: [
            ...(updated.groundFires ?? []),
            { coord: targetCoord, turnsLeft: groundTile.terrain === 'forest' ? 4 : 2 },
          ],
          log: [...(updated.log ?? []), { turn: b.turn, text: '烈火騰起，野地燃成一片！', kind: 'event' }],
        };
      }
      return finalize(updated, unitId, stratagem, 0);
    }
    case 'confusion': {
      if ((off?.stats.intelligence ?? 0) < 75)
        return { battle: b, ok: false, reason: 'requires INT 75' };
      if (hexDistance(unit.coord, targetCoord) > 4)
        return { battle: b, ok: false, reason: 'out of range' };
      const target = unitAt(b, targetCoord);
      if (!target || target.side === unit.side)
        return { battle: b, ok: false, reason: 'invalid target' };
      const updated = setStatus(b, target.id, { kind: 'confused', turnsLeft: 2 });
      return finalize(updated, unitId, stratagem, 0);
    }
    case 'defend': {
      // 據守整隊 — digging in also re-forms a unit whose ranks were thrown into
      // disorder (a charge / a river ford), clearing 陷亂 on the spot.
      const reformed = {
        ...b,
        units: b.units.map((u) => (u.id === unit.id
          ? { ...u, effects: u.effects.filter((e) => e.kind !== 'disorder') }
          : u)),
      };
      // turnsLeft 2, not 1 — effects tick at EVERY endTurn (both side flips),
      // so a 1-turn status set on your own turn died at your own turn's end and
      // 立防 never actually covered the enemy's blows. 2 = survives your flip,
      // shields through the enemy turn, expires at their flip.
      const updated = setStatus(reformed, unit.id, { kind: 'defending', turnsLeft: 2 });
      return finalize(updated, unitId, stratagem, 0);
    }
    case 'rally': {
      if ((off?.stats.intelligence ?? 0) < 60)
        return { battle: b, ok: false, reason: 'requires INT 60' };
      if (hexDistance(unit.coord, targetCoord) > 2)
        return { battle: b, ok: false, reason: 'out of range' };
      const target = unitAt(b, targetCoord);
      if (!target || target.side !== unit.side)
        return { battle: b, ok: false, reason: 'must be friendly' };
      const restored = Math.floor(target.maxTroops * 0.15);
      const updated: TacticalBattle = {
        ...b,
        units: b.units.map((u) =>
          u.id === target.id
            ? {
                ...u,
                troops: Math.min(u.maxTroops, u.troops + restored),
                morale: Math.min(100, u.morale + 25),
              }
            : u,
        ),
      };
      return finalize(updated, unitId, stratagem, 2);
    }
    case 'charge': {
      if (hexDistance(unit.coord, targetCoord) > 1)
        return { battle: b, ok: false, reason: 'adjacent only' };
      const target = unitAt(b, targetCoord);
      if (!target || target.side === unit.side)
        return { battle: b, ok: false, reason: 'invalid target' };
      // Charge: a shock blow through the REAL combat model (shockDamage — 烈度/
      // 相剋/甲冑/立防/拒馬 all count), spend all AP. Open ground spurs the
      // charge home; forest/mountain bog it down (戰法情境).
      const chgSit = battleStratagemSituation(b, unit.coord, targetCoord, stratagem);
      const chgTraitMul = off ? stratagemDamageMul(off, stratagem) : 1;
      const { dmg: damage, braced: chgBraced } = shockDamage(b, unit, target, officers, 1.5 * chgSit.mult * chgTraitMul);
      const updated: TacticalBattle = {
        ...b,
        units: b.units.map((u) => {
          if (u.id === target.id)
            return { ...u, troops: Math.max(0, u.troops - damage), morale: Math.max(0, u.morale - 25) };
          if (u.id === unit.id) return { ...u, ap: 0 };
          return u;
        }),
        // 拒馬折戟 — the wall held: say so, the moment reads better than numbers.
        log: chgBraced
          ? [...(b.log ?? []), {
              turn: b.turn,
              text: `槍陣拒馬,${off?.name.zh ?? '騎軍'}衝勢折戟!`,
              textEn: `The spear-wall holds — ${off?.name.en ?? 'the charge'} breaks on the pikes!`,
              kind: 'event' as const,
            }]
          : b.log,
      };
      return finalize(updated, unitId, stratagem, 2);
    }
    case 'rain-of-arrows': {
      const maxRange = b.timeOfDay === 'night' ? 2 : 4;
      const d = hexDistance(unit.coord, targetCoord);
      if (d > maxRange || d < 2)
        return { battle: b, ok: false, reason: `range 2–${maxRange}` };
      // 矢盡 — a ranged unit out of arrows can't volley until resupplied (糧車/補給格).
      if (unit.maxAmmo !== undefined && (unit.ammo ?? 0) <= 0)
        return { battle: b, ok: false, reason: '矢盡待補給' };
      const target = unitAt(b, targetCoord);
      if (!target || target.side === unit.side)
        return { battle: b, ok: false, reason: 'invalid target' };
      // 戰法情境 — rain soaks the bowstrings, high ground extends the volley.
      const arrSit = battleStratagemSituation(b, unit.coord, targetCoord, stratagem);
      // 矢雨亦入模型 — the volley used to strip a flat 12% of the TARGET no
      // matter how battered the shooters were, and straight through 立防/甲冑
      // (the second model-bypass behind the §5.1 arm-power skew: archers 88-96%
      // over foot). Now it scales with the shooters' remaining strength, and a
      // shielded (defending) or armoured target weathers it like any other blow.
      const volleyStrength = unit.maxTroops > 0 ? unit.troops / unit.maxTroops : 1;
      // Shields-up soaks arrows; armoured foot soaks a bit more; and fast horse
      // rides dispersed under arcing shot (騎散難覆 ×0.85) — the blanket volley
      // is a FOOT-killer, while the bow's check on cavalry lives in aimed shots
      // and melee, not the area barrage.
      const volleyGate = (u: TacticalUnit): number =>
        (u.effects.some((e) => e.kind === 'defending') ? 0.55 : 1)
        * Math.min(1, ARM_ARMOR[u.unitType] ?? 1)
        * (u.unitType === 'cavalry' ? 0.85 : 1);
      const stratMul = arrSit.mult * (off ? stratagemDamageMul(off, stratagem) : 1) * volleyStrength;
      // 拋射覆蓋 — a volley falls over an area: the aimed hex takes the brunt,
      // every other enemy pressed up against it catches the spillover (半傷).
      // Arcing shots loft over walls/units, so no line-of-sight or cover applies.
      const splashIds = new Set(
        b.units.filter((u) => u.side === target.side && u.troops > 0 && u.id !== target.id
          && hexDistance(u.coord, target.coord) === 1).map((u) => u.id),
      );
      const popups: DamagePopup[] = [];
      const updated: TacticalBattle = {
        ...b,
        units: b.units.map((u) => {
          if (u.id === target.id) {
            const dmg = Math.floor(u.troops * 0.12 * stratMul * volleyGate(u));
            popups.push({ id: `dmg-${Date.now()}-arr`, coord: u.coord, text: `-${dmg.toLocaleString()}`, color: '#88b7e8', spawnedAt: Date.now() });
            return { ...u, troops: Math.max(0, u.troops - dmg), morale: Math.max(0, u.morale - 3) };
          }
          if (splashIds.has(u.id)) {
            const dmg = Math.floor(u.troops * 0.06 * stratMul * volleyGate(u));
            popups.push({ id: `dmg-${Date.now()}-arr-${u.id}`, coord: u.coord, text: `-${dmg.toLocaleString()}`, color: '#9cc0e8', spawnedAt: Date.now() + 1 });
            return { ...u, troops: Math.max(0, u.troops - dmg) };
          }
          if (u.id === unit.id) return {
            ...u, ap: u.ap - 1,
            ammo: u.maxAmmo !== undefined ? Math.max(0, (u.ammo ?? 0) - 1) : u.ammo,
            fatigue: Math.min(100, (u.fatigue ?? 0) + FATIGUE_PER_VOLLEY),
          };
          return u;
        }),
        damagePopups: [...(b.damagePopups ?? []), ...popups],
      };
      const updated2 = splashIds.size > 0
        ? { ...updated, log: [...(updated.log ?? []), { turn: b.turn, text: '矢雨覆蓋,波及一片!', kind: 'event' as const }] }
        : updated;
      return finalize(updated2, unitId, stratagem, 1);
    }
    case 'chain-ships': {
      if ((off?.stats.intelligence ?? 0) < 80)
        return { battle: b, ok: false, reason: 'requires INT 80' };
      if (hexDistance(unit.coord, targetCoord) > 3)
        return { battle: b, ok: false, reason: 'out of range' };
      const target = unitAt(b, targetCoord);
      if (!target || target.side === unit.side)
        return { battle: b, ok: false, reason: 'invalid target' };
      // Chain target + its adjacent allies.
      const chained = b.units.filter(
        (u) => u.side === target.side && hexDistance(u.coord, target.coord) <= 1,
      );
      const chainedIds = chained.map((u) => u.id);
      let next = b;
      for (const c of chained) {
        next = setStatus(next, c.id, {
          kind: 'chained',
          turnsLeft: 4,
          chainedWith: chainedIds.filter((id) => id !== c.id),
        });
      }
      return finalize(next, unitId, stratagem, 0);
    }
    case 'false-retreat': {
      if ((off?.stats.intelligence ?? 0) < 70)
        return { battle: b, ok: false, reason: 'requires INT 70' };
      // 詐敗誘敵 — the caster feigns a rout (sets a 詐敗 trap on itself: the next
      // pursuer to strike it springs a full-strength回馬 counter and is thrown
      // into disorder) AND rattles the nearest foe into giving chase.
      const enemies = b.units
        .filter((u) => u.side !== unit.side)
        .sort((a, c) => hexDistance(unit.coord, a.coord) - hexDistance(unit.coord, c.coord));
      let next = setStatus(b, unit.id, { kind: 'feign-rout', turnsLeft: 3 });
      if (enemies[0]) next = setStatus(next, enemies[0].id, { kind: 'confused', turnsLeft: 2 });
      next = { ...next, log: [...(next.log ?? []), { turn: b.turn, text: `${off?.name.zh ?? '我軍'}佯敗回旋,虛留破綻以誘追兵。`, kind: 'event' as const }] };
      return finalize(next, unitId, stratagem, 0);
    }
    case 'precognition': {
      if ((off?.stats.intelligence ?? 0) < 90)
        return { battle: b, ok: false, reason: 'requires INT 90' };
      let next = b;
      for (const e of b.units.filter((u) => u.side !== unit.side)) {
        next = setStatus(next, e.id, { kind: 'revealed', turnsLeft: 2 });
      }
      return finalize(next, unitId, stratagem, 0);
    }
    case 'lightning': {
      if ((off?.stats.intelligence ?? 0) < 85)
        return { battle: b, ok: false, reason: 'requires INT 85' };
      if (hexDistance(unit.coord, targetCoord) > 4)
        return { battle: b, ok: false, reason: 'out of range' };
      const target = unitAt(b, targetCoord);
      if (!target) return { battle: b, ok: false, reason: 'no target' };
      // 戰法情境 — a brewing storm feeds the bolt; fog/snow damps it.
      const ltSit = battleStratagemSituation(b, unit.coord, targetCoord, stratagem);
      const damage = Math.floor(target.troops * 0.15 * ltSit.mult * (off ? stratagemDamageMul(off, stratagem) : 1));
      const confuse = Math.random() < 0.3;
      let next: TacticalBattle = {
        ...b,
        units: b.units.map((u) =>
          u.id === target.id ? { ...u, troops: Math.max(0, u.troops - damage) } : u,
        ),
        damagePopups: [
          ...(b.damagePopups ?? []),
          {
            id: `dmg-${Date.now()}-lightning`,
            coord: target.coord,
            text: `-${damage.toLocaleString()}⚡`,
            color: '#e0d090',
            spawnedAt: Date.now(),
          },
        ],
      };
      if (confuse) next = setStatus(next, target.id, { kind: 'confused', turnsLeft: 2 });
      return finalize(next, unitId, stratagem, 0);
    }
    case 'supply-strike': {
      if ((off?.stats.intelligence ?? 0) < 75)
        return { battle: b, ok: false, reason: 'requires INT 75' };
      let next = b;
      for (const e of b.units.filter((u) => u.side !== unit.side)) {
        next = setStatus(next, e.id, { kind: 'demoralized', turnsLeft: 3 });
      }
      return finalize(next, unitId, stratagem, 0);
    }
    case 'gallop': {
      // Lü Bu's signature: charge up to 3 hexes in a straight line.
      if (hexDistance(unit.coord, targetCoord) > 3 || hexDistance(unit.coord, targetCoord) < 1)
        return { battle: b, ok: false, reason: 'range 1–3' };
      const target = unitAt(b, targetCoord);
      if (!target || target.side === unit.side)
        return { battle: b, ok: false, reason: 'invalid target' };
      // Move adjacent to target, deal a 1.75× shock — through the real combat
      // model (shockDamage), so a braced spear-wall breaks even Lü Bu's ride.
      const neighbours = hexNeighbours(target.coord);
      const landing = neighbours.find(
        (c) => tileAt(b, c) && !unitAt(b, c),
      );
      const { dmg: damage } = shockDamage(b, unit, target, officers, 1.75);
      const next: TacticalBattle = {
        ...b,
        units: b.units.map((u) => {
          if (u.id === unit.id && landing) {
            return { ...u, coord: landing, ap: 0 };
          }
          if (u.id === target.id) {
            return { ...u, troops: Math.max(0, u.troops - damage) };
          }
          return u;
        }),
        damagePopups: [
          ...(b.damagePopups ?? []),
          {
            id: `dmg-${Date.now()}-gallop`,
            coord: target.coord,
            text: `-${damage.toLocaleString()}!`,
            color: '#ff6a4a',
            spawnedAt: Date.now(),
          },
        ],
        log: [
          ...(b.log ?? []),
          {
            turn: b.turn,
            text: '飛将，突貫!',
            speaker: unit.officerId,
            kind: 'voice',
          },
        ],
      };
      return finalize(next, unitId, stratagem, 3);
    }
    case 'dragon-veil': {
      // Zhao Yun's signature: hit every adjacent enemy.
      const adjEnemies = b.units.filter(
        (u) => u.side !== unit.side && hexDistance(u.coord, unit.coord) === 1,
      );
      if (adjEnemies.length === 0)
        return { battle: b, ok: false, reason: 'no adjacent enemies' };
      const popups: DamagePopup[] = [];
      const next: TacticalBattle = {
        ...b,
        units: b.units.map((u) => {
          const enemy = adjEnemies.find((e) => e.id === u.id);
          if (enemy) {
            const { dmg } = shockDamage(b, unit, u, officers, 0.6);
            popups.push({
              id: `dmg-${Date.now()}-veil-${u.id}`,
              coord: u.coord,
              text: `-${dmg.toLocaleString()}`,
              color: '#ff6a4a',
              spawnedAt: Date.now(),
            });
            return { ...u, troops: Math.max(0, u.troops - dmg) };
          }
          return u;
        }),
        damagePopups: [...(b.damagePopups ?? []), ...popups],
        log: [
          ...(b.log ?? []),
          {
            turn: b.turn,
            text: '龍威在此!',
            speaker: unit.officerId,
            kind: 'voice',
          },
        ],
      };
      return finalize(next, unitId, stratagem, 3);
    }
    case 'ram': {
      // 撞角 — drive the prow into an adjacent ship. Heavy hull damage scaled
      // by this ship's class; spends all AP like a charge.
      if (hexDistance(unit.coord, targetCoord) > 1)
        return { battle: b, ok: false, reason: 'adjacent only' };
      const target = unitAt(b, targetCoord);
      if (!target || target.side === unit.side)
        return { battle: b, ok: false, reason: 'invalid target' };
      const aWar = off?.stats.war ?? 60;
      const dLead = officers[target.officerId]?.stats.leadership ?? 50;
      // 撞沉 — ramming caves in a hull; against another ship it's devastating.
      const ramShipMul = target.unitType === 'navy' ? 1.5 : 1.0;
      const damage = Math.floor(
        (unit.troops * (aWar + 30) * 1.6 * shipPowerMul(unit.shipClass) * ramShipMul) / (dLead + 50),
      );
      const sank = damage >= target.troops;
      const next: TacticalBattle = {
        ...b,
        units: b.units.map((u) => {
          if (u.id === target.id)
            return { ...u, troops: Math.max(0, u.troops - damage), morale: Math.max(0, u.morale - 20) };
          if (u.id === unit.id) return { ...u, ap: 0 };
          return u;
        }),
        damagePopups: [
          ...(b.damagePopups ?? []),
          { id: `dmg-${Date.now()}-ram`, coord: target.coord, text: `${sank && target.unitType === 'navy' ? '撞沉 ' : ''}-${damage.toLocaleString()}!`, color: '#7ec8e6', spawnedAt: Date.now() },
        ],
        log: sank && target.unitType === 'navy'
          ? [...(b.log ?? []), { turn: b.turn, text: `${officers[target.officerId]?.name.zh ?? '敵艦'}座艦被撞沉!`, kind: 'event' as const }]
          : b.log,
      };
      return finalize(next, unitId, stratagem, 2);
    }
    case 'board': {
      // 接舷 — grapple an adjacent ship and fight it out on the decks. War-based
      // marine melee that shatters morale and costs the boarder little.
      if (hexDistance(unit.coord, targetCoord) > 1)
        return { battle: b, ok: false, reason: 'adjacent only' };
      const target = unitAt(b, targetCoord);
      if (!target || target.side === unit.side)
        return { battle: b, ok: false, reason: 'invalid target' };
      const aWar = off?.stats.war ?? 60;
      const dWar = officers[target.officerId]?.stats.war ?? 50;
      const damage = Math.floor((unit.troops * (aWar + 30) * 1.1) / (dWar + 60));
      const selfLoss = Math.floor(damage * 0.25);
      const next: TacticalBattle = {
        ...b,
        units: b.units.map((u) => {
          if (u.id === target.id)
            return { ...u, troops: Math.max(0, u.troops - damage), morale: Math.max(0, u.morale - 35) };
          if (u.id === unit.id) return { ...u, troops: Math.max(0, u.troops - selfLoss) };
          return u;
        }),
        damagePopups: [
          ...(b.damagePopups ?? []),
          { id: `dmg-${Date.now()}-board`, coord: target.coord, text: `-${damage.toLocaleString()}`, color: '#ff8a4a', spawnedAt: Date.now() },
        ],
      };
      return finalize(next, unitId, stratagem, 1);
    }
    case 'fire-ship': {
      // 火船 — send blazing hulks downwind into the enemy line. Sets fire (long
      // in wind, doused in rain) plus immediate damage; ruinous against a fleet
      // chained together (連環計 + 火船 = 赤壁).
      if ((off?.stats.intelligence ?? 0) < 65)
        return { battle: b, ok: false, reason: 'requires INT 65' };
      if (hexDistance(unit.coord, targetCoord) > 3)
        return { battle: b, ok: false, reason: 'out of range' };
      const target = unitAt(b, targetCoord);
      if (!target || target.side === unit.side)
        return { battle: b, ok: false, reason: 'invalid target' };
      const turns = b.weather === 'wind' ? 5 : b.weather === 'rain' ? 1 : 4;
      const damage = Math.floor(target.troops * 0.12);
      let next: TacticalBattle = {
        ...b,
        units: b.units.map((u) =>
          u.id === target.id ? { ...u, troops: Math.max(0, u.troops - damage) } : u,
        ),
        damagePopups: [
          ...(b.damagePopups ?? []),
          { id: `dmg-${Date.now()}-fireship`, coord: target.coord, text: `-${damage.toLocaleString()}🔥`, color: '#ff7a3a', spawnedAt: Date.now() },
        ],
      };
      next = setStatus(next, target.id, { kind: 'burning', turnsLeft: turns });
      return finalize(next, unitId, stratagem, 3);
    }
    case 'rockslide': {
      if ((off?.stats.war ?? 0) < 55)
        return { battle: b, ok: false, reason: 'requires WAR 55' };
      if (hexDistance(unit.coord, targetCoord) > 2)
        return { battle: b, ok: false, reason: 'out of range' };
      // Must hold (or flank) the heights.
      const onMountain = [unit.coord, ...hexNeighbours(unit.coord)].some((c) => {
        const t = tileAt(b, c);
        return t?.terrain === 'mountain';
      });
      if (!onMountain) return { battle: b, ok: false, reason: 'needs mountain footing' };
      const tTile = tileAt(b, targetCoord);
      if (!tTile || !['road', 'plain', 'hill', 'chokepoint'].includes(tTile.terrain))
        return { battle: b, ok: false, reason: 'invalid ground' };
      const victim = unitAt(b, targetCoord);
      let next = b;
      if (victim && victim.side !== unit.side) {
        const dmg = Math.min(victim.troops, Math.floor(victim.troops * 0.18) + 250);
        next = {
          ...next,
          units: next.units.map((u) => u.id === victim.id
            ? { ...u, troops: Math.max(0, u.troops - dmg), morale: Math.max(0, u.morale - 12) }
            : u),
        };
      }
      next = {
        ...next,
        tiles: next.tiles.map((t) =>
          t.coord.col === targetCoord.col && t.coord.row === targetCoord.row
            ? { ...t, terrain: 'mountain' as TerrainKind }
            : t),
        log: [...(next.log ?? []), { turn: b.turn, text: '山崩石落，道路斷絕！', kind: 'event' }],
      };
      return finalize(next, unitId, stratagem, 0);
    }
    case 'raid-supply': {
      // 劫糧道 — only from deep in the enemy rear (flank a raider around the
      // line, 烏巢-style). Torches the grain: every enemy unit starts starving
      // — bleeding deserters and morale each turn. Long cooldown: the depot
      // only burns once.
      const inRear = unit.side === 'attacker'
        ? unit.coord.col >= b.width - 3
        : unit.coord.col <= 2;
      if (!inRear)
        return { battle: b, ok: false, reason: 'must reach the enemy rear' };
      const foes = b.units.filter((u) => u.side !== unit.side && u.troops > 0);
      if (foes.length === 0) return { battle: b, ok: false, reason: 'no enemy supply to burn' };
      // 野戰無倉可焚 — in a pitched battle in the open there is no depot behind
      // the enemy line unless they actually brought a grain train (糧車). Riding
      // to an empty rear corner used to starve a whole army in hours — the
      // single biggest hidden chunk of cavalry's AI-vs-AI dominance.
      if (b.field && !foes.some((u) => u.isSupply)) {
        return { battle: b, ok: false, reason: 'no enemy supply to burn' };
      }
      let next = b;
      for (const e of foes) {
        next = setStatus(next, e.id, { kind: 'starving', turnsLeft: 5 });
      }
      next = {
        ...next,
        log: [
          ...(next.log ?? []),
          { turn: b.turn, text: '糧道斷絕，敵軍大亂！', speaker: unit.officerId, kind: 'event' },
        ],
      };
      return finalize(next, unitId, stratagem, 6);
    }
  }
}

function setStatus(
  b: TacticalBattle,
  unitId: EntityId,
  status: TacticalStatus,
): TacticalBattle {
  return {
    ...b,
    units: b.units.map((u) => {
      if (u.id !== unitId) return u;
      const filtered = u.effects.filter((e) => e.kind !== status.kind);
      return { ...u, effects: [...filtered, status] };
    }),
  };
}

/**
 * 物理衝擊謀略傷害 — charge / gallop / dragon-veil used to compute raw
 * `troops×(war+30)×mult/(lead+50)` and BYPASS the entire combat model: no
 * 殺傷烈度 (×0.45), no 兵種相剋, no 甲冑, no 立防半傷, no 築壘拒馬. A 6000-man
 * cavalry 突貫 one-shot any full unit through every defence — measured as the
 * true root of cavalry's AI-vs-AI dominance (§5.1): three generations of
 * constant tuning "didn't move the matrix" because these paths never read the
 * constants at all. Now the shock family goes through the same core gates,
 * and a single shock can rout but never annihilate (≤70% of current troops).
 */
function shockDamage(
  b: TacticalBattle,
  unit: TacticalUnit,
  target: TacticalUnit,
  officers: Record<EntityId, Officer>,
  mult: number,
): { dmg: number; braced: boolean } {
  const off = officers[unit.officerId];
  const To = officers[target.officerId];
  const aWar = off?.stats.war ?? 50;
  const dLead = To?.stats.leadership ?? 50;
  let dmg = (unit.troops * (aWar + 30) * mult * COMBAT_LETHALITY) / (dLead + 50);
  dmg *= counterMultiplier(unit.unitType, target.unitType);
  dmg *= ARM_ARMOR[target.unitType] ?? 1;
  // 立防 halves the shock; 築壘 stakes blunt it; a braced spear-wall facing
  // the ride breaks it (拒馬) — the postures finally count against the very
  // blow they exist to stop.
  if (target.effects.some((e) => e.kind === 'defending')) dmg *= 0.5;
  dmg *= shieldWallMul(b, target); // 盾牆 — linked defending infantry
  if (tileAt(b, target.coord)?.terrain === 'fieldworks') dmg *= 0.6;
  let braced = false;
  if (target.unitType === 'spearmen' && !isRouting(target) && typeof target.facing === 'number'
      && dirGap(hexDirection(target.coord, unit.coord), target.facing) <= 1) {
    dmg *= 0.5;
    braced = true;
  }
  return { dmg: Math.min(Math.floor(dmg), Math.floor(target.troops * 0.7)), braced };
}

function finalize(
  b: TacticalBattle,
  unitId: EntityId,
  stratagem: StratagemId,
  cooldownTurns: number,
): { battle: TacticalBattle; ok: boolean } {
  const unit = b.units.find((u) => u.id === unitId);
  if (!unit) return { battle: b, ok: false };
  const newAp = stratagem === 'charge' ? 0 : Math.max(0, unit.ap - 1);
  const next: TacticalBattle = {
    ...b,
    units: b.units.map((u) => (u.id === unitId ? { ...u, ap: newAp } : u)),
    stratagemCooldowns: {
      ...b.stratagemCooldowns,
      [`${unitId}-${stratagem}`]: b.turn + cooldownTurns,
    },
  };
  return { battle: next, ok: true };
}

