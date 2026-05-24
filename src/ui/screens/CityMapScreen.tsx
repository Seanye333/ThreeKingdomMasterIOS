import { useMemo, useState } from 'react';
import { useGameStore } from '../../game/state/store';
import {
  DEFENSE_BUILDINGS,
  SLOT_POSITIONS,
  type DefenseBuildingId,
  aggregateSlotEffects,
} from '../../game/data/defenseBuildings';
import { previewBattlefield } from '../../game/systems/tactical';
import { citySize } from '../../game/systems/citySize';
import type { City, EntityId, BuildingId } from '../../game/types';
import { MapDefs, MapFrame, CompassRose, TerrainArt, TERRAIN_FILL_URL } from '../components/hexMapShared';

/**
 * Full-screen city map — renders the SAME hex battlefield that tactical
 * battles use, so the player sees exactly where their defense structures
 * will land when the city is sieged.
 *
 * Click an empty slot hex → open build picker.
 * Click a built slot hex → upgrade / demolish.
 */
const HEX_SIZE = 28;
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

/** Hex Chebyshev/axial distance (same as TacticalBattleScreen's hexDistance). */
function hexDistAxial(a: { col: number; row: number }, b: { col: number; row: number }): number {
  const ax = a.col, az = a.row - (a.col - (a.col & 1)) / 2;
  const ay = -ax - az;
  const bx = b.col, bz = b.row - (b.col - (b.col & 1)) / 2;
  const by = -bx - bz;
  return Math.max(Math.abs(ax - bx), Math.abs(ay - by), Math.abs(az - bz));
}

/** Building → zh glyph + color (mirrors CityStructureIcon kind). */
const INSIDE_BUILDING_GLYPH: Record<BuildingId, { glyph: string; color: string }> = {
  barracks: { glyph: '營', color: '#a87858' },
  market:   { glyph: '市', color: '#d4a84a' },
  foundry:  { glyph: '鐵', color: '#7a6750' },
  academy:  { glyph: '書', color: '#88b7e8' },
  temple:   { glyph: '寺', color: '#c19a3b' },
  farm:     { glyph: '田', color: '#b8c87a' },
  wall:     { glyph: '壁', color: '#5a4530' },
  shipyard: { glyph: '渠', color: '#3a6a98' },
};


export function CityMapScreen({ cityId, onClose }: { cityId: EntityId; onClose: () => void }) {
  const city = useGameStore((s) => s.cities[cityId]);
  const playerForceId = useGameStore((s) => s.playerForceId);
  const forces = useGameStore((s) => s.forces);
  const allBuildings = useGameStore((s) => s.buildings);
  const buildAction = useGameStore((s) => s.buildDefenseStructure);
  const upgradeAction = useGameStore((s) => s.upgradeDefenseStructure);
  const demolishAction = useGameStore((s) => s.demolishDefenseStructure);
  const [selectedSlot, setSelectedSlot] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showOverlays, setShowOverlays] = useState(true);

  // Reuse the SAME battlefield setup tactical battles use — terrain procedurally
  // generated from the city's real terrain category, port flag, and coords.
  const preview = useMemo(
    () => previewBattlefield(cityId, {
      terrain: city?.terrain,
      port: city?.port,
      x: city?.coords.x,
      y: city?.coords.y,
    }),
    [cityId, city?.terrain, city?.port, city?.coords.x, city?.coords.y],
  );

  if (!city) return null;

  const isPlayer = city.ownerForceId === playerForceId;
  const slots = city.buildSlots ?? [];
  const slotMap = new Map(slots.map((s) => [s.slot, s]));
  const size = citySize(city);
  const total = aggregateSlotEffects(slots);
  const builtCount = slots.filter((s) => s.buildingId).length;

  // SVG canvas dimensions matching the hex grid.
  const svgWidth = preview.width * HEX_COL_STEP + HEX_W / 4;
  const svgHeight = preview.height * HEX_ROW_STEP + HEX_H;

  // Map slotIndex → hex coord (with quick lookup).
  const slotIndexAtHex = new Map<string, number>();
  preview.slotPositions.forEach((pos, idx) => {
    slotIndexAtHex.set(`${pos.col},${pos.row}`, idx);
  });

  // City walls: the right-most column where the city sits.
  const cityWallCol = preview.width - 1;

  // ── Inside-city building placements ──
  // The non-slot hexes on the wall column become "inside the walls". We
  // distribute the city's actual buildings into these spots so they're
  // spatially visible (not just a sidebar list).
  const cityBuildings = useMemo(() => {
    return allBuildings.filter((b) => b.cityId === cityId && b.level > 0);
  }, [allBuildings, cityId]);
  const insideHexes: Array<{ coord: { col: number; row: number }; buildingId: BuildingId; level: number }> = [];
  const occupiedInWallCol = new Set(
    preview.slotPositions.filter((p) => p.col === cityWallCol).map((p) => p.row),
  );
  const availableWallRows: number[] = [];
  for (let r = 0; r < preview.height; r++) {
    if (!occupiedInWallCol.has(r)) availableWallRows.push(r);
  }
  cityBuildings.forEach((b, i) => {
    const row = availableWallRows[i];
    if (row !== undefined) {
      insideHexes.push({ coord: { col: cityWallCol, row }, buildingId: b.id, level: b.level });
    }
  });
  const insideMap = new Map(insideHexes.map((h) => [`${h.coord.col},${h.coord.row}`, h]));

  // ── Range coverage map ──
  // For each defensive structure, mark which hexes are within attack range.
  // Used to render gold range circles and to identify uncovered hexes.
  const coveredHexes = new Set<string>();
  const towerRanges: Array<{ coord: { col: number; row: number }; range: number; color: string }> = [];
  for (const slot of slots) {
    if (!slot.buildingId) continue;
    const pos = preview.slotPositions[slot.slot];
    if (!pos) continue;
    let range = 0, color = '#d4a84a';
    switch (slot.buildingId) {
      case 'watchtower':      range = 4; color = '#d4a84a'; break;
      case 'arrow-platform':  range = 5; color = '#c19a3b'; break;
      case 'rockfall':        range = 1; color = '#4a3a30'; break;
      case 'caltrops':        range = 1; color = '#7a6750'; break;
      case 'iron-chains':     range = 1; color = '#3a6a98'; break;
    }
    if (range > 0) {
      towerRanges.push({ coord: pos, range, color });
      for (let r = 0; r < preview.height; r++) {
        for (let c = 0; c < preview.width; c++) {
          if (hexDistAxial(pos, { col: c, row: r }) <= range) {
            coveredHexes.add(`${c},${r}`);
          }
        }
      }
    }
  }

  // ── Coverage gaps ── attacker-half hexes that NO tower can hit
  const gapHexes = new Set<string>();
  for (let r = 0; r < preview.height; r++) {
    // Only flag hexes in the defender-facing half (closer to the city than midfield)
    for (let c = Math.floor(preview.width * 0.5); c < cityWallCol - 1; c++) {
      const key = `${c},${r}`;
      if (!coveredHexes.has(key)) gapHexes.add(key);
    }
  }

  // ── Force banner color ──
  const ownerForce = city.ownerForceId ? forces[city.ownerForceId] : null;
  const bannerColor = ownerForce?.color ?? '#5a4530';

  // ── Garrison icon count (capped) ──
  const garrisonIconCount = Math.min(5, Math.floor(city.troops / 5000));

  const ALL_BUILDINGS: DefenseBuildingId[] = [
    'watchtower', 'beacon', 'caltrops', 'lookout',
    'barracks-out', 'granary-out',
    'iron-chains', 'rockfall', 'arrow-platform',
  ];

  const tryBuild = (slot: number, id: DefenseBuildingId) => {
    setError(null);
    const r = buildAction(cityId, slot, id);
    if (!r.ok) setError(r.reason ?? 'Failed');
    else setSelectedSlot(null);
  };
  const tryUpgrade = (slot: number) => {
    setError(null);
    const r = upgradeAction(cityId, slot);
    if (!r.ok) setError(r.reason ?? 'Failed');
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(0,0,0,0.88)',
        zIndex: 320, display: 'grid', placeItems: 'center',
        padding: '0.5rem',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'var(--tkm-bg-modal, #1f1610)',
          border: '1px solid var(--tkm-text-h2, #d4a84a)',
          width: 'min(1200px, 98vw)',
          maxHeight: '96vh',
          display: 'flex',
          flexDirection: 'column',
          color: 'var(--tkm-text-body, #c9b89a)',
          fontFamily: 'var(--tkm-font-body)',
        }}
      >
        {/* Header */}
        <header style={{
          padding: '0.7rem 1.1rem',
          borderBottom: '1px solid var(--tkm-border-soft)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <div>
            <div style={{
              fontFamily: 'var(--tkm-font-zh)',
              fontSize: '1.4rem',
              color: 'var(--tkm-text-h2)',
              letterSpacing: '0.3rem',
            }}>
              {city.name.zh} 戰場地圖 — <span style={{ color: size.color }}>{size.name.zh}</span>
            </div>
            <div style={{ fontSize: '0.68rem', color: 'var(--tkm-text-muted)', letterSpacing: '0.1rem' }}>
              {preview.namedMapName ? `${preview.namedMapName.zh} · ${preview.namedMapName.en}` : `${preview.width}×${preview.height} battlefield`}
              {' · '}{builtCount}/8 建築
              {total.defenseBonus > 0 && ` · +${total.defenseBonus} 守備`}
              {total.rangedPrestrike > 0 && ` · 預射 ${total.rangedPrestrike}`}
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <button
              onClick={() => setShowOverlays(!showOverlays)}
              style={{
                background: showOverlays ? 'rgba(212, 168, 74, 0.2)' : 'transparent',
                border: '1px solid var(--tkm-border-soft)',
                color: showOverlays ? '#d4a84a' : '#8a7050',
                padding: '0.3rem 0.55rem',
                fontFamily: 'inherit', fontSize: '0.7rem', cursor: 'pointer',
                letterSpacing: '0.1rem',
              }}
              title="Toggle range circles + coverage gap warnings + approach roads"
            >
              {showOverlays ? '✓ 戰術疊加' : '戰術疊加'}
            </button>
            <button onClick={onClose} style={{
              background: 'transparent', border: 'none', color: 'var(--tkm-text-h2)',
              fontSize: '1.5rem', cursor: 'pointer', padding: '0 0.5rem',
            }}>×</button>
          </div>
        </header>

        <div style={{ display: 'flex', flex: 1, minHeight: 0 }}>
          {/* Hex battlefield */}
          <div style={{
            flex: '1.4',
            overflow: 'auto',
            padding: '0.5rem',
            background:
              'radial-gradient(circle at 50% 50%, rgba(80, 65, 45, 0.12) 0%, transparent 70%), ' +
              'linear-gradient(180deg, #1a1408 0%, #0a0805 100%)',
          }}>
            <svg width={svgWidth} height={svgHeight} viewBox={`0 0 ${svgWidth} ${svgHeight}`}>
              <MapDefs />
              {/* Sky backdrop + vignette */}
              <rect width={svgWidth} height={svgHeight} fill="url(#tkmMapBg)" />
              <rect width={svgWidth} height={svgHeight} fill="url(#tkmVignette)" pointerEvents="none" />
              {/* Attacker spawn zone tint — leftmost 2 columns */}
              <rect x={0} y={0} width={HEX_COL_STEP * 2.2} height={svgHeight}
                fill="rgba(184, 68, 46, 0.08)" pointerEvents="none" />
              {/* Approach roads from attacker side toward city — dashed amber */}
              {showOverlays && (
                <g pointerEvents="none" stroke="#d4a84a" strokeWidth="1.2" fill="none"
                   strokeDasharray="4 4" opacity="0.4">
                  <path d={`M ${HEX_W * 0.5} ${svgHeight * 0.35}
                            Q ${svgWidth * 0.4} ${svgHeight * 0.3}
                              ${(cityWallCol - 2) * HEX_COL_STEP} ${svgHeight * 0.4}`} />
                  <path d={`M ${HEX_W * 0.5} ${svgHeight * 0.65}
                            Q ${svgWidth * 0.4} ${svgHeight * 0.7}
                              ${(cityWallCol - 2) * HEX_COL_STEP} ${svgHeight * 0.6}`} />
                </g>
              )}
              {/* Range coverage circles — drawn first so hexes overlay on top */}
              {showOverlays && towerRanges.map((tr, i) => {
                const { x, y } = hexCenter(tr.coord.col, tr.coord.row);
                return (
                  <circle
                    key={`range-${i}`}
                    cx={x} cy={y}
                    r={tr.range * HEX_COL_STEP * 0.95}
                    fill={tr.color}
                    fillOpacity={0.06}
                    stroke={tr.color}
                    strokeOpacity={0.25}
                    strokeWidth="0.8"
                    strokeDasharray="3 3"
                    pointerEvents="none"
                  />
                );
              })}
              {/* Terrain hexes */}
              {preview.tiles.map((t) => {
                const { x, y } = hexCenter(t.coord.col, t.coord.row);
                const slotIdx = slotIndexAtHex.get(`${t.coord.col},${t.coord.row}`);
                const slotData = slotIdx !== undefined ? slotMap.get(slotIdx) : undefined;
                const isSlot = slotIdx !== undefined;
                const inside = insideMap.get(`${t.coord.col},${t.coord.row}`);
                const isCityWall = t.coord.col === cityWallCol && !isSlot && !inside;
                const isInsideBld = !!inside;
                const isSel = selectedSlot === slotIdx;
                const interactive = isPlayer && isSlot;
                const isGap = showOverlays && gapHexes.has(`${t.coord.col},${t.coord.row}`);
                return (
                  <g
                    key={`${t.coord.col},${t.coord.row}`}
                    onClick={() => {
                      if (!interactive) return;
                      setSelectedSlot(isSel ? null : slotIdx!);
                    }}
                    className={interactive ? 'tkm-hex-interactive' : undefined}
                    style={{ cursor: interactive ? 'pointer' : 'default' }}
                  >
                    <polygon
                      points={hexPoints(x, y)}
                      fill={
                        isCityWall ? 'url(#tkmMountainGrad)'
                        : isInsideBld ? '#3a2818'
                        : TERRAIN_FILL_URL[t.terrain]
                      }
                      stroke={
                        isSel ? '#f0e0b0'
                        : isSlot ? '#d4a84a'
                        : isCityWall ? '#d4a84a'
                        : isInsideBld ? '#c19a3b'
                        : '#1a1410'
                      }
                      strokeWidth={isSel ? 2.5 : isSlot ? 2 : isCityWall || isInsideBld ? 1.8 : 1}
                      opacity={0.94}
                      filter={isSel ? 'url(#tkmHexGlow)' : undefined}
                    />
                    {/* Coverage-gap warning overlay */}
                    {isGap && (
                      <g pointerEvents="none">
                        <polygon
                          points={hexPoints(x, y)}
                          fill="rgba(184, 68, 46, 0.18)"
                          stroke="#b8442e"
                          strokeWidth="0.8"
                          strokeDasharray="2 2"
                          opacity="0.7"
                        />
                      </g>
                    )}
                    {!isInsideBld && <TerrainArt x={x} y={y} terrain={t.terrain} />}
                    {/* City wall — real wall + parapets */}
                    {isCityWall && (
                      <g pointerEvents="none">
                        {/* Crenellated top edge */}
                        <rect x={x - 12} y={y - 14} width="3" height="3" fill="#d4a84a" />
                        <rect x={x - 6}  y={y - 14} width="3" height="3" fill="#d4a84a" />
                        <rect x={x}      y={y - 14} width="3" height="3" fill="#d4a84a" />
                        <rect x={x + 6}  y={y - 14} width="3" height="3" fill="#d4a84a" />
                        <rect x={x + 9}  y={y - 14} width="3" height="3" fill="#d4a84a" />
                        {/* Wall main body */}
                        <rect x={x - 13} y={y - 11} width="26" height="14" fill="#5a4530" stroke="#3a2818" strokeWidth="0.6" />
                        {/* Stone block lines */}
                        <line x1={x - 13} y1={y - 7} x2={x + 13} y2={y - 7} stroke="#3a2818" strokeWidth="0.3" opacity="0.6" />
                        <line x1={x - 13} y1={y - 3} x2={x + 13} y2={y - 3} stroke="#3a2818" strokeWidth="0.3" opacity="0.6" />
                        <line x1={x} y1={y - 11} x2={x} y2={y - 7} stroke="#3a2818" strokeWidth="0.3" opacity="0.5" />
                        <line x1={x - 6} y1={y - 7} x2={x - 6} y2={y - 3} stroke="#3a2818" strokeWidth="0.3" opacity="0.5" />
                        <line x1={x + 6} y1={y - 7} x2={x + 6} y2={y - 3} stroke="#3a2818" strokeWidth="0.3" opacity="0.5" />
                        {/* Banner flying over walls (force color) */}
                        <line x1={x + 7} y1={y - 16} x2={x + 7} y2={y - 22} stroke="#1a1410" strokeWidth="0.8" />
                        <path
                          className="tkm-pennant"
                          d={`M ${x + 7} ${y - 22} L ${x + 13} ${y - 20} L ${x + 7} ${y - 18} Z`}
                          fill={bannerColor}
                          stroke="#1a1410"
                          strokeWidth="0.4"
                        />
                        {/* Garrison soldier silhouettes — show on the top wall hex only */}
                        {t.coord.row === 0 && garrisonIconCount > 0 && (
                          <g>
                            {Array.from({ length: garrisonIconCount }).map((_, i) => {
                              const sx = x - 11 + i * 5;
                              return (
                                <g key={i}>
                                  {/* Head */}
                                  <circle cx={sx} cy={y - 8} r="1.2" fill="#f0e0b0" />
                                  {/* Body */}
                                  <line x1={sx} y1={y - 7} x2={sx} y2={y - 4}
                                    stroke="#f0e0b0" strokeWidth="1.4" strokeLinecap="round" />
                                  {/* Spear */}
                                  <line x1={sx + 1.5} y1={y - 11} x2={sx + 1.5} y2={y - 4}
                                    stroke="#8a7050" strokeWidth="0.5" />
                                </g>
                              );
                            })}
                          </g>
                        )}
                      </g>
                    )}
                    {/* Inside-city building icon */}
                    {isInsideBld && inside && (
                      <g pointerEvents="none">
                        <rect x={x - 10} y={y - 11} width="20" height="20"
                          fill={INSIDE_BUILDING_GLYPH[inside.buildingId]?.color ?? '#5a4530'}
                          stroke="#1a1410" strokeWidth="0.8" opacity={0.85} />
                        {/* Pointed roof */}
                        <path d={`M ${x - 12} ${y - 11} L ${x} ${y - 17} L ${x + 12} ${y - 11} Z`}
                          fill="#3a2818" stroke="#1a1410" strokeWidth="0.4" />
                        <text x={x} y={y + 2} textAnchor="middle"
                          fontSize="11" fill="#fff" fontWeight="bold"
                          fontFamily="Songti SC, serif" stroke="#1a1410" strokeWidth="0.3">
                          {INSIDE_BUILDING_GLYPH[inside.buildingId]?.glyph ?? '?'}
                        </text>
                        <text x={x} y={y + 13} textAnchor="middle"
                          fontSize="6" fill="#f0e0b0">
                          Lv {inside.level}
                        </text>
                      </g>
                    )}
                    {/* Empty slot indicator */}
                    {isSlot && !slotData?.buildingId && (
                      <>
                        <text x={x} y={y - 2} textAnchor="middle"
                          fontSize="18" fill="#d4a84a" fontWeight="bold" pointerEvents="none">+</text>
                        <text x={x} y={y + 10} textAnchor="middle"
                          fontSize="7" fill="#d4a84a" letterSpacing="1" pointerEvents="none">
                          {SLOT_POSITIONS[slotIdx!]}
                        </text>
                      </>
                    )}
                    {/* Built structure */}
                    {isSlot && slotData?.buildingId && (
                      <BuiltStructureIcon
                        x={x} y={y}
                        buildingId={slotData.buildingId}
                        level={slotData.level}
                      />
                    )}
                  </g>
                );
              })}

              {/* Defender side label */}
              <text
                x={svgWidth - HEX_W * 0.6} y={20}
                textAnchor="end" fontSize="9"
                fill="#d4a84a" letterSpacing="0.3em"
              >
                守方 DEFENDER
              </text>
              {/* Attacker side label */}
              <text
                x={20} y={20}
                fontSize="9"
                fill="#b8442e" letterSpacing="0.3em"
              >
                攻方 ATTACKER →
              </text>
              {/* Decorative frame + compass — drawn last so they sit on top. */}
              <MapFrame width={svgWidth} height={svgHeight} />
              <CompassRose x={svgWidth - 38} y={48} />
            </svg>
          </div>

          {/* Right: build picker / info */}
          <div style={{
            flex: '0.7', minWidth: 290, padding: '0.6rem 0.8rem',
            borderLeft: '1px solid var(--tkm-border-soft)',
            overflowY: 'auto', display: 'flex', flexDirection: 'column',
          }}>
            {!isPlayer ? (
              <div style={{ color: 'var(--tkm-text-muted)', fontSize: '0.85rem', padding: '0.8rem' }}>
                此城非汝所領。Only your own cities can build defenses.
              </div>
            ) : selectedSlot === null ? (
              <div style={{ color: 'var(--tkm-text-muted)', fontSize: '0.78rem' }}>
                <div style={{
                  fontSize: '0.7rem', letterSpacing: '0.2rem',
                  color: 'var(--tkm-text-h2)', marginBottom: '0.4rem',
                }}>★ 戰場預覽 · Battle Preview</div>
                <p style={{ marginBottom: '0.5rem' }}>
                  這是城邑被攻擊時的真實戰場。地形、地圖大小、特殊地形都與戰術戰鬥一致。
                </p>
                <p style={{ marginBottom: '0.5rem' }}>
                  右側守方邊有 <strong style={{ color: '#d4a84a' }}>8 個亮金邊的建築位</strong>。點擊位來建造箭樓 / 拒馬 / 鐵索等防禦工事。
                </p>
                <p style={{ marginBottom: '0.5rem' }}>
                  戰時這些建築會出現在六角格上，每回合自動射擊攻方。
                </p>
                {total.defenseBonus > 0 && (
                  <div style={{
                    marginTop: '0.6rem',
                    padding: '0.4rem 0.5rem',
                    background: 'rgba(212, 168, 74, 0.1)',
                    border: '1px solid rgba(212, 168, 74, 0.3)',
                    fontSize: '0.7rem',
                  }}>
                    當前總加成：+{total.defenseBonus} 守備
                    {total.rangedPrestrike > 0 && ` · ${total.rangedPrestrike} 預射`}
                    {total.cavalryPenalty > 0 && ` · 騎兵 −${Math.round(total.cavalryPenalty * 100)}%`}
                    {total.attackerDamageMul < 1 && ` · 攻方傷害 ×${total.attackerDamageMul.toFixed(2)}`}
                  </div>
                )}
              </div>
            ) : (
              <SlotEditor
                city={city}
                slot={selectedSlot}
                current={slotMap.get(selectedSlot)}
                onBuild={(id) => tryBuild(selectedSlot, id)}
                onUpgrade={() => tryUpgrade(selectedSlot)}
                onDemolish={() => { demolishAction(cityId, selectedSlot); setSelectedSlot(null); }}
                allBuildings={ALL_BUILDINGS}
              />
            )}
            {error && (
              <div style={{
                marginTop: '0.5rem',
                padding: '0.3rem 0.5rem',
                background: 'rgba(184, 68, 46, 0.15)',
                border: '1px solid #b8442e',
                color: '#ffb494',
                fontSize: '0.72rem',
              }}>
                {error}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function BuiltStructureIcon({
  x, y, buildingId, level,
}: { x: number; y: number; buildingId: DefenseBuildingId; level: number }) {
  const def = DEFENSE_BUILDINGS[buildingId];
  const ZH: Record<string, string> = {
    'watchtower': '箭', 'beacon': '烽', 'caltrops': '拒',
    'lookout': '瞭', 'barracks-out': '營', 'granary-out': '倉',
    'iron-chains': '索', 'rockfall': '石', 'arrow-platform': '台',
  };
  const glyph = ZH[buildingId] ?? '?';
  return (
    <g pointerEvents="none">
      <rect x={x - 10} y={y - 12} width="20" height="20" fill={def.color} stroke="#1a1410" strokeWidth="1" />
      <rect x={x - 10} y={y - 14} width="3" height="3" fill={def.color} stroke="#1a1410" strokeWidth="0.4" />
      <rect x={x - 4}  y={y - 14} width="3" height="3" fill={def.color} stroke="#1a1410" strokeWidth="0.4" />
      <rect x={x + 2}  y={y - 14} width="3" height="3" fill={def.color} stroke="#1a1410" strokeWidth="0.4" />
      <rect x={x + 7}  y={y - 14} width="3" height="3" fill={def.color} stroke="#1a1410" strokeWidth="0.4" />
      <text x={x} y={y + 2} textAnchor="middle" fontSize="11"
        fill="#fff" fontWeight="bold" fontFamily="Songti SC, serif" stroke="#1a1410" strokeWidth="0.3">
        {glyph}
      </text>
      <text x={x} y={y + 13} textAnchor="middle" fontSize="7" fill="#f0e0b0"
        fontFamily="ui-monospace, monospace">
        {'★'.repeat(level)}
      </text>
    </g>
  );
}

function SlotEditor({
  city, slot, current, onBuild, onUpgrade, onDemolish, allBuildings,
}: {
  city: City;
  slot: number;
  current?: { buildingId?: DefenseBuildingId; level: number };
  onBuild: (id: DefenseBuildingId) => void;
  onUpgrade: () => void;
  onDemolish: () => void;
  allBuildings: DefenseBuildingId[];
}) {
  const cur = current?.buildingId ? DEFENSE_BUILDINGS[current.buildingId] : null;
  if (cur && current) {
    const eff = cur.effect(current.level);
    const nextLevel = current.level + 1;
    const canUpgrade = nextLevel <= cur.maxLevel;
    const upgradeCost = cur.goldCost * nextLevel;
    return (
      <div>
        <div style={{
          fontSize: '0.7rem', color: 'var(--tkm-text-h2)',
          letterSpacing: '0.2rem', marginBottom: '0.4rem',
        }}>★ {SLOT_POSITIONS[slot]} 位 · Slot {slot}</div>
        <div style={{
          padding: '0.5rem 0.7rem',
          background: `linear-gradient(135deg, ${cur.color}33, transparent)`,
          border: `1px solid ${cur.color}`,
          marginBottom: '0.5rem',
        }}>
          <div style={{
            fontFamily: 'var(--tkm-font-zh)',
            fontSize: '1rem', color: cur.color,
            letterSpacing: '0.2rem',
          }}>
            {cur.name.zh} Lv {current.level}/{cur.maxLevel}
          </div>
          <div style={{ fontSize: '0.66rem', color: 'var(--tkm-text-muted)', marginTop: 3 }}>
            {cur.description}
          </div>
          <div style={{
            marginTop: '0.4rem', fontSize: '0.66rem',
            color: 'var(--tkm-text-h1)', display: 'flex', flexWrap: 'wrap', gap: '0.25rem',
          }}>
            {eff.defenseBonus > 0 && <Chip>守 +{eff.defenseBonus}</Chip>}
            {eff.rangedPrestrike > 0 && <Chip>預射 {eff.rangedPrestrike}</Chip>}
            {eff.attackerDamageMul < 1 && <Chip>攻方 ×{eff.attackerDamageMul.toFixed(2)}</Chip>}
            {eff.cavalryPenalty > 0 && <Chip>騎 −{Math.round(eff.cavalryPenalty * 100)}%</Chip>}
            {eff.extraGarrison > 0 && <Chip>駐軍 +{eff.extraGarrison}</Chip>}
            {eff.extraFood > 0 && <Chip>糧 +{eff.extraFood}</Chip>}
            {eff.navalDefense > 0 && <Chip>水師守 +{eff.navalDefense}</Chip>}
            {eff.mountainBonus > 0 && <Chip>山戰 +{Math.round(eff.mountainBonus * 100)}%</Chip>}
          </div>
        </div>
        <div style={{ display: 'flex', gap: '0.4rem' }}>
          <button
            onClick={onUpgrade}
            disabled={!canUpgrade || city.gold < upgradeCost}
            style={{
              flex: 1,
              background: 'linear-gradient(180deg, #5a4530, #3a2d20)',
              border: '1px solid #d4a84a',
              color: canUpgrade && city.gold >= upgradeCost ? '#d4a84a' : '#5a4530',
              padding: '0.4rem 0.55rem',
              fontFamily: 'inherit', fontSize: '0.75rem',
              cursor: canUpgrade && city.gold >= upgradeCost ? 'pointer' : 'not-allowed',
            }}
          >
            升級 → Lv {nextLevel} ({upgradeCost}g)
          </button>
          <button
            onClick={onDemolish}
            style={{
              background: 'transparent', border: '1px solid #5a4530',
              color: '#b8442e', padding: '0.4rem 0.55rem',
              fontFamily: 'inherit', fontSize: '0.75rem', cursor: 'pointer',
            }}
          >
            拆除
          </button>
        </div>
      </div>
    );
  }
  return (
    <div>
      <div style={{
        fontSize: '0.7rem', color: 'var(--tkm-text-h2)',
        letterSpacing: '0.2rem', marginBottom: '0.4rem',
      }}>★ {SLOT_POSITIONS[slot]} 位 · 選擇建築</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
        {allBuildings.map((id) => {
          const def = DEFENSE_BUILDINGS[id];
          const needsRiver = def.requiresTerrain === 'river' && !city.port;
          const needsMountain = def.requiresTerrain === 'mountain' && city.terrain !== 'mountain';
          const locked = needsRiver || needsMountain;
          const lockReason = needsRiver ? '需臨水' : needsMountain ? '需山地' : null;
          const canAfford = city.gold >= def.goldCost;
          return (
            <button
              key={id}
              onClick={() => !locked && canAfford && onBuild(id)}
              disabled={locked || !canAfford}
              style={{
                background: locked ? '#1a1410' : `linear-gradient(135deg, ${def.color}33, #1a1410)`,
                border: `1px solid ${locked ? '#3a2818' : def.color}`,
                color: locked ? '#5a4530' : 'var(--tkm-text-h1)',
                padding: '0.4rem 0.55rem',
                fontFamily: 'inherit', fontSize: '0.72rem',
                cursor: locked || !canAfford ? 'not-allowed' : 'pointer',
                opacity: locked ? 0.5 : canAfford ? 1 : 0.6,
                textAlign: 'left',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <span style={{
                  fontFamily: 'var(--tkm-font-zh)',
                  color: locked ? '#5a4530' : def.color,
                  letterSpacing: '0.1rem',
                }}>
                  {def.name.zh} <span style={{ fontSize: '0.58rem', color: '#8a7050' }}>{def.name.en}</span>
                </span>
                <span style={{ fontSize: '0.62rem', color: '#c0a878' }}>
                  {def.goldCost}g{lockReason && <span style={{ color: '#b8442e' }}> · {lockReason}</span>}
                </span>
              </div>
              <div style={{ fontSize: '0.62rem', color: 'var(--tkm-text-muted)', marginTop: 2 }}>
                {def.description}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span style={{
      padding: '0.1rem 0.35rem',
      background: 'rgba(212, 168, 74, 0.15)',
      border: '1px solid rgba(212, 168, 74, 0.4)',
      color: '#d4a84a',
      borderRadius: 2,
      fontSize: '0.62rem',
    }}>
      {children}
    </span>
  );
}
