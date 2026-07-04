/* Marching-column layer of the strategic 3D map — the animated army tokens
 * for every pending march: soldier/horse squads, the colours banner, dust,
 * the naval war junk and the dug-in field camp. Extracted verbatim from
 * StrategicMap3D.tsx (pure mechanical split). */
import { useMemo, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { useGameStore } from '../../../game/state/store';
import { positionAlongRoute, marchDestCoords } from '../../../game/data/territories';
import { snapToHexCenter, geoToPixel } from '../../../game/data/geography';
import { cityPixel } from '../../../game/data/cityGeo';
import { deriveWeaponType, type WeaponType } from '../../../game/data/weaponTypes';
import type { City } from '../../../game/types';
import { SelectionRing3D } from '../SelectionRing3D';
import { useT, useLanguage, pickName } from '../../i18n';
import { IS_MOBILE, ARMY_TOKEN_SCALE, pxToWorld, sampleTerrainHeight } from './shared';

/** 軍旗 — a colours pole carried over a column on the march: the flag ripples
 *  and the whole standard bobs with the marching gait, so an army on the move
 *  flies its banner and reads as a real column, not just a cluster of markers. */
function MarchBanner({ color }: { color: string }) {
  const flagRef = useRef<THREE.Mesh>(null);
  const groupRef = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    const tm = clock.elapsedTime;
    if (flagRef.current) flagRef.current.rotation.z = Math.sin(tm * 4.2) * 0.24;
    if (groupRef.current) groupRef.current.position.y = Math.abs(Math.sin(tm * 3.4)) * 0.035; // marching bob
  });
  const poleH = 0.5;
  const flagW = 0.2, flagH = 0.13;
  const flagY = poleH - flagH * 0.7;
  return (
    <group ref={groupRef}>
      <mesh position={[0, poleH / 2, 0]} castShadow>
        <cylinderGeometry args={[0.012, 0.012, poleH, 5]} />
        <meshStandardMaterial color="#1a1410" />
      </mesh>
      <mesh position={[0, poleH + 0.015, 0]} castShadow>
        <sphereGeometry args={[0.02, 8, 8]} />
        <meshStandardMaterial color="#e0c060" metalness={0.5} roughness={0.4} />
      </mesh>
      <mesh ref={flagRef} position={[flagW / 2, flagY, 0]} castShadow>
        <planeGeometry args={[flagW, flagH]} />
        <meshStandardMaterial color={color} side={THREE.DoubleSide} roughness={0.6} />
      </mesh>
      {/* Pennant tail catches the motion. */}
      <mesh position={[flagW + 0.03, flagY, 0]}>
        <planeGeometry args={[0.07, flagH * 0.45]} />
        <meshStandardMaterial color={color} side={THREE.DoubleSide} transparent opacity={0.8} />
      </mesh>
    </group>
  );
}

/** 戰船 — a war junk for a naval march: a dark hull with a raised stern, a
 *  battened sail, a force-colour pennant and a prow ram. Replaces the marching
 *  foot when an army crosses water, so a sea expedition reads as a fleet. */
function WarJunk({ color }: { color: string }) {
  const flagRef = useRef<THREE.Mesh>(null);
  const groupRef = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    const tm = clock.elapsedTime;
    if (flagRef.current) flagRef.current.rotation.z = Math.sin(tm * 3.6) * 0.22;
    if (groupRef.current) groupRef.current.rotation.z = Math.sin(tm * 1.6) * 0.03; // gentle heel
  });
  return (
    <group ref={groupRef} scale={ARMY_TOKEN_SCALE * 0.95}>
      {/* Hull */}
      <mesh position={[0, 0.1, 0]} castShadow>
        <boxGeometry args={[0.34, 0.18, 0.74]} />
        <meshStandardMaterial color="#46301d" roughness={0.9} />
      </mesh>
      {/* Prow ram */}
      <mesh position={[0, 0.09, 0.42]} rotation={[0, Math.PI / 4, 0]} castShadow>
        <boxGeometry args={[0.12, 0.1, 0.12]} />
        <meshStandardMaterial color="#3a2818" roughness={0.9} />
      </mesh>
      {/* Raised stern castle */}
      <mesh position={[0, 0.27, -0.28]} castShadow>
        <boxGeometry args={[0.3, 0.2, 0.16]} />
        <meshStandardMaterial color="#5a3f24" roughness={0.9} />
      </mesh>
      {/* Mast */}
      <mesh position={[0, 0.52, 0.02]}>
        <cylinderGeometry args={[0.016, 0.016, 0.64, 5]} />
        <meshStandardMaterial color="#3a2818" />
      </mesh>
      {/* Battened sail */}
      <mesh position={[0, 0.52, 0.02]}>
        <boxGeometry args={[0.012, 0.44, 0.34]} />
        <meshStandardMaterial color="#cfc4a6" roughness={1} side={THREE.DoubleSide} />
      </mesh>
      {/* Force pennant atop the mast */}
      <mesh ref={flagRef} position={[0.09, 0.8, 0.02]}>
        <planeGeometry args={[0.17, 0.1]} />
        <meshStandardMaterial color={color} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

/* ─── Marching army arrows (animated) ──────────────────────── */
export function MarchingArmies({ cities, pendingCommands, forces, officers, ports, selectedArmyId, onArmyClick, onArmyPressStart, hideNearPx, playerForceId, spottedAmbushIds }: {
  cities: Record<string, City>;
  pendingCommands: Record<string, { cityId?: string; type: string; targetCityId?: string; troops?: number; officerId?: string; seasonsRemaining?: number; totalSeasons?: number }>;
  forces: Record<string, { color: string }>;
  officers: Record<string, import('../../../game/types').Officer>;
  ports: Record<string, import('../../../game/types').Port>;
  selectedArmyId: string | null;
  onArmyClick?: (officerId: string) => void;
  onArmyPressStart?: (officerId: string, e: { clientX: number; clientY: number }) => void;
  /** Suppress tokens near an active battle site (they're IN the diorama). */
  hideNearPx?: { x: number; y: number } | null;
  /** 設伏隱蔽 — enemy armies gone to ground are not rendered for this player. */
  playerForceId?: string | null;
  /** 斥候已破 — enemy ambush army ids the player's scouts have flushed:
   *  these DO render, marked ⚠伏. */
  spottedAmbushIds?: string[];
}) {
  const lang = useLanguage();
  const armies = useMemo(() => {
    return Object.values(pendingCommands)
      .filter((cmd): cmd is { cityId: string; type: string; targetCityId: string; troops: number; officerId: string; seasonsRemaining?: number; totalSeasons?: number; targetX?: number; targetY?: number; holding?: boolean; ambush?: boolean; besieging?: string } =>
        cmd.type === 'march' && !!cmd.cityId)
      .map((cmd) => {
        const from = cities[cmd.cityId];
        const dest = marchDestCoords(cmd, cities);
        if (!from || !dest) return null;
        const to = cities[cmd.targetCityId];
        const force = forces[from.ownerForceId ?? ''];
        const hostile = !cmd.targetX && to ? to.ownerForceId !== from.ownerForceId : false;
        const commander = officers[cmd.officerId];
        // 設伏隱蔽 — an enemy army gone to ground simply isn't on your map
        // (you learn of it when a column blunders in — or your scouts
        // flush it, in which case it shows with a ⚠伏 mark).
        const foreignAmbush = !!cmd.holding && !!cmd.ambush && !!playerForceId && commander?.forceId !== playerForceId;
        const ambushRevealed = foreignAmbush && (spottedAmbushIds ?? []).includes(cmd.officerId);
        if (foreignAmbush && !ambushRevealed) return null;
        const totalSeasons = Math.max(1, cmd.totalSeasons ?? 1);
        const seasonsRemaining = cmd.seasonsRemaining ?? 1;
        // Route endpoints in geo-pixel space so the marching token lines up
        // with the geo-positioned cities (and the roads, which already use
        // cityPixel) — not the old painted-map coords. A straight segment
        // between the two geo points; matches how the roads are drawn.
        const [fgx, fgy] = cityPixel(cmd.cityId, from.coords.x, from.coords.y);
        const [dgx, dgy] = (cmd.targetX == null && to)
          ? cityPixel(cmd.targetCityId, dest.x, dest.y)
          : [dest.x, dest.y];
        const landRoute = [{ x: fgx, y: fgy }, { x: dgx, y: dgy }];
        // Suppress tokens marching beside an active battle — those columns are
        // IN the diorama; a second flag next to it reads as a phantom army.
        if (hideNearPx) {
          const tEl = Math.min(0.95, Math.max(0.05, (totalSeasons - seasonsRemaining + 0.5) / totalSeasons));
          const ax = fgx + (dgx - fgx) * tEl;
          const ay = fgy + (dgy - fgy) * tEl;
          if (Math.hypot(ax - hideNearPx.x, ay - hideNearPx.y) < 50) return null;
        }
        const weaponType: WeaponType = commander ? deriveWeaponType(commander) : 'none';
        return {
          officerId: cmd.officerId,
          from,
          to,
          color: hostile ? '#b8442e' : (force?.color ?? '#d4a84a'),
          commanderName: commander ? pickName(commander.name, lang) : '',
          targetName: to ? pickName(to.name, lang) : '',
          troops: cmd.troops,
          seasonsRemaining,
          totalSeasons,
          landRoute,
          weaponType,
          selected: cmd.officerId === selectedArmyId,
          holding: !!cmd.holding,
          ambush: !!cmd.ambush,
          besieging: !!cmd.besieging,
          ambushRevealed,
          cellTarget: cmd.targetX != null,
        };
      })
      .filter((a): a is NonNullable<typeof a> => !!a);
  }, [cities, pendingCommands, forces, officers, selectedArmyId, hideNearPx, lang, playerForceId, spottedAmbushIds]);

  return (
    <group>
      {armies.map((a, i) => (
        <MarchingArmy key={i} from={a.from} to={a.to} color={a.color}
          commanderName={a.commanderName} targetName={a.targetName} troops={a.troops}
          seasonsRemaining={a.seasonsRemaining} totalSeasons={a.totalSeasons}
          landRoute={a.landRoute} weaponType={a.weaponType}
          selected={a.selected} holding={a.holding} ambush={a.ambush} besieging={a.besieging} ambushRevealed={a.ambushRevealed} cellTarget={a.cellTarget}
          ports={ports} onClick={onArmyClick ? () => onArmyClick(a.officerId) : undefined}
          onPressStart={onArmyPressStart ? (e) => onArmyPressStart(a.officerId, e) : undefined} />
      ))}
    </group>
  );
}

/** Short unit-type tag (騎/弓/槍…) + role for the army label. */
const UNIT_TAG: Record<WeaponType, string> = {
  cavalry: '騎', bow: '弓', crossbow: '弩', spear: '槍', halberd: '戟',
  sabre: '刀', sword: '劍', fan: '師', siege: '械', none: '步',
};

function MarchingArmy({ from, to, color, commanderName, targetName, troops, seasonsRemaining, totalSeasons, landRoute, weaponType, selected, holding, ambush, besieging, ambushRevealed, cellTarget, ports, onClick, onPressStart }: {
  from: City; to: City; color: string;
  commanderName: string; targetName: string; troops: number;
  seasonsRemaining: number; totalSeasons: number;
  landRoute: Array<{ x: number; y: number }>;
  weaponType: WeaponType;
  selected: boolean;
  holding: boolean;
  ambush?: boolean;
  besieging?: boolean;
  ambushRevealed?: boolean;
  cellTarget: boolean;
  ports: Record<string, import('../../../game/types').Port>;
  onClick?: () => void;
  /** 拖拽行軍 — press-hold begins a drag-to-reroute gesture (MapScene owns it). */
  onPressStart?: (e: { clientX: number; clientY: number }) => void;
}) {
  const [hovered, setHovered] = useState(false);
  const tHover = useT();
  const [fpx, fpy] = cityPixel(from.id, from.coords.x, from.coords.y);
  const [tpx, tpy] = cityPixel(to.id, to.coords.x, to.coords.y);
  const [fx, fz] = pxToWorld(fpx, fpy);
  const [tx, tz] = pxToWorld(tpx, tpy);

  // Naval detection: if target is NOT a land-adjacent city of source, and
  // both have linked ports with a direct sea connection, route via ports.
  const naval = useMemo(() => {
    if ((from.adjacentCityIds ?? []).includes(to.id)) return null;
    const srcPort = Object.values(ports).find((p) => p.linkedCityId === from.id);
    const dstPort = Object.values(ports).find((p) => p.linkedCityId === to.id);
    if (!srcPort || !dstPort) return null;
    if (!srcPort.connectedPortIds.includes(dstPort.id)) return null;
    return { srcPort, dstPort };
  }, [from, to, ports]);

  // Build waypoint list — for naval marches: [from, srcPort, dstPort, to].
  // For land marches (Phase 3b): the territory poly-route passed in via
  // props. Both end up as piecewise-linear segments so useFrame below
  // shares one interpolation path.
  const path = useMemo(() => {
    if (naval) {
      const [spx, spy] = pxToWorld(...geoToPixel(naval.srcPort.coords.lon, naval.srcPort.coords.lat));
      const [dpx, dpy] = pxToWorld(...geoToPixel(naval.dstPort.coords.lon, naval.dstPort.coords.lat));
      return {
        kind: 'piecewise' as const,
        pts: [[fx, fz], [spx, spy], [dpx, dpy], [tx, tz]] as Array<[number, number]>,
      };
    }
    // Land — follow the territory route through ~4-8 waypoints. Map the
    // 1000×720 canvas coords through pxToWorld so they land on the 3D plane.
    const pts: Array<[number, number]> = landRoute.length >= 2
      ? landRoute.map((p) => pxToWorld(...cityPixel('_', p.x, p.y)))
      : [[fx, fz], [tx, tz]];
    return { kind: 'piecewise' as const, pts };
  }, [naval, fx, fz, tx, tz, landRoute]);

  const groupRef = useRef<THREE.Group>(null);
  useFrame(() => {
    if (!groupRef.current) return;
    const elapsed = totalSeasons - seasonsRemaining;
    // 日流(前置)— the playback runs BEFORE resolution: the column walks
    // one whole slice from its between-turns pose (elapsed+0.5) to the pose
    // the coming resolution will leave it at (elapsed+1.5's midpoint), so
    // the handoff at day 15 is seamless in both directions.
    const df = useGameStore.getState().dayFlow;
    const phase = df && df.total > 0
      ? elapsed + 0.5 + Math.min(1, df.day / df.total)
      : elapsed + 0.5;
    const t = Math.min(0.95, Math.max(0.05, phase / totalSeasons));
    let x: number, z: number, heading: number;
    if (naval) {
      // Naval marches glide across open water — no hex snapping.
      const segCount = path.pts.length - 1;
      const segT = t * segCount;
      const segIdx = Math.min(segCount - 1, Math.floor(segT));
      const localT = segT - segIdx;
      const [ax, az] = path.pts[segIdx];
      const [bx, bz] = path.pts[segIdx + 1];
      x = ax + (bx - ax) * localT;
      z = az + (bz - az) * localT;
      heading = Math.atan2(bx - ax, bz - az);
    } else {
      // Land — snap to the hex the army occupies this season so it sits
      // on a cell and steps cell-to-cell (RTK-XIV grid march). A dug-in
      // garrison sits on the cell it holds (route end), not a fraction along.
      const raw = (holding && cellTarget && landRoute.length > 0)
        ? landRoute[landRoute.length - 1]
        : positionAlongRoute(landRoute, t);
      const s = snapToHexCenter(raw.x, raw.y);
      const [wx, wz] = pxToWorld(s.x, s.y);
      const rawAhead = positionAlongRoute(landRoute, Math.min(0.99, t + 0.06));
      const sAhead = snapToHexCenter(rawAhead.x, rawAhead.y);
      const [wx2, wz2] = pxToWorld(sAhead.x, sAhead.y);
      x = wx; z = wz;
      heading = (wx2 !== wx || wz2 !== wz)
        ? Math.atan2(wx2 - wx, wz2 - wz)
        : groupRef.current.rotation.y;
    }
    groupRef.current.position.set(x, sampleTerrainHeight(x, z) + 0.05, z);
    groupRef.current.rotation.y = heading;
  });

  // Squad arrow formation: leader + 4 followers behind
  const FORMATION: ReadonlyArray<readonly [number, number]> = [
    [0,     0],     // leader
    [-0.18, -0.25], [0.18, -0.25],
    [-0.36, -0.50], [0.36, -0.50],
  ];

  const troopLabel = troops >= 1000 ? `${(troops / 1000).toFixed(1)}k` : `${troops}`;
  const etaLabel = holding ? '  駐' : totalSeasons > 1 ? `  ${seasonsRemaining}/${totalSeasons}季` : '';
  return (
    <group ref={groupRef} scale={ARMY_TOKEN_SCALE}>
      {/* Click target — a FAT invisible cylinder over the whole squad incl.
          the banner, so columns are easy to tap even zoomed out / on touch.
          (The old 0.55×0.42 disc was why armies felt uncontrollable.) */}
      {onClick && (
        <mesh
          position={[0, 0.5, 0]}
          onClick={(e) => { e.stopPropagation(); onClick(); }}
          onPointerDown={onPressStart ? (e) => onPressStart({ clientX: e.nativeEvent.clientX, clientY: e.nativeEvent.clientY }) : undefined}
          onPointerOver={(e) => { e.stopPropagation(); document.body.style.cursor = 'pointer'; if (!IS_MOBILE) setHovered(true); }}
          onPointerOut={() => { document.body.style.cursor = ''; setHovered(false); }}
        >
          <cylinderGeometry args={[1.1, 1.1, 1.3, 10]} />
          <meshBasicMaterial transparent opacity={0} depthWrite={false} />
        </mesh>
      )}
      {/* 懸停快覽 — desktop: name the column's destination + full status, which
          the terse always-on label leaves out. */}
      {hovered && (
        <Html position={[0, 1.15, 0]} center distanceFactor={9} zIndexRange={[44, 34]} style={{ pointerEvents: 'none' }}>
          <div style={{
            background: 'rgba(18,12,6,0.94)', border: `1px solid ${color}`, borderRadius: 'var(--tkm-radius-sm)',
            padding: '3px 9px', fontFamily: 'var(--tkm-font-body)', fontSize: '11px',
            color: '#e7d6ad', whiteSpace: 'nowrap', lineHeight: 1.5, boxShadow: '0 2px 10px rgba(0,0,0,0.6)',
          }}>
            <div style={{ fontWeight: 'bold', letterSpacing: '0.5px' }}>
              {commanderName || tHover('無名軍', 'Column')}
              <span style={{ color: '#c0a878', marginLeft: 6, fontWeight: 'normal' }}>{tHover('兵 ', 'Troops ')}{Math.round(troops).toLocaleString()}</span>
            </div>
            <div style={{ color: '#bfae86' }}>
              {holding
                ? (ambush ? tHover('設伏 — 藏兵於掩蔽', 'In ambush — gone to ground') : tHover('駐守紮營', 'Holding — encamped'))
                : `→ ${targetName || (cellTarget ? tHover('野地', 'field') : '—')}${totalSeasons > 1 ? ` · ${seasonsRemaining}/${totalSeasons} ${tHover('季', 'seasons')}` : ''}`}
            </div>
          </div>
        </Html>
      )}
      {/* Selection ring on the ground under the squad — shared gold marker. */}
      {selected && <SelectionRing3D radius={0.42} y={0.02} segments={28} />}
      {holding ? (
        <>
          <FieldCamp color={color} troops={troops} />
          <MarchBanner color={color} />
        </>
      ) : naval ? (
        // 水師 — a fleet crosses the water instead of foot marching over it.
        <WarJunk color={color} />
      ) : (
        <>
          {FORMATION.map(([sx, sz], i) => (
            <Soldier key={i} dx={sx} dz={sz} color={color} phase={i * 0.6}
              isLeader={i === 0} weaponType={weaponType} />
          ))}
          <MarchDust />
          <MarchBanner color={color} />
        </>
      )}
      {commanderName && (
        <Html position={[0, 0.5, 0]} center distanceFactor={10} zIndexRange={[10, 0]} style={{ pointerEvents: 'none' }}>
          <div style={{
            background: 'rgba(15, 10, 5, 0.82)',
            border: `1px solid ${color}`,
            padding: '2px 6px',
            color: '#ffe9a8',
            fontFamily: '"Ma Shan Zheng", "Songti SC", serif',
            fontSize: '11px',
            whiteSpace: 'nowrap',
            textShadow: '0 0 4px rgba(0,0,0,0.9)',
            boxShadow: `0 0 6px ${color}66`,
          }}>
            <span style={{
              display: 'inline-block', minWidth: 13, textAlign: 'center',
              background: color, color: '#1a120a', borderRadius: 'var(--tkm-radius-xs)',
              fontSize: '9px', marginRight: 4, padding: '0 1px', fontWeight: 700,
            }}>{UNIT_TAG[weaponType]}</span>
            <span style={{ color: '#ffe9a8' }}>{commanderName}</span>
            {ambush && (
              <span style={{
                display: 'inline-block', marginLeft: 4, padding: '0 3px',
                background: ambushRevealed ? '#4a1a12' : '#3a2a4a',
                color: ambushRevealed ? '#ffb09a' : '#d8b8f0',
                borderRadius: 'var(--tkm-radius-xs)',
                fontSize: '9px', fontWeight: 700,
              }}>{ambushRevealed ? '⚠伏' : '伏'}</span>
            )}
            {besieging && (
              <span style={{
                display: 'inline-block', marginLeft: 4, padding: '0 3px',
                background: '#3a2408', color: '#ffd090',
                borderRadius: 'var(--tkm-radius-xs)',
                fontSize: '9px', fontWeight: 700,
              }}>圍</span>
            )}
            <span style={{ color: '#c0a878', marginLeft: 5, fontSize: '9px', fontFamily: 'ui-monospace, monospace' }}>{troopLabel}{etaLabel}</span>
          </div>
        </Html>
      )}
    </group>
  );
}

/** Drifting dust puffs kicked up behind the marching column. */
function MarchDust() {
  const ref = useRef<THREE.Group>(null);
  const N = 5;
  useFrame(({ clock }) => {
    if (!ref.current) return;
    for (let i = 0; i < ref.current.children.length; i++) {
      const m = ref.current.children[i] as THREE.Mesh;
      // Each puff cycles: rises + drifts back + fades, offset per index.
      const t = (clock.elapsedTime * 0.8 + i / N) % 1;
      m.position.set(-0.05 - t * 0.35, 0.02 + t * 0.12, (i - N / 2) * 0.05);
      m.scale.setScalar(0.05 + t * 0.14);
      (m.material as THREE.MeshBasicMaterial).opacity = 0.32 * (1 - t);
    }
  });
  return (
    <group ref={ref}>
      {Array.from({ length: N }, (_, i) => (
        <mesh key={i}>
          <sphereGeometry args={[1, 6, 6]} />
          <meshBasicMaterial color="#b8a888" transparent opacity={0.2} depthWrite={false} />
        </mesh>
      ))}
    </group>
  );
}

/**
 * A garrison camp drawn in place of the marching column when an army is
 * holding an open cell — a palisade ring, a cluster of tents, and a banner
 * pole flying the force colour, so a dug-in field army reads at a glance.
 */
// Tent slots in a rough cluster — bigger camps light up more of them.
const CAMP_TENTS: ReadonlyArray<readonly [number, number]> = [
  [0, 0.15], [-0.13, -0.04], [0.13, -0.04], [-0.07, 0.06], [0.07, 0.06],
  [-0.18, 0.1], [0.18, 0.1], [0, -0.14], [-0.1, -0.12], [0.1, -0.12],
];

function FieldCamp({ color, troops = 0 }: { color: string; troops?: number }) {
  const flagRef = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    if (flagRef.current) {
      // Gentle flag flutter.
      flagRef.current.rotation.y = Math.sin(clock.elapsedTime * 2.2) * 0.25;
    }
  });
  // Camp footprint scales with the size of the garrison holding it.
  const tentCount = Math.max(3, Math.min(CAMP_TENTS.length, 3 + Math.floor(troops / 2500)));
  const s = Math.max(0.8, Math.min(1.7, 0.8 + troops / 16000));
  return (
    <group scale={[s, 1, s]}>
      {/* Palisade / earthwork ring. */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.012, 0]}>
        <ringGeometry args={[0.33, 0.4, 24]} />
        <meshStandardMaterial color="#6b4f2a" roughness={0.9} side={THREE.DoubleSide} />
      </mesh>
      {/* Tents — four-sided canvas pyramids; count scales with troops. */}
      {CAMP_TENTS.slice(0, tentCount).map(([x, z], i) => (
        <mesh key={i} position={[x, 0.085, z]} rotation={[0, Math.PI / 4, 0]}>
          <coneGeometry args={[0.1, 0.17, 4]} />
          <meshStandardMaterial color={i === 0 ? '#d8c79a' : '#c4b187'} roughness={0.8} />
        </mesh>
      ))}
      {/* Banner pole + force-colour flag at the centre of the camp. */}
      <mesh position={[0, 0.2, -0.02]}>
        <cylinderGeometry args={[0.012, 0.012, 0.4, 6]} />
        <meshStandardMaterial color="#3a2a18" />
      </mesh>
      <mesh ref={flagRef} position={[0.07, 0.34, -0.02]}>
        <planeGeometry args={[0.15, 0.1]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.25} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

/** A warhorse for cavalry — body, neck, head, tail and four galloping legs. */
function Horse({ color }: { color: string }) {
  const fl = useRef<THREE.Group>(null);
  const fr = useRef<THREE.Group>(null);
  const bl = useRef<THREE.Group>(null);
  const br = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    // Diagonal gait — front-left swings with back-right, etc.
    const a = Math.sin(clock.elapsedTime * 8) * 0.5;
    if (fl.current) fl.current.rotation.x = a;
    if (br.current) br.current.rotation.x = a;
    if (fr.current) fr.current.rotation.x = -a;
    if (bl.current) bl.current.rotation.x = -a;
  });
  const hide = '#5a4030';
  const leg = (ref: { current: THREE.Group | null }, x: number, z: number) => (
    <group ref={ref} position={[x, 0.07, z]}>
      <mesh position={[0, -0.035, 0]} castShadow>
        <boxGeometry args={[0.016, 0.07, 0.016]} />
        <meshStandardMaterial color={hide} roughness={0.85} />
      </mesh>
    </group>
  );
  return (
    <group>
      {/* Barrel */}
      <mesh position={[0, 0.085, 0]} castShadow>
        <boxGeometry args={[0.05, 0.05, 0.15]} />
        <meshStandardMaterial color={hide} roughness={0.82} />
      </mesh>
      {/* Neck */}
      <mesh position={[0, 0.125, 0.085]} rotation={[0.5, 0, 0]} castShadow>
        <boxGeometry args={[0.034, 0.075, 0.03]} />
        <meshStandardMaterial color={hide} roughness={0.82} />
      </mesh>
      {/* Head */}
      <mesh position={[0, 0.155, 0.118]} rotation={[0.35, 0, 0]} castShadow>
        <boxGeometry args={[0.026, 0.03, 0.06]} />
        <meshStandardMaterial color={hide} roughness={0.82} />
      </mesh>
      {/* Tail */}
      <mesh position={[0, 0.095, -0.085]} rotation={[-0.7, 0, 0]}>
        <cylinderGeometry args={[0.008, 0.002, 0.06, 4]} />
        <meshStandardMaterial color="#3a2a1a" roughness={0.9} />
      </mesh>
      {/* Caparison — saddle cloth in the force colour */}
      <mesh position={[0, 0.113, 0]} castShadow>
        <boxGeometry args={[0.056, 0.012, 0.09]} />
        <meshStandardMaterial color={color} roughness={0.7} />
      </mesh>
      {leg(fl, -0.018, 0.058)}
      {leg(fr, 0.018, 0.058)}
      {leg(bl, -0.018, -0.058)}
      {leg(br, 0.018, -0.058)}
    </group>
  );
}

/**
 * An articulated foot/horse soldier built from primitives — head + helmet,
 * torso, two arms (one gripping the weapon), and two legs that stride in a
 * walk cycle. Weapon silhouette varies by class so an army's composition
 * reads at a glance; the leader gets a plumed helm, a cape and a banner.
 */
function Soldier({ dx, dz, color, phase, isLeader, weaponType }: {
  dx: number; dz: number; color: string; phase: number; isLeader: boolean;
  weaponType: WeaponType;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const lLeg = useRef<THREE.Group>(null);
  const rLeg = useRef<THREE.Group>(null);
  const lArm = useRef<THREE.Group>(null);
  const bannerRef = useRef<THREE.Mesh>(null);
  const capeRef = useRef<THREE.Mesh>(null);
  const mounted = weaponType === 'cavalry';
  const robed = weaponType === 'fan';           // strategist — robe, no helmet
  const skin = '#e0c498';
  const cloth = robed ? '#cdbd95' : color;
  const dark = '#3a2818';
  const steel = '#c8ccd2';

  useFrame(({ clock }) => {
    const t = clock.elapsedTime * 5.5 + phase;
    const sw = Math.sin(t);
    if (groupRef.current) {
      groupRef.current.position.y = mounted
        ? Math.abs(Math.sin(clock.elapsedTime * 8 + phase)) * 0.012   // ride bob
        : Math.abs(Math.cos(t)) * 0.012;                              // foot bob
    }
    if (!mounted && !robed) {
      // Stride: legs swing fore/aft in anti-phase, free arm counter-swings.
      if (lLeg.current) lLeg.current.rotation.x = sw * 0.7;
      if (rLeg.current) rLeg.current.rotation.x = -sw * 0.7;
      if (lArm.current) lArm.current.rotation.x = -sw * 0.5;
    }
    if (bannerRef.current) bannerRef.current.rotation.z = Math.sin(clock.elapsedTime * 4 + phase) * 0.25;
    if (capeRef.current) capeRef.current.rotation.x = 0.1 + Math.sin(clock.elapsedTime * 3 + phase) * 0.12;
  });

  // hips sit higher when mounted so the rider straddles the saddle.
  const hipY = mounted ? 0.135 : 0.06;
  const tall = isLeader ? 1.12 : 1;

  // Weapon, anchored at the right hand and reaching upward.
  const weapon = (() => {
    if (robed) {
      return (
        <mesh position={[0, 0.06, 0.02]} rotation={[0, 0, 0.5]} castShadow>
          <circleGeometry args={[0.032, 12]} />
          <meshStandardMaterial color="#efe6cf" side={THREE.DoubleSide} roughness={0.6} />
        </mesh>
      );
    }
    if (weaponType === 'bow' || weaponType === 'crossbow') {
      return (
        <mesh position={[0, 0.02, 0.02]} rotation={[Math.PI / 2, 0, 0]} castShadow>
          <torusGeometry args={[0.05, 0.005, 6, 10, Math.PI * 1.2]} />
          <meshStandardMaterial color="#6a4a28" roughness={0.7} />
        </mesh>
      );
    }
    if (weaponType === 'sabre' || weaponType === 'sword') {
      return (
        <mesh position={[0, 0.07, 0]} rotation={[0, 0, 0.12]} castShadow>
          <boxGeometry args={[0.008, 0.14, 0.004]} />
          <meshStandardMaterial color={steel} metalness={0.5} roughness={0.4} />
        </mesh>
      );
    }
    // pole arm — spear / halberd / siege / unarmed: tall shaft from the hand.
    const len = weaponType === 'halberd' ? 0.30 : 0.24;
    return (
      <group>
        <mesh position={[0, len / 2, 0]} castShadow>
          <cylinderGeometry args={[0.004, 0.004, len, 5]} />
          <meshStandardMaterial color={dark} roughness={0.8} />
        </mesh>
        <mesh position={[0, len, 0]} castShadow>
          {weaponType === 'halberd'
            ? <boxGeometry args={[0.03, 0.045, 0.004]} />
            : <coneGeometry args={[0.012, 0.045, 6]} />}
          <meshStandardMaterial color={steel} metalness={0.5} roughness={0.4} />
        </mesh>
      </group>
    );
  })();

  return (
    <group ref={groupRef} position={[dx, 0, dz]} scale={[1, tall, 1]}>
      {mounted && <Horse color={color} />}

      {/* ── Legs ── */}
      {robed ? (
        <mesh position={[0, hipY - 0.01, 0]} castShadow>
          <cylinderGeometry args={[0.028, 0.05, 0.12, 8]} />
          <meshStandardMaterial color={cloth} roughness={0.75} />
        </mesh>
      ) : mounted ? (
        <>
          <mesh position={[-0.03, hipY - 0.03, 0]} rotation={[0, 0, -0.5]} castShadow>
            <boxGeometry args={[0.018, 0.07, 0.02]} />
            <meshStandardMaterial color={dark} roughness={0.8} />
          </mesh>
          <mesh position={[0.03, hipY - 0.03, 0]} rotation={[0, 0, 0.5]} castShadow>
            <boxGeometry args={[0.018, 0.07, 0.02]} />
            <meshStandardMaterial color={dark} roughness={0.8} />
          </mesh>
        </>
      ) : (
        <>
          <group ref={lLeg} position={[-0.016, hipY, 0]}>
            <mesh position={[0, -0.03, 0]} castShadow>
              <boxGeometry args={[0.017, 0.06, 0.02]} />
              <meshStandardMaterial color={dark} roughness={0.8} />
            </mesh>
          </group>
          <group ref={rLeg} position={[0.016, hipY, 0]}>
            <mesh position={[0, -0.03, 0]} castShadow>
              <boxGeometry args={[0.017, 0.06, 0.02]} />
              <meshStandardMaterial color={dark} roughness={0.8} />
            </mesh>
          </group>
        </>
      )}

      {/* ── Torso + shoulder armour ── */}
      <mesh position={[0, hipY + 0.045, 0]} castShadow>
        <boxGeometry args={[0.05, 0.085, 0.032]} />
        <meshStandardMaterial color={cloth} roughness={0.72} />
      </mesh>
      {!robed && (
        <mesh position={[0, hipY + 0.082, 0]} castShadow>
          <boxGeometry args={[0.072, 0.018, 0.042]} />
          <meshStandardMaterial color="#caa86a" metalness={0.3} roughness={0.6} />
        </mesh>
      )}

      {/* ── Arms — left swings free, right grips the weapon ── */}
      <group ref={lArm} position={[-0.034, hipY + 0.072, 0]}>
        <mesh position={[0, -0.035, 0]} castShadow>
          <boxGeometry args={[0.014, 0.07, 0.014]} />
          <meshStandardMaterial color={cloth} roughness={0.75} />
        </mesh>
      </group>
      <group position={[0.038, hipY + 0.072, 0]}>
        <mesh position={[0, -0.032, 0]} castShadow>
          <boxGeometry args={[0.014, 0.07, 0.014]} />
          <meshStandardMaterial color={cloth} roughness={0.75} />
        </mesh>
        <group position={[0, -0.062, 0]}>{weapon}</group>
      </group>

      {/* ── Head + helmet / cap ── */}
      <mesh position={[0, hipY + 0.115, 0]} castShadow>
        <sphereGeometry args={[0.024, 7, 7]} />
        <meshStandardMaterial color={skin} roughness={0.75} />
      </mesh>
      {robed ? (
        <mesh position={[0, hipY + 0.135, 0]} castShadow>
          <cylinderGeometry args={[0.022, 0.026, 0.022, 8]} />
          <meshStandardMaterial color="#2c2c34" roughness={0.8} />
        </mesh>
      ) : (
        <>
          <mesh position={[0, hipY + 0.127, 0]} castShadow>
            <sphereGeometry args={[0.027, 8, 6, 0, Math.PI * 2, 0, Math.PI / 2]} />
            <meshStandardMaterial color="#8a8f98" metalness={0.5} roughness={0.45} />
          </mesh>
          {isLeader && (
            <mesh position={[0, hipY + 0.162, 0]} castShadow>
              <coneGeometry args={[0.012, 0.045, 6]} />
              <meshStandardMaterial color="#d23a2a" roughness={0.6} />
            </mesh>
          )}
        </>
      )}

      {/* ── Leader extras: fluttering cape + planted banner ── */}
      {isLeader && (
        <>
          <mesh ref={capeRef} position={[0, hipY + 0.05, -0.022]}>
            <planeGeometry args={[0.07, 0.11]} />
            <meshStandardMaterial color={color} side={THREE.DoubleSide} roughness={0.8} />
          </mesh>
          <group position={[-0.052, hipY + 0.06, 0]}>
            <mesh position={[0, 0.06, 0]}>
              <cylinderGeometry args={[0.004, 0.004, 0.22, 5]} />
              <meshStandardMaterial color={dark} />
            </mesh>
            <mesh ref={bannerRef} position={[0.05, 0.13, 0]} castShadow>
              <planeGeometry args={[0.09, 0.06]} />
              <meshStandardMaterial color={color} side={THREE.DoubleSide} emissive={color} emissiveIntensity={0.15} />
            </mesh>
          </group>
        </>
      )}
    </group>
  );
}
