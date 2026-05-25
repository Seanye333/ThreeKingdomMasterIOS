import { useEffect, useMemo, useState } from 'react';
import { FORMATIONS_BY_ID, NAMED_MAPS_BY_ID, STRATAGEMS } from '../../game/data';
import {
  aiTakeTurn,
  applyStratagem,
  attackUnits,
  canAttack,
  canMove,
  endTurn,
  hexDistance,
  moveUnit,
  resolveBattleEnd,
  unitAt,
} from '../../game/systems/tactical';
import { canDuel, resolveDuel, type DuelResult } from '../../game/systems/duel';
import { predictAttackDamage } from '../../game/systems/damagePredict';
import { personalTacticsForUnit } from '../../game/systems/personalTactics';
import { playSfx } from '../../game/systems/sound';
import { useGameStore } from '../../game/state/store';
import type {
  BattleObjective,
  HexCoord,
  Officer,
  StratagemId,
  TacticalBattle,
  TacticalUnit,
  TerrainKind,
  TimeOfDay,
  UnitType,
  Weather,
} from '../../game/types';
import { BattleResultsModal } from '../components/BattleResultsModal';
import { DuelModal } from '../components/DuelModal';
import { MapDefs as SharedMapDefs, MapFrame as SharedMapFrame, CompassRose as SharedCompassRose, TerrainArt as SharedTerrainArt } from '../components/hexMapShared';
import { TacticalBattleScreen3D } from './TacticalBattleScreen3D';
import { useT, useDesc } from '../i18n';

const UNIT_TYPE_GLYPH: Record<UnitType, string> = {
  infantry: '歩',
  spearmen: '槍',
  cavalry: '騎',
  archers: '弓',
  siege: '攻',
  navy: '水',
};

const UNIT_TYPE_LABEL: Record<UnitType, string> = {
  infantry: 'Infantry',
  spearmen: 'Spearmen',
  cavalry: 'Cavalry',
  archers: 'Archers',
  siege: 'Siege',
  navy: 'Navy',
};

const WEATHER_LABEL: Record<Weather, string> = {
  clear: '☀ clear',
  rain: '☂ rain',
  wind: '🌀 wind',
  fog: '≋ fog',
  snow: '❄ snow',
};

const TOD_LABEL: Record<TimeOfDay, string> = {
  dawn: '🌅 dawn',
  day: '☀ day',
  dusk: '🌇 dusk',
  night: '🌙 night',
};
import styles from './TacticalBattleScreen.module.css';

// ─── Hex layout constants ───────────────────────────────────────────
const HEX_SIZE = 32;          // hex radius (flat-top)
const HEX_W = HEX_SIZE * 2;
const HEX_H = Math.sqrt(3) * HEX_SIZE;
const HEX_COL_STEP = HEX_W * 0.75;
const HEX_ROW_STEP = HEX_H;

function hexCenter(col: number, row: number): { x: number; y: number } {
  const x = col * HEX_COL_STEP + HEX_W / 2;
  const y = row * HEX_ROW_STEP + (col & 1 ? HEX_H / 2 : 0) + HEX_H / 2;
  return { x, y };
}

function hexPoints(cx: number, cy: number, size = HEX_SIZE): string {
  const pts: string[] = [];
  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI / 3) * i;
    pts.push(`${cx + size * Math.cos(angle)},${cy + size * Math.sin(angle)}`);
  }
  return pts.join(' ');
}

const TERRAIN_FILL: Record<TerrainKind, string> = {
  plain:    'url(#tkmPlainGrad)',
  forest:   'url(#tkmForestGrad)',
  mountain: 'url(#tkmMountainGrad)',
  river:    'url(#tkmRiverGrad)',
  road:     'url(#tkmRoadGrad)',
};


// ─── Main component ────────────────────────────────────────────────

type ActionMode =
  | { kind: 'none' }
  | { kind: 'move' }
  | { kind: 'attack' }
  | { kind: 'duel' }
  | { kind: 'stratagem'; id: StratagemId };

export function TacticalBattleScreen() {
  const battle = useGameStore((s) => s.tacticalBattle);
  const officers = useGameStore((s) => s.officers);
  const close = useGameStore((s) => s.cancelTacticalBattle);
  const start = useGameStore((s) => s.startTacticalBattle);
  const applyResolution = useGameStore((s) => s.applyTacticalResolution);
  const playerForceId = useGameStore((s) => s.playerForceId);
  const battleSpeed = useGameStore((s) => s.battleSpeed);
  const setBattleSpeed = useGameStore((s) => s.setBattleSpeed);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [actionMode, setActionMode] = useState<ActionMode>({ kind: 'none' });
  const [showCinematic, setShowCinematic] = useState(true);
  const [show3D, setShow3D] = useState(true);
  const t = useT();
  const desc = useDesc();
  const [showResults, setShowResults] = useState(false);
  const [voiceLine, setVoiceLine] = useState<{ text: string; key: number } | null>(null);
  const [duelResult, setDuelResult] = useState<DuelResult | null>(null);
  const [hoveredCoord, setHoveredCoord] = useState<HexCoord | null>(null);
  // Visual effects: trails for recent moves, arcs for recent attacks.
  const [moveTrails, setMoveTrails] = useState<{ id: number; from: HexCoord; to: HexCoord }[]>([]);
  const [attackArcs, setAttackArcs] = useState<{ id: number; from: HexCoord; to: HexCoord; kind: 'melee' | 'ranged' }[]>([]);

  // Identify which side the player is on.
  const playerSide: 'attacker' | 'defender' | null = useMemo(() => {
    if (!battle) return null;
    if (battle.attackerForceId === playerForceId) return 'attacker';
    if (battle.defenderForceId === playerForceId) return 'defender';
    return null;
  }, [battle, playerForceId]);

  // Hide cinematic after 3.6s.
  useEffect(() => {
    if (!battle) return;
    const id = setTimeout(() => setShowCinematic(false), 3600);
    return () => clearTimeout(id);
  }, [battle?.id]);

  // After every player move, if it's AI's turn, run AI.
  useEffect(() => {
    if (!battle || battle.winner) return;
    if (battle.activeSide !== playerSide) {
      const delay = Math.max(150, 700 / Math.max(1, battleSpeed));
      const id = setTimeout(() => {
        const next = aiTakeTurn(battle, officers, Math.random);
        start(next);
      }, delay);
      return () => clearTimeout(id);
    }
  }, [battle, officers, playerSide, start, battleSpeed]);

  // Pop voice lines from the log to the ticker.
  useEffect(() => {
    if (!battle?.log || battle.log.length === 0) return;
    const last = battle.log[battle.log.length - 1];
    if (last.kind === 'voice' || last.kind === 'arrival') {
      setVoiceLine({ text: last.text, key: Date.now() });
    }
  }, [battle?.log?.length]);

  // Sound effects on damage popup spawn.
  useEffect(() => {
    const pops = battle?.damagePopups;
    if (!pops || pops.length === 0) return;
    const latest = pops[pops.length - 1];
    if (latest.text.includes('!')) playSfx('sword');
    else if (latest.text.includes('⚡')) playSfx('fire');
    else if (latest.color === '#88b7e8') playSfx('arrow');
    else playSfx('sword');
  }, [battle?.damagePopups?.length]);

  // Winner trigger → show results modal.
  useEffect(() => {
    if (battle?.winner && !showResults) {
      const id = setTimeout(() => setShowResults(true), 800);
      return () => clearTimeout(id);
    }
  }, [battle?.winner, showResults]);

  if (!battle) return null;

  const selected = selectedId
    ? battle.units.find((u) => u.id === selectedId)
    : null;

  const myTurn = playerSide && battle.activeSide === playerSide && !battle.winner;

  const onTileClick = (c: HexCoord) => {
    if (!myTurn) return;
    const u = unitAt(battle, c);
    // Selecting one of my units?
    if (u && u.side === playerSide) {
      setSelectedId(u.id);
      setActionMode({ kind: 'none' });
      return;
    }
    if (!selected) return;
    // Mode-dependent dispatch.
    if (actionMode.kind === 'move' && canMove(battle, selected, c)) {
      const fromCoord = selected.coord;
      start(moveUnit(battle, selected.id, c));
      const tid = Date.now();
      setMoveTrails((t) => [...t, { id: tid, from: fromCoord, to: c }]);
      setTimeout(() => setMoveTrails((t) => t.filter((x) => x.id !== tid)), 900);
      setActionMode({ kind: 'none' });
      return;
    }
    if (actionMode.kind === 'attack' && u && u.side !== playerSide) {
      if (canAttack(battle, selected, u)) {
        const kind: 'melee' | 'ranged' = selected.unitType === 'archers' || selected.unitType === 'siege' ? 'ranged' : 'melee';
        const aid = Date.now();
        setAttackArcs((a) => [...a, { id: aid, from: selected.coord, to: u.coord, kind }]);
        setTimeout(() => setAttackArcs((a) => a.filter((x) => x.id !== aid)), 700);
        start(attackUnits(battle, selected.id, u.id, officers, Math.random));
        setActionMode({ kind: 'none' });
      }
      return;
    }
    if (actionMode.kind === 'duel' && u && u.side !== playerSide) {
      // Both must be commanders (or at least war ≥ 60) and adjacent.
      if (hexDistance(selected.coord, u.coord) !== 1) {
        alert('Must be adjacent for a duel.');
        return;
      }
      const me = officers[selected.officerId];
      const foe = officers[u.officerId];
      if (!me || !foe) return;
      const meCheck = canDuel(me);
      const foeCheck = canDuel(foe);
      if (!meCheck.ok) { alert(`Your officer cannot duel: ${meCheck.reason}`); return; }
      if (!foeCheck.ok) { alert(`Enemy cannot duel: ${foeCheck.reason}`); return; }
      const result = resolveDuel({ attacker: me, defender: foe });
      // Spend caller's AP and apply duel result.
      let next = { ...battle, units: battle.units.map((unit) => unit.id === selected.id ? { ...unit, ap: 0 } : unit) };
      if (result.killedId) {
        // Remove the loser unit and mark the officer dead globally (apply at battle end).
        next = {
          ...next,
          units: next.units.filter((unit) => unit.officerId !== result.killedId),
        };
      }
      next = {
        ...next,
        log: [
          ...(next.log ?? []),
          {
            turn: next.turn,
            text: result.winner === 'draw'
              ? `${me.name.en} and ${foe.name.en} fight to a draw — both wounded.`
              : `${result.winner === 'attacker' ? me.name.en : foe.name.en} slew ${result.winner === 'attacker' ? foe.name.en : me.name.en} in single combat!`,
            kind: 'event',
          },
        ],
      };
      start(next);
      setDuelResult(result);
      setActionMode({ kind: 'none' });
      return;
    }
    if (actionMode.kind === 'stratagem') {
      const r = applyStratagem(battle, selected.id, actionMode.id, c, officers);
      if (r.ok) {
        start(r.battle);
        setActionMode({ kind: 'none' });
      } else if (r.reason) {
        alert(r.reason);
      }
      return;
    }
  };

  const onEndTurn = () => {
    if (!myTurn) return;
    start(endTurn(battle));
    setSelectedId(null);
    setActionMode({ kind: 'none' });
  };

  const svgWidth = battle.width * HEX_COL_STEP + HEX_W / 4;
  const svgHeight = battle.height * HEX_ROW_STEP + HEX_H;

  const namedMap = NAMED_MAPS_BY_ID[`map-${battle.cityId.replace('city-', '')}`];
  const battleTitleZh = namedMap?.name.zh ?? '戰術戰闘';
  const battleTitleEn = namedMap?.name.en ?? 'Tactical Battle';

  return (
    <div className={styles.root}>
      {showCinematic && (
        <div className={styles.cinematic}>
          <div className={styles.cinematicTitle}>
            <div className={styles.cinematicTitleZh}>{battleTitleZh}</div>
            <div className={styles.cinematicTitleEn}>{battleTitleEn}</div>
            {namedMap && (
              <div className={styles.cinematicDesc}>{desc(namedMap)}</div>
            )}
          </div>
        </div>
      )}
      <header className={styles.topBar}>
        <div className={styles.title}>
          <span className={styles.titleZh}>{battleTitleZh}</span>
          <span className={styles.titleEn}>{battleTitleEn}</span>
        </div>
        <div className={styles.turnBlock}>
          {t('第', 'Turn')} {battle.turn} {t('回', '')} · {battle.activeSide === playerSide ? t('我方回合', 'YOUR TURN') : t('敵方回合', 'ENEMY TURN')}
          <span className={styles.weatherChip} style={{ marginLeft: '0.6rem' }}>
            {WEATHER_LABEL[battle.weather]}
          </span>
          <span className={styles.weatherChip}>{TOD_LABEL[battle.timeOfDay]}</span>
          {battle.attackerFormation && battle.attackerFormation !== 'none' && (
            <span className={styles.formationChip}>
              A: {FORMATIONS_BY_ID[battle.attackerFormation]?.name.zh ?? battle.attackerFormation}
            </span>
          )}
          {battle.defenderFormation && battle.defenderFormation !== 'none' && (
            <span className={styles.formationChip}>
              D: {FORMATIONS_BY_ID[battle.defenderFormation]?.name.zh ?? battle.defenderFormation}
            </span>
          )}
        </div>
        <button
          onClick={() => setShow3D(true)}
          style={{
            background: '#1a3a5a', color: '#88b7e8',
            border: '1px solid #88b7e8', padding: '0.3rem 0.6rem',
            cursor: 'pointer', fontFamily: 'Songti SC, serif',
            marginRight: '0.5rem',
          }}
          title="Switch to 3D view"
        >{t('切換 3D', 'Switch 3D')} ⇄</button>
        <button className={styles.exitBtn} onClick={close}>
          {t('退出', 'Exit')}
        </button>
      </header>

      {show3D && <TacticalBattleScreen3D onClose={() => setShow3D(false)} />}

      {(battle.attackerObjective || battle.defenderObjective) && (
        <div style={{ display: 'flex', gap: '0.5rem', padding: '0 0.75rem' }}>
          {battle.attackerObjective && (
            <div className={styles.objectiveBar}>
              <span style={{ color: '#b8442e' }}>Attacker:</span>
              <span>{describeObjective(battle.attackerObjective)}</span>
              {battle.attackerObjective.turnsRequired && (
                <span className={styles.objectiveProgress}>
                  {battle.attackerObjective.progress ?? 0} / {battle.attackerObjective.turnsRequired}
                </span>
              )}
            </div>
          )}
          {battle.defenderObjective && (
            <div className={styles.objectiveBar}>
              <span style={{ color: '#3a7dd9' }}>Defender:</span>
              <span>{describeObjective(battle.defenderObjective)}</span>
              {battle.defenderObjective.turnsRequired && (
                <span className={styles.objectiveProgress}>
                  {battle.defenderObjective.progress ?? 0} / {battle.defenderObjective.turnsRequired}
                </span>
              )}
            </div>
          )}
        </div>
      )}

      <div className={`${styles.battlefield} tkm-iso-stage`}>
        <div className={`${styles.gridWrap} tkm-iso-svg`} style={{ position: 'relative' }}>
          {/* Weather overlay */}
          {battle.weather === 'rain' && <div className={`${styles.weatherOverlay} ${styles.weatherRain}`} />}
          {battle.weather === 'snow' && <div className={`${styles.weatherOverlay} ${styles.weatherSnow}`} />}
          {battle.weather === 'fog' && <div className={`${styles.weatherOverlay} ${styles.weatherFog}`} />}
          {battle.weather === 'wind' && <div className={`${styles.weatherOverlay} ${styles.weatherWind}`} />}
          {/* Time-of-day overlay */}
          {battle.timeOfDay === 'night' && <div className={`${styles.weatherOverlay} ${styles.timeNight}`} />}
          {battle.timeOfDay === 'dusk' && <div className={`${styles.weatherOverlay} ${styles.timeDusk}`} />}
          {battle.timeOfDay === 'dawn' && <div className={`${styles.weatherOverlay} ${styles.timeDawn}`} />}
          {/* Damage popups + impact splash + sparks */}
          {(battle.damagePopups ?? []).map((p) => {
            const { x, y } = hexCenter(p.coord.col, p.coord.row);
            const isFire = p.text.includes('⚡') || p.color === '#e0d090';
            const isCrit = p.text.includes('!');
            return (
              <div key={p.id} style={{ pointerEvents: 'none', position: 'absolute', inset: 0 }}>
                {/* Impact ring at the hit hex */}
                <div
                  className={styles.impactSplash}
                  style={{
                    color: p.color,
                    left: `${x}px`,
                    top: `${y}px`,
                    width: `${HEX_SIZE * (isCrit ? 1.7 : 1.2)}px`,
                    height: `${HEX_SIZE * (isCrit ? 1.7 : 1.2)}px`,
                  }}
                />
                {/* Sparks fly outward */}
                {Array.from({ length: isCrit ? 8 : 5 }).map((_, i) => {
                  const angle = (Math.PI * 2 * i) / (isCrit ? 8 : 5) + (i % 2) * 0.2;
                  const dist = isCrit ? 26 : 18;
                  return (
                    <div
                      key={i}
                      className={styles.spark}
                      style={{
                        left: `${x}px`,
                        top: `${y}px`,
                        background: p.color,
                        boxShadow: `0 0 4px ${p.color}`,
                        ['--sx' as string]: `${Math.cos(angle) * dist}px`,
                        ['--sy' as string]: `${Math.sin(angle) * dist}px`,
                      } as React.CSSProperties}
                    />
                  );
                })}
                {/* Lightning bolts for elemental crits */}
                {isFire && (
                  <svg
                    style={{ position: 'absolute', left: x - 18, top: y - 24, pointerEvents: 'none' }}
                    width="36"
                    height="36"
                  >
                    <path d="M 16 0 L 12 14 L 18 14 L 13 30 L 26 12 L 19 12 L 24 0 Z" fill="#e0d090" opacity="0.9">
                      <animate attributeName="opacity" values="1;0" dur="0.4s" fill="freeze" />
                    </path>
                  </svg>
                )}
                <div
                  className={styles.damagePopup}
                  style={{
                    color: p.color,
                    left: `${x}px`,
                    top: `${y - HEX_SIZE}px`,
                  }}
                >
                  {p.text}
                </div>
              </div>
            );
          })}
          {/* Voice ticker */}
          {voiceLine && (
            <div className={styles.voiceTicker} key={voiceLine.key}>
              {voiceLine.text}
            </div>
          )}
          {/* Attack damage prediction tooltip */}
          {actionMode.kind === 'attack' && selected && hoveredCoord && (() => {
            const targetUnit = unitAt(battle, hoveredCoord);
            if (!targetUnit || targetUnit.side === selected.side) return null;
            if (!canAttack(battle, selected, targetUnit)) return null;
            const pred = predictAttackDamage(battle, selected, targetUnit, officers);
            const { x, y } = hexCenter(hoveredCoord.col, hoveredCoord.row);
            return (
              <div
                style={{
                  position: 'absolute',
                  left: `${x + HEX_SIZE}px`,
                  top: `${y - HEX_SIZE}px`,
                  background: 'rgba(20, 14, 8, 0.95)',
                  border: '1px solid #d4a84a',
                  padding: '0.4rem 0.6rem',
                  fontFamily: 'ui-monospace, monospace',
                  fontSize: '0.72rem',
                  color: '#d4a84a',
                  pointerEvents: 'none',
                  zIndex: 4,
                  whiteSpace: 'nowrap',
                  boxShadow: '0 0 8px rgba(212, 168, 74, 0.5)',
                }}
              >
                <div style={{ color: '#ff9070' }}>
                  → DMG {pred.min.toLocaleString()}–{pred.max.toLocaleString()}
                </div>
                <div style={{ color: '#88b7e8', fontSize: '0.68rem' }}>
                  ← Counter {pred.counterMin.toLocaleString()}–{pred.counterMax.toLocaleString()}
                </div>
              </div>
            );
          })()}
          <svg
            className={styles.svgGrid}
            width={svgWidth}
            height={svgHeight}
            viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          >
            <SharedMapDefs />
            {/* Atmospheric backdrop — sky gradient + soft vignette behind the hex field */}
            <rect width={svgWidth} height={svgHeight} fill="url(#tkmMapBg)" />
            <rect width={svgWidth} height={svgHeight} fill="url(#tkmVignette)" pointerEvents="none" />
            {battle.tiles.map((t) => {
              const { x, y } = hexCenter(t.coord.col, t.coord.row);
              const isReachable =
                selected &&
                actionMode.kind === 'move' &&
                canMove(battle, selected, t.coord);
              const isAttackable =
                selected &&
                actionMode.kind === 'attack' &&
                (() => {
                  const u = unitAt(battle, t.coord);
                  return !!u && canAttack(battle, selected, u);
                })();
              const isStratagemTarget =
                selected &&
                actionMode.kind === 'stratagem' &&
                hexDistance(selected.coord, t.coord) <= 4;
              return (
                <g
                  key={`${t.coord.col},${t.coord.row}`}
                  className={myTurn ? 'tkm-hex-interactive' : undefined}
                  onClick={() => onTileClick(t.coord)}
                  onMouseEnter={() => setHoveredCoord(t.coord)}
                  onMouseLeave={() => setHoveredCoord(null)}
                  style={{ cursor: myTurn ? 'pointer' : 'default' }}
                >
                  <polygon
                    points={hexPoints(x, y)}
                    fill={TERRAIN_FILL[t.terrain]}
                    stroke={
                      isAttackable
                        ? '#b8442e'
                        : isReachable
                          ? '#d4a84a'
                          : isStratagemTarget
                            ? '#88b7e8'
                            : '#1a1410'
                    }
                    strokeWidth={isReachable || isAttackable || isStratagemTarget ? 2 : 1}
                    opacity={
                      isAttackable || isReachable || isStratagemTarget ? 1 : 0.85
                    }
                  />
                  <SharedTerrainArt x={x} y={y} terrain={t.terrain} />
                </g>
              );
            })}
            {/* Movement trails — dotted line from previous coord to new coord */}
            {moveTrails.map((t) => {
              const a = hexCenter(t.from.col, t.from.row);
              const b = hexCenter(t.to.col, t.to.row);
              return (
                <g key={`trail-${t.id}`} pointerEvents="none">
                  <line
                    x1={a.x} y1={a.y} x2={b.x} y2={b.y}
                    stroke="#d4a84a"
                    strokeWidth="2"
                    strokeDasharray="3 3"
                    opacity="0.85"
                  >
                    <animate attributeName="opacity" values="0.95;0" dur="0.9s" fill="freeze" />
                  </line>
                  <circle cx={a.x} cy={a.y} r="3" fill="#d4a84a">
                    <animate attributeName="opacity" values="1;0" dur="0.9s" fill="freeze" />
                  </circle>
                </g>
              );
            })}
            {/* Attack arcs — projectile for ranged, slash for melee */}
            {attackArcs.map((a) => {
              const p1 = hexCenter(a.from.col, a.from.row);
              const p2 = hexCenter(a.to.col, a.to.row);
              if (a.kind === 'ranged') {
                const midX = (p1.x + p2.x) / 2;
                const midY = (p1.y + p2.y) / 2 - 40;
                return (
                  <g key={`arc-${a.id}`} pointerEvents="none">
                    <path
                      d={`M ${p1.x} ${p1.y} Q ${midX} ${midY} ${p2.x} ${p2.y}`}
                      stroke="#d4a84a"
                      strokeWidth="1.5"
                      fill="none"
                      strokeDasharray="200"
                      strokeDashoffset="200"
                      opacity="0.9"
                    >
                      <animate attributeName="stroke-dashoffset" values="200;0" dur="0.4s" fill="freeze" />
                      <animate attributeName="opacity" values="0.95;0" begin="0.4s" dur="0.3s" fill="freeze" />
                    </path>
                    <circle r="3" fill="#f0e0b0">
                      <animateMotion path={`M ${p1.x} ${p1.y} Q ${midX} ${midY} ${p2.x} ${p2.y}`} dur="0.5s" fill="freeze" />
                      <animate attributeName="opacity" values="1;1;0" dur="0.7s" fill="freeze" />
                    </circle>
                  </g>
                );
              }
              return (
                <g key={`arc-${a.id}`} pointerEvents="none">
                  <line
                    x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y}
                    stroke="#ffb494"
                    strokeWidth="3"
                    opacity="0.85"
                  >
                    <animate attributeName="opacity" values="1;0" dur="0.6s" fill="freeze" />
                    <animate attributeName="stroke-width" values="3;0.5" dur="0.6s" fill="freeze" />
                  </line>
                </g>
              );
            })}
            {/* City defense structures placed on the defender's edge */}
            {(battle.cityStructures ?? []).map((s) => {
              const { x, y } = hexCenter(s.coord.col, s.coord.row);
              return (
                <CityStructureIcon
                  key={`struct-${s.slotIndex}`}
                  x={x}
                  y={y}
                  buildingId={s.buildingId}
                  level={s.level}
                  hp={s.hp}
                  maxHp={100 * s.level + 100}
                />
              );
            })}
            {battle.units.map((u) => {
              const { x, y } = hexCenter(u.coord.col, u.coord.row);
              const off = officers[u.officerId];
              const isSel = u.id === selectedId;
              const color = u.side === 'attacker' ? '#b8442e' : '#3a7dd9';
              const trooppct = u.troops / Math.max(1, u.maxTroops);
              return (
                <g
                  key={u.id}
                  onClick={() => onTileClick(u.coord)}
                  style={{ cursor: 'pointer' }}
                >
                  {/* Selection glow */}
                  {isSel && (
                    <circle
                      cx={x}
                      cy={y}
                      r={HEX_SIZE * 0.85}
                      fill="none"
                      stroke="#d4a84a"
                      strokeWidth="2"
                      opacity="0.6"
                    >
                      <animate attributeName="r" values={`${HEX_SIZE * 0.85};${HEX_SIZE * 1.05};${HEX_SIZE * 0.85}`} dur="1.5s" repeatCount="indefinite" />
                      <animate attributeName="opacity" values="0.7;0.2;0.7" dur="1.5s" repeatCount="indefinite" />
                    </circle>
                  )}
                  {/* Ground shadow under the unit for visual weight */}
                  <ellipse cx={x} cy={y + HEX_SIZE * 0.6} rx={HEX_SIZE * 0.55} ry="2.5"
                    fill="rgba(0,0,0,0.45)" pointerEvents="none" />
                  {/* Body — silhouette varies by unit type, with drop-shadow filter */}
                  <path
                    d={unitSilhouette(x, y, HEX_SIZE * 0.75, u.unitType)}
                    fill={color}
                    stroke={isSel ? '#d4a84a' : '#1a1410'}
                    strokeWidth={isSel ? 2.5 : 1.5}
                    opacity={0.95}
                    filter="url(#tkmUnitShadow)"
                  />
                  {/* Pennant flag on a pole — color matches side; banner ripples in wind */}
                  <line
                    x1={x + HEX_SIZE * 0.5}
                    y1={y - HEX_SIZE * 0.85}
                    x2={x + HEX_SIZE * 0.5}
                    y2={y - HEX_SIZE * 1.15}
                    stroke="#1a1410"
                    strokeWidth="0.8"
                  />
                  <path
                    className="tkm-pennant"
                    d={`M ${x + HEX_SIZE * 0.5} ${y - HEX_SIZE * 1.15}
                        L ${x + HEX_SIZE * 0.95} ${y - HEX_SIZE * 1.05}
                        L ${x + HEX_SIZE * 0.5} ${y - HEX_SIZE * 0.95} Z`}
                    fill={color}
                    stroke="#1a1410"
                    strokeWidth="0.4"
                  />
                  {/* Unit-type weapon ornament */}
                  <UnitTypeIcon x={x} y={y} unitType={u.unitType} side={u.side} />
                  {/* Surname character — centered */}
                  <text
                    x={x}
                    y={y + 2}
                    textAnchor="middle"
                    fontSize="16"
                    fontWeight="bold"
                    fill="#fff"
                    fontFamily="Songti SC, serif"
                    pointerEvents="none"
                    stroke="#1a1410"
                    strokeWidth="0.4"
                  >
                    {off ? surname(off.name.zh) : '?'}
                  </text>
                  {/* HP bar under the figure */}
                  <rect
                    x={x - HEX_SIZE * 0.55}
                    y={y + HEX_SIZE * 0.55}
                    width={HEX_SIZE * 1.1}
                    height={3}
                    fill="#1a1410"
                    stroke="#3a2d20"
                    strokeWidth="0.5"
                  />
                  <rect
                    x={x - HEX_SIZE * 0.55 + 0.5}
                    y={y + HEX_SIZE * 0.55 + 0.5}
                    width={(HEX_SIZE * 1.1 - 1) * trooppct}
                    height={2}
                    fill={trooppct > 0.5 ? '#7ed68a' : trooppct > 0.25 ? '#c19a3b' : '#b8442e'}
                  />
                  {/* Troop count chip */}
                  <text
                    x={x}
                    y={y + HEX_SIZE * 0.55 + 11}
                    textAnchor="middle"
                    fontSize="7.5"
                    fill="#e8d9b0"
                    fontFamily="ui-monospace, monospace"
                    pointerEvents="none"
                  >
                    {Math.round(u.troops / 100) / 10}k
                  </text>
                  {/* Commander star */}
                  {u.isCommander && (
                    <text
                      x={x}
                      y={y - HEX_SIZE * 0.7}
                      textAnchor="middle"
                      fontSize="11"
                      fill="#d4a84a"
                      pointerEvents="none"
                      stroke="#1a1410"
                      strokeWidth="0.4"
                    >
                      ★
                    </text>
                  )}
                </g>
              );
            })}
            {/* Decorative map frame + compass overlay (rendered last so they sit on top) */}
            <SharedMapFrame width={svgWidth} height={svgHeight} />
            <SharedCompassRose x={svgWidth - 50} y={50} />
          </svg>
        </div>

        <div className={styles.sidebar}>
          {selected ? (
            <UnitPanel
              unit={selected}
              officer={officers[selected.officerId] ?? null}
              actionMode={actionMode}
              setActionMode={setActionMode}
              canAct={!!myTurn && selected.side === playerSide}
              battle={battle}
            />
          ) : (
            <div className={styles.sidePanel}>
              <div className={styles.panelLabel}>Click a unit</div>
              <div style={{ fontSize: '0.78rem', color: '#8a7050', fontStyle: 'italic' }}>
                Select one of your units (marked red as attacker, blue as defender) to issue orders.
              </div>
            </div>
          )}

          <div className={styles.sidePanel}>
            <div className={styles.panelLabel}>Forces</div>
            <ForcePanel battle={battle} />
          </div>

          <button
            className={styles.endTurnBtn}
            onClick={onEndTurn}
            disabled={!myTurn}
          >
            {t('結束回合', 'End Turn')}
          </button>

          {/* Battle speed control */}
          <div style={{ display: 'flex', gap: 4, marginTop: '0.4rem', justifyContent: 'center', fontSize: '0.75rem' }}>
            <span style={{ color: '#8a7050', alignSelf: 'center' }}>Speed:</span>
            {[1, 2, 4].map((s) => (
              <button
                key={s}
                onClick={() => setBattleSpeed(s)}
                style={{
                  background: battleSpeed === s ? '#3a2d20' : 'transparent',
                  border: '1px solid ' + (battleSpeed === s ? '#d4a84a' : '#4a3520'),
                  color: battleSpeed === s ? '#d4a84a' : '#8a7050',
                  padding: '0.2rem 0.6rem',
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                }}
              >
                {s}×
              </button>
            ))}
          </div>
        </div>
      </div>

      {showResults && battle.winner && (
        <BattleResultsModal
          battle={battle}
          playerSide={playerSide}
          onClose={() => {
            const resolution = resolveBattleEnd(battle, officers);
            applyResolution(
              resolution.capturedOfficerIds,
              [...resolution.attackerDead, ...resolution.defenderDead],
              resolution.lootGold,
              resolution.winner,
            );
            setShowResults(false);
          }}
        />
      )}
      {duelResult && (
        <DuelModal
          result={duelResult}
          onClose={() => setDuelResult(null)}
        />
      )}
    </div>
  );
}

function UnitPanel({
  unit,
  officer,
  actionMode,
  setActionMode,
  canAct,
  battle,
}: {
  unit: TacticalUnit;
  officer: Officer | null;
  actionMode: ActionMode;
  setActionMode: (m: ActionMode) => void;
  canAct: boolean;
  battle: TacticalBattle;
}) {
  const t = useT();
  const desc = useDesc();
  // Each officer's personal 戰法 list, mapped to runtime tactical-battle actions.
  const personalTactics = personalTacticsForUnit(officer, unit);

  // Stratagems available to THIS officer/unit — filter by INT / WAR / unit type / signature.
  const availableStratagems = STRATAGEMS.filter((s) => {
    if (!officer) return false;
    if (s.signatureOf) {
      // Signature moves — only their owners can use them; others never see them.
      if (!s.signatureOf.includes(officer.id)) return false;
    }
    if (s.minIntelligence && officer.stats.intelligence < s.minIntelligence) return false;
    if (s.minWar && officer.stats.war < s.minWar) return false;
    if (s.requiresUnitType && !s.requiresUnitType.includes(unit.unitType)) return false;
    return true;
  });

  return (
    <div className={styles.sidePanel}>
      <div className={styles.panelLabel}>Selected Unit</div>
      <div>
        <span className={styles.unitName}>{officer?.name.zh ?? '?'}</span>
        <span className={styles.unitNameEn}>{officer?.name.en ?? ''}</span>
      </div>
      {officer && (
        <div style={{ fontSize: '0.65rem', color: '#8a7050', marginTop: '0.15rem', letterSpacing: '0.1rem' }}>
          LED {officer.stats.leadership} · WAR {officer.stats.war} · INT {officer.stats.intelligence}
        </div>
      )}
      <div className={styles.unitStats}>
        <span>HP {unit.troops.toLocaleString()}/{unit.maxTroops.toLocaleString()}</span>
        <span>AP {unit.ap}/{unit.maxAp}</span>
        <span>Morale {unit.morale}</span>
        <span>{UNIT_TYPE_LABEL[unit.unitType]} ({UNIT_TYPE_GLYPH[unit.unitType]})</span>
      </div>
      {unit.effects.length > 0 && (
        <div className={styles.statusBar}>
          {unit.effects.map((e, i) => (
            <span
              key={i}
              className={`${styles.statusChip} ${
                e.kind === 'burning' ? styles.statusBurning
                : e.kind === 'confused' ? styles.statusConfused
                : styles.statusDefending
              }`}
            >
              {e.kind} ({e.turnsLeft})
            </span>
          ))}
        </div>
      )}
      <div style={{ marginTop: '0.6rem' }}>
        <button
          className={`${styles.actionButton} ${actionMode.kind === 'move' ? styles.actionButtonActive : ''}`}
          disabled={!canAct || unit.ap === 0}
          onClick={() => setActionMode({ kind: actionMode.kind === 'move' ? 'none' : 'move' })}
        >
          <div className={styles.actionTitle}>
            <span><span className={styles.actionLabel}>{t('移動', 'Move')}</span></span>
            <span style={{ fontSize: '0.7rem', color: '#8a7050' }}>1 AP / hex</span>
          </div>
          <div className={styles.actionDesc}>Step to an adjacent hex.</div>
        </button>
        <button
          className={`${styles.actionButton} ${actionMode.kind === 'attack' ? styles.actionButtonActive : ''}`}
          disabled={!canAct || unit.ap === 0}
          onClick={() => setActionMode({ kind: actionMode.kind === 'attack' ? 'none' : 'attack' })}
        >
          <div className={styles.actionTitle}>
            <span><span className={styles.actionLabel}>{t('攻擊', 'Attack')}</span></span>
            <span style={{ fontSize: '0.7rem', color: '#8a7050' }}>1 AP</span>
          </div>
          <div className={styles.actionDesc}>Strike an adjacent enemy.</div>
        </button>
        <button
          className={`${styles.actionButton} ${actionMode.kind === 'duel' ? styles.actionButtonActive : ''}`}
          disabled={!canAct || unit.ap === 0}
          onClick={() => setActionMode({ kind: actionMode.kind === 'duel' ? 'none' : 'duel' })}
        >
          <div className={styles.actionTitle}>
            <span><span className={styles.actionLabel}>{t('一騎打', 'Duel')}</span></span>
            <span style={{ fontSize: '0.7rem', color: '#d4a84a' }}>winner kills loser</span>
          </div>
          <div className={styles.actionDesc}>
            Challenge an adjacent enemy commander to single combat. Decisive — the loser dies.
          </div>
        </button>
        {availableStratagems.length === 0 && (
          <div style={{
            fontSize: '0.72rem', color: '#8a7050', fontStyle: 'italic',
            padding: '0.5rem 0.65rem', borderTop: '1px dotted #3a2d20', marginTop: '0.3rem',
          }}>
            此武將無計可施 — INT/WAR 不足或兵種不符。
          </div>
        )}
        {availableStratagems.map((s) => {
          const cdKey = `${unit.id}-${s.id}`;
          const onCd = (battle.stratagemCooldowns[cdKey] ?? 0) > battle.turn;
          const active = actionMode.kind === 'stratagem' && actionMode.id === s.id;
          const isSignature = !!s.signatureOf;
          return (
            <button
              key={s.id}
              className={`${styles.actionButton} ${active ? styles.actionButtonActive : ''}`}
              disabled={!canAct || unit.ap === 0 || onCd}
              onClick={() => setActionMode(active ? { kind: 'none' } : { kind: 'stratagem', id: s.id })}
              style={isSignature ? { borderColor: '#d4a84a', boxShadow: 'inset 0 0 6px rgba(212,168,74,0.18)' } : undefined}
            >
              <div className={styles.actionTitle}>
                <span>
                  <span className={styles.actionLabel}>
                    {isSignature && <span style={{ color: '#d4a84a' }}>★ </span>}
                    {t(s.name.zh, s.name.en)}
                  </span>
                </span>
                <span style={{ fontSize: '0.7rem', color: '#8a7050' }}>
                  {onCd ? `CD ${(battle.stratagemCooldowns[cdKey] ?? 0) - battle.turn}t` : `rng ${s.range}`}
                </span>
              </div>
              <div className={styles.actionDesc}>{desc(s)}</div>
            </button>
          );
        })}

        {/* ── Personal Tactics 個人戰法 ── unique to this officer */}
        {personalTactics.length > 0 && (
          <>
            <div style={{
              marginTop: '0.6rem',
              padding: '0.35rem 0.65rem',
              fontSize: '0.65rem',
              letterSpacing: '0.2rem',
              color: '#d4a84a',
              textTransform: 'uppercase',
              borderTop: '1px solid #4a3520',
              borderBottom: '1px dotted #3a2d20',
            }}>
              ★ {t('個人戰法', 'Personal Tactics')}
            </div>
            {personalTactics.map((pt) => {
              const cdKey = `${unit.id}-${pt.underlying}`;
              const onCd = (battle.stratagemCooldowns[cdKey] ?? 0) > battle.turn;
              const active = actionMode.kind === 'stratagem' && actionMode.id === pt.underlying;
              return (
                <button
                  key={pt.id}
                  className={`${styles.actionButton} ${active ? styles.actionButtonActive : ''}`}
                  disabled={!canAct || unit.ap === 0 || onCd}
                  onClick={() => setActionMode(active ? { kind: 'none' } : { kind: 'stratagem', id: pt.underlying })}
                  style={pt.isSignature
                    ? { borderColor: '#d4a84a', boxShadow: 'inset 0 0 6px rgba(212,168,74,0.18)' }
                    : { borderColor: '#5a4530' }}
                  title={`${pt.description} · via ${pt.underlying}`}
                >
                  <div className={styles.actionTitle}>
                    <span>
                      <span className={styles.actionLabel}>
                        {pt.isSignature && <span style={{ color: '#d4a84a' }}>★ </span>}
                        {t(pt.nameZh, pt.nameEn)}
                      </span>
                    </span>
                    <span style={{ fontSize: '0.7rem', color: '#8a7050' }}>
                      {onCd ? `CD ${(battle.stratagemCooldowns[cdKey] ?? 0) - battle.turn}t` : `rng ${pt.range}`}
                    </span>
                  </div>
                  <div className={styles.actionDesc} style={{ fontStyle: 'italic' }}>
                    <span style={{ color: '#8a7050' }}>{CATEGORY_LABEL[pt.category]}</span> · {pt.nameEn}
                  </div>
                </button>
              );
            })}
          </>
        )}
      </div>
    </div>
  );
}

const CATEGORY_LABEL: Record<'melee' | 'ranged' | 'mystic' | 'disrupt' | 'strategy', string> = {
  melee:    '近戰 Melee',
  ranged:   '遠射 Ranged',
  mystic:   '玄妙 Mystic',
  disrupt:  '惑亂 Disrupt',
  strategy: '統御 Strategy',
};

function ForcePanel({ battle }: { battle: TacticalBattle }) {
  const attackers = battle.units.filter((u) => u.side === 'attacker');
  const defenders = battle.units.filter((u) => u.side === 'defender');
  const sum = (units: TacticalUnit[]) => units.reduce((s, u) => s + u.troops, 0);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <span style={{ color: '#b8442e' }}>Attacker</span>
        <span style={{ fontFamily: 'ui-monospace,monospace', color: '#c0a878' }}>
          {sum(attackers).toLocaleString()} ({attackers.length} units)
        </span>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <span style={{ color: '#3a7dd9' }}>Defender</span>
        <span style={{ fontFamily: 'ui-monospace,monospace', color: '#c0a878' }}>
          {sum(defenders).toLocaleString()} ({defenders.length} units)
        </span>
      </div>
    </div>
  );
}

function describeObjective(obj: BattleObjective): string {
  switch (obj.kind) {
    case 'destroy-commander':
      return 'Eliminate enemy commander';
    case 'hold-tile':
      return `Hold (${obj.tileCoord?.col},${obj.tileCoord?.row}) for ${obj.turnsRequired ?? 5} turns`;
    case 'escape':
      return 'Escape with the commander';
    case 'survive-turns':
      return `Survive ${obj.turnsRequired ?? 8} turns`;
    case 'escort':
      return 'Escort the unit off the map';
    case 'capture-supply':
      return 'Reach and hold the supply tile';
  }
}


/**
 * Path for a rounded shield — a tall rectangle with a pointed bottom,
 * the kind a warrior carries. Centered on (cx, cy) with given radius.
 */
function shieldPath(cx: number, cy: number, r: number): string {
  return `M ${cx - r} ${cy - r * 0.85}
          L ${cx + r} ${cy - r * 0.85}
          L ${cx + r * 0.95} ${cy + r * 0.4}
          L ${cx} ${cy + r * 0.95}
          L ${cx - r * 0.95} ${cy + r * 0.4}
          Z`;
}

/** Distinct silhouette per unit type — replaces shield for visual identity. */
function unitSilhouette(cx: number, cy: number, r: number, unitType: UnitType): string {
  switch (unitType) {
    case 'cavalry':
      // Kite shield — narrow pointed bottom, suggests a rider's profile.
      return `M ${cx - r * 0.85} ${cy - r * 0.85}
              L ${cx + r * 0.85} ${cy - r * 0.85}
              L ${cx + r * 0.7}  ${cy + r * 0.3}
              L ${cx}            ${cy + r * 1.05}
              L ${cx - r * 0.7}  ${cy + r * 0.3}
              Z`;
    case 'archers':
      // Curved half-moon (like a recurved bow drawn back).
      return `M ${cx - r * 0.95} ${cy - r * 0.7}
              Q ${cx} ${cy - r * 1.05} ${cx + r * 0.95} ${cy - r * 0.7}
              Q ${cx + r * 0.8} ${cy + r * 0.3} ${cx} ${cy + r * 0.85}
              Q ${cx - r * 0.8} ${cy + r * 0.3} ${cx - r * 0.95} ${cy - r * 0.7} Z`;
    case 'spearmen':
      // Tall narrow pavise with peaked top.
      return `M ${cx - r * 0.7} ${cy - r * 0.7}
              L ${cx}            ${cy - r * 1.05}
              L ${cx + r * 0.7}  ${cy - r * 0.7}
              L ${cx + r * 0.7}  ${cy + r * 0.85}
              L ${cx - r * 0.7}  ${cy + r * 0.85} Z`;
    case 'siege':
      // Wide rectangular tower with crenellated top.
      return `M ${cx - r * 1.0}  ${cy - r * 0.7}
              L ${cx - r * 0.7}  ${cy - r * 0.7}
              L ${cx - r * 0.7}  ${cy - r * 0.95}
              L ${cx - r * 0.35} ${cy - r * 0.95}
              L ${cx - r * 0.35} ${cy - r * 0.7}
              L ${cx + r * 0.35} ${cy - r * 0.7}
              L ${cx + r * 0.35} ${cy - r * 0.95}
              L ${cx + r * 0.7}  ${cy - r * 0.95}
              L ${cx + r * 0.7}  ${cy - r * 0.7}
              L ${cx + r * 1.0}  ${cy - r * 0.7}
              L ${cx + r * 1.0}  ${cy + r * 0.85}
              L ${cx - r * 1.0}  ${cy + r * 0.85} Z`;
    case 'navy':
      // Ship hull silhouette — flat top, curved bottom.
      return `M ${cx - r * 1.0}  ${cy - r * 0.7}
              L ${cx + r * 1.0}  ${cy - r * 0.7}
              L ${cx + r * 0.85} ${cy + r * 0.2}
              Q ${cx}            ${cy + r * 1.0}
                ${cx - r * 0.85} ${cy + r * 0.2}
              Z`;
    case 'infantry':
    default:
      return shieldPath(cx, cy, r);
  }
}

/** Unit-type icon shown on the shield — weapon/horse/bow/ship etc. */
function UnitTypeIcon({
  x,
  y,
  unitType,
  side,
}: {
  x: number;
  y: number;
  unitType: UnitType;
  side: 'attacker' | 'defender';
}) {
  const c = '#1a1410';
  const accent = side === 'attacker' ? '#5a2025' : '#1a3052';
  switch (unitType) {
    case 'cavalry':
      // Horse silhouette in the top corner.
      return (
        <g pointerEvents="none">
          <path
            d={`M ${x - 13} ${y - 22} q -3 0 -3 3 q 0 2 2 3 q 1 -1 3 -1 q 2 0 4 1 q 1 -3 -2 -5 q -2 -1 -4 -1 Z`}
            fill={accent}
            stroke={c}
            strokeWidth="0.5"
          />
          <line x1={x - 13} y1={y - 18} x2={x - 16} y2={y - 14} stroke={c} strokeWidth="1" />
        </g>
      );
    case 'archers':
      // Bow shape on the right edge.
      return (
        <g pointerEvents="none" stroke={c} strokeWidth="0.8" fill="none">
          <path d={`M ${x + 10} ${y - 12} Q ${x + 16} ${y} ${x + 10} ${y + 12}`} stroke={accent} strokeWidth="1.5" />
          <line x1={x + 10} y1={y - 12} x2={x + 10} y2={y + 12} stroke={accent} strokeWidth="0.5" />
        </g>
      );
    case 'spearmen':
      // Tall spear on left edge.
      return (
        <g pointerEvents="none">
          <line x1={x - 12} y1={y - 16} x2={x - 12} y2={y + 14} stroke={accent} strokeWidth="1.5" />
          <path d={`M ${x - 14} ${y - 16} L ${x - 12} ${y - 22} L ${x - 10} ${y - 16} Z`} fill={accent} stroke={c} strokeWidth="0.4" />
        </g>
      );
    case 'siege':
      // Catapult/wheel marker.
      return (
        <g pointerEvents="none" stroke={c} strokeWidth="0.6">
          <circle cx={x + 11} cy={y + 11} r="4" fill={accent} />
          <line x1={x + 7} y1={y + 11} x2={x + 15} y2={y + 11} stroke={c} />
          <line x1={x + 11} y1={y + 7} x2={x + 11} y2={y + 15} stroke={c} />
        </g>
      );
    case 'navy':
      // Wave/ship marker.
      return (
        <g pointerEvents="none" stroke={accent} strokeWidth="1" fill="none">
          <path d={`M ${x - 12} ${y + 15} Q ${x - 6} ${y + 12} ${x} ${y + 15} Q ${x + 6} ${y + 18} ${x + 12} ${y + 15}`} />
          <path d={`M ${x - 8} ${y + 10} L ${x + 8} ${y + 10} L ${x + 4} ${y + 6} L ${x - 4} ${y + 6} Z`} fill={accent} />
        </g>
      );
    case 'infantry':
    default:
      // Crossed-swords mark on bottom corner.
      return (
        <g pointerEvents="none" stroke={accent} strokeWidth="1.2">
          <line x1={x - 9} y1={y + 11} x2={x + 9} y2={y - 7} />
          <line x1={x + 9} y1={y + 11} x2={x - 9} y2={y - 7} />
        </g>
      );
  }
}

const COMPOUND_SURNAMES = ['諸葛', '司馬', '夏侯', '太史', '公孫', '上官', '歐陽'];

function surname(zh: string): string {
  for (const s of COMPOUND_SURNAMES) if (zh.startsWith(s)) return s.charAt(0);
  return zh.charAt(0);
}

/** Icon for a city defense structure placed on a hex. Distinct silhouette per kind. */
function CityStructureIcon({
  x, y, buildingId, level, hp, maxHp,
}: {
  x: number; y: number;
  buildingId: import('../../game/data/defenseBuildings').DefenseBuildingId;
  level: number;
  hp: number;
  maxHp: number;
}) {
  const hpPct = Math.max(0, Math.min(1, hp / maxHp));
  const COLOR: Record<string, string> = {
    'watchtower': '#d4a84a',
    'beacon': '#b8442e',
    'caltrops': '#7a6750',
    'lookout': '#88b7e8',
    'barracks-out': '#a87858',
    'granary-out': '#b8c87a',
    'iron-chains': '#5a4530',
    'rockfall': '#4a3a30',
    'arrow-platform': '#c19a3b',
  };
  const ZH: Record<string, string> = {
    'watchtower': '箭', 'beacon': '烽', 'caltrops': '拒',
    'lookout': '瞭', 'barracks-out': '營', 'granary-out': '倉',
    'iron-chains': '索', 'rockfall': '石', 'arrow-platform': '台',
  };
  const color = COLOR[buildingId] ?? '#d4a84a';
  const glyph = ZH[buildingId] ?? '?';

  return (
    <g pointerEvents="none">
      {/* Ground shadow under structure — anchors tall tower in iso view */}
      <ellipse cx={x + 2} cy={y + 12} rx="14" ry="3" fill="rgba(0,0,0,0.55)" />
      {/* Structure base — small tower-shape silhouette */}
      <rect
        x={x - 11} y={y - 14} width="22" height="22"
        fill={color} stroke="#1a1410" strokeWidth="1"
        opacity={0.92}
      />
      {/* Crenellated top edge */}
      <rect x={x - 11} y={y - 16} width="3" height="3" fill={color} stroke="#1a1410" strokeWidth="0.4" />
      <rect x={x - 5}  y={y - 16} width="3" height="3" fill={color} stroke="#1a1410" strokeWidth="0.4" />
      <rect x={x + 1}  y={y - 16} width="3" height="3" fill={color} stroke="#1a1410" strokeWidth="0.4" />
      <rect x={x + 7}  y={y - 16} width="3" height="3" fill={color} stroke="#1a1410" strokeWidth="0.4" />
      {/* zh glyph identifying kind */}
      <text
        x={x} y={y + 1} textAnchor="middle"
        fontSize="11" fill="#fff" fontWeight="bold"
        fontFamily="Songti SC, serif"
        stroke="#1a1410" strokeWidth="0.3"
      >
        {glyph}
      </text>
      {/* Level dots underneath */}
      <text
        x={x} y={y + 13} textAnchor="middle"
        fontSize="7" fill="#f0e0b0"
        fontFamily="ui-monospace, monospace"
      >
        {'★'.repeat(level)}
      </text>
      {/* HP bar */}
      <rect x={x - 11} y={y + 16} width="22" height="2" fill="#1a1410" stroke="#3a2818" strokeWidth="0.3" />
      <rect x={x - 11} y={y + 16} width={22 * hpPct} height="2" fill={hpPct > 0.5 ? '#7ed68a' : '#b8442e'} />
    </g>
  );
}
