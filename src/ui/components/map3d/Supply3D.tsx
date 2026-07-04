/* 糧道 — the capital supply-web overlay (city network) and the per-column
 * supply corridor (hex-paint BFS ribbon + cut warning). Split out of
 * StrategicMap3D.tsx (2026-07, batch 3); pure mechanical move. */
import { useLayoutEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { Html } from '@react-three/drei';
import { useGameStore } from '../../../game/state/store';
import { cityPos, cityPixel } from '../../../game/data/cityGeo';
import { supplyPath } from '../../../game/systems/hexPaint';
import { geoToPixel, hexAt as geoHexAt, hexCenter as geoHexCenter } from '../../../game/data/geography';
import { useT } from '../../i18n';
import { pxToWorld, sampleTerrainHeight, cityElevation } from './shared';
import { BattlePulseRing3D } from './WorldMarks3D';
import { HEXW_R } from './HexWorld3D';

const EMPTY_HEX_PAINT: Record<string, { f: string; t: number }> = {};

/* ─── 糧道 — the supply web ──────────────────────────────────────────────
   Overlay mode 糧道: gold supply lines trace every adjacent pair of player
   cities CONNECTED to the capital (BFS over owned adjacency); an owned city
   that cannot reach the capital through friendly territory is cut off —
   marked with a pulsing red ring and a ⚠斷補 chip. Information layer only
   (no gameplay penalty yet), but it answers "can my front be fed?" at a
   glance before a campaign.*/
export function SupplyLines3D() {
  const cities = useGameStore((s) => s.cities);
  const playerForceId = useGameStore((s) => s.playerForceId);
  const forces = useGameStore((s) => s.forces);
  const net = useMemo(() => {
    if (!playerForceId) return null;
    const capitalId = forces[playerForceId]?.capitalCityId;
    const owned = new Set(Object.values(cities).filter((c) => c.ownerForceId === playerForceId).map((c) => c.id));
    if (!capitalId || !owned.has(capitalId)) return { connected: new Set<string>(), owned, edges: [] as Array<[string, string]>, cut: [...owned] };
    const connected = new Set<string>([capitalId]);
    const queue = [capitalId];
    while (queue.length) {
      const id = queue.pop()!;
      for (const adj of cities[id]?.adjacentCityIds ?? []) {
        if (owned.has(adj) && !connected.has(adj)) { connected.add(adj); queue.push(adj); }
      }
    }
    const edges: Array<[string, string]> = [];
    for (const id of connected) {
      for (const adj of cities[id]?.adjacentCityIds ?? []) {
        if (connected.has(adj) && id < adj) edges.push([id, adj]);
      }
    }
    const cut = [...owned].filter((id) => !connected.has(id));
    return { connected, owned, edges, cut };
  }, [cities, forces, playerForceId]);
  if (!net) return null;
  return (
    <group>
      {net.edges.map(([a, b]) => {
        const ca = cities[a], cb = cities[b];
        if (!ca || !cb) return null;
        const [ax, az] = pxToWorld(...cityPixel(ca.id, ca.coords.x, ca.coords.y));
        const [bx, bz] = pxToWorld(...cityPixel(cb.id, cb.coords.x, cb.coords.y));
        const mx = (ax + bx) / 2, mz = (az + bz) / 2;
        const len = Math.hypot(bx - ax, bz - az);
        const y = Math.max(sampleTerrainHeight(ax, az), sampleTerrainHeight(bx, bz), sampleTerrainHeight(mx, mz)) + 0.16;
        return (
          <mesh key={`${a}-${b}`} position={[mx, y, mz]} rotation={[0, Math.atan2(-(bz - az), bx - ax), 0]}>
            <boxGeometry args={[len, 0.025, 0.06]} />
            <meshBasicMaterial color="#e8c060" transparent opacity={0.75} depthWrite={false} />
          </mesh>
        );
      })}
      {net.cut.map((id) => {
        const c = cities[id];
        if (!c) return null;
        const [wx, wz] = pxToWorld(...cityPixel(c.id, c.coords.x, c.coords.y));
        const y = cityElevation(wx, wz);
        return (
          <group key={`cut-${id}`}>
            <BattlePulseRing3D wx={wx} y={y + 0.05} wz={wz} color="#e0552a" phase={0.2} />
            <Html position={[wx, y + 1.0, wz]} center distanceFactor={9} zIndexRange={[40, 30]} style={{ pointerEvents: 'none' }}>
              <div style={{
                background: 'rgba(40,14,8,0.9)', border: '1px solid #e0552a', borderRadius: 'var(--tkm-radius-xs)',
                padding: '1px 7px', fontFamily: 'var(--tkm-font-body)', fontSize: '11px',
                color: '#f0b0a0', whiteSpace: 'nowrap', letterSpacing: '1px',
              }}>⚠ 斷補 — 不通都城</div>
            </Html>
          </group>
        );
      })}
    </group>
  );
}
/** 糧道可視 — the selected long-range column's supply ribbon: the actual
 *  BFS corridor of own paint back to a friendly city glows gold; a cut
 *  ribbon flags the column red with a 斷糧 chip. Same reachability the
 *  season resolution starves by, so what you see is what will bleed. */
export function SupplyCorridor3D({ armyId }: { armyId: string }) {
  const hexPaint = useGameStore((s) => s.hexPaint ?? EMPTY_HEX_PAINT);
  const cities = useGameStore((s) => s.cities);
  const pendingCommands = useGameStore((s) => s.pendingCommands);
  const armies = useGameStore((s) => s.armies);
  const playerForceId = useGameStore((s) => s.playerForceId);
  const t = useT();
  const ref = useRef<THREE.InstancedMesh>(null);
  const viz = useMemo(() => {
    const cmd = pendingCommands[armyId];
    const army = armies[armyId];
    if (!cmd || cmd.type !== 'march' || !army || !playerForceId) return null;
    if (army.forceId !== playerForceId) return null;
    if (Math.max(1, cmd.totalSeasons ?? 1) < 2) return null;  // short hops carry their own packs
    const cell = geoHexAt(army.x, army.y);
    const own = Object.values(cities)
      .filter((c) => c.ownerForceId === playerForceId)
      .map((c) => { const cp = cityPos(c); return geoHexAt(cp.x, cp.y); });
    // 兵站錨點 — friendly depots terminate the corridor too (same rule as
    // the season resolution, so what the ribbon shows is what resolves).
    for (const f of Object.values(useGameStore.getState().forts ?? {})) {
      if (f.facility !== 'depot' || f.ownerForceId !== playerForceId || f.hp <= 0) continue;
      const [fx, fy] = geoToPixel(f.coords.lon, f.coords.lat);
      own.push(geoHexAt(fx, fy));
    }
    const path = supplyPath(hexPaint, playerForceId, cell, own);
    return { path, ax: army.x, ay: army.y };
  }, [armyId, pendingCommands, armies, cities, hexPaint, playerForceId]);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  useLayoutEffect(() => {
    const m = ref.current;
    if (!m || !viz?.path) return;
    viz.path.forEach((cell, i) => {
      const c = geoHexCenter(cell.col, cell.row);
      const [wx, wz] = pxToWorld(c.x, c.y);
      dummy.position.set(wx, sampleTerrainHeight(wx, wz) + 0.045, wz);
      dummy.rotation.set(-Math.PI / 2, 0, 0);
      dummy.updateMatrix();
      m.setMatrixAt(i, dummy.matrix);
    });
    m.instanceMatrix.needsUpdate = true;
    m.computeBoundingSphere();
  }, [viz, dummy]);
  if (!viz) return null;
  if (!viz.path) {
    const [wx, wz] = pxToWorld(viz.ax, viz.ay);
    const y = sampleTerrainHeight(wx, wz);
    return (
      <group raycast={() => null}>
        <mesh position={[wx, y + 0.05, wz]} rotation={[-Math.PI / 2, 0, 0]} raycast={() => null}>
          <ringGeometry args={[0.5, 0.72, 28]} />
          <meshBasicMaterial color="#e0552a" transparent opacity={0.85} depthWrite={false} toneMapped={false} />
        </mesh>
        <Html position={[wx, y + 1.35, wz]} center distanceFactor={10} zIndexRange={[45, 35]} style={{ pointerEvents: 'none' }}>
          <div style={{
            background: 'rgba(40, 14, 8, 0.92)', border: '1px solid #e0552a', borderRadius: 'var(--tkm-radius-xs)',
            padding: '1px 7px', fontFamily: 'var(--tkm-font-body)', fontSize: '11px',
            color: '#f0b0a0', whiteSpace: 'nowrap', letterSpacing: '1px',
          }}>⚠ {t('糧道已斷 — 每季折兵', 'Supply CUT — bleeding every turn')}</div>
        </Html>
      </group>
    );
  }
  return (
    <instancedMesh key={viz.path.length} ref={ref} args={[undefined, undefined, viz.path.length]} raycast={() => null}>
      <circleGeometry args={[HEXW_R * 0.55, 6]} />
      <meshBasicMaterial color="#e8c05a" transparent opacity={0.42} depthWrite={false} toneMapped={false} />
    </instancedMesh>
  );
}
