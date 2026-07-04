/* 兵鋒與邦交 — the strategic-intent overlay (marching arrows, threat pulses)
 * and the diplomacy web. Split out of StrategicMap3D.tsx (2026-07, batch 3);
 * pure mechanical move. */
import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { Html, Line } from '@react-three/drei';
import { useGameStore } from '../../../game/state/store';
import type { City, Force, Army } from '../../../game/types';
import { cityPixel } from '../../../game/data/cityGeo';
import { terrainRoute } from '../../../game/data/territories';
import { pxToWorld, sampleTerrainHeight, cityElevation } from './shared';

/* ─── 兵鋒脈動 — one ripple ring expanding off a city about to be hit ──── */
export function ThreatPulse({ pos }: { pos: THREE.Vector3 }) {
  const ref = useRef<THREE.Mesh>(null);
  const matRef = useRef<THREE.MeshBasicMaterial>(null);
  useFrame(({ clock }) => {
    const t = (clock.elapsedTime % 1.5) / 1.5;     // 0→1 ripple, then resets
    const s = 0.5 + t * 1.7;
    if (ref.current) ref.current.scale.set(s, s, s);
    if (matRef.current) matRef.current.opacity = (1 - t) * 0.55;
  });
  return (
    <mesh ref={ref} position={pos} rotation={[-Math.PI / 2, 0, 0]}>
      <ringGeometry args={[0.5, 0.64, 44]} />
      <meshBasicMaterial ref={matRef} color="#ff4d3a" transparent opacity={0.55}
        side={THREE.DoubleSide} depthWrite={false} toneMapped={false} />
    </mesh>
  );
}

/* ─── 兵鋒 — the strategic-intent layer (戰雲 overlay) ──────────────────
   Turns the map into a command board: every marching column draws a flowing
   dashed arrow from where it is now to the city it's aiming at, coloured by
   its force, thicker the bigger the host. Columns aimed at YOUR cities glow
   red and the target city pulses with a ripple ring, so an incoming storm is
   impossible to miss. Fog still hides hostile columns you can't actually see. */
export function IntentLayer({ cities, forces, armies, playerForceId, fog }: {
  cities: Record<string, City>;
  forces: Record<string, Force>;
  armies: Record<string, Army>;
  playerForceId: string | null;
  fog: { isVisiblePx: (x: number, y: number) => boolean } | null;
}) {
  const { arrows, pulses } = useMemo(() => {
    const arrows: Array<{ key: string; pts: THREE.Vector3[]; head: THREE.Vector3; dir: THREE.Vector3; color: string; width: number; danger: boolean }> = [];
    const pulseMap = new Map<string, THREE.Vector3>();
    for (const a of Object.values(armies)) {
      if (a.holding) continue;
      const tgt = cities[a.targetCityId];
      if (!tgt) continue;                                   // field marches have no city
      // 迷霧 — hostile columns out of sight don't betray their heading.
      if (fog && a.forceId !== playerForceId && !fog.isVisiblePx(a.x, a.y)) continue;
      const [tpx, tpy] = cityPixel(tgt.id, tgt.coords.x, tgt.coords.y);
      const route = terrainRoute(a.x, a.y, tpx, tpy);
      if (route.length < 2) continue;
      const pts = route.map((p) => {
        const [wx, wz] = pxToWorld(p.x, p.y);
        return new THREE.Vector3(wx, sampleTerrainHeight(wx, wz) + 0.2, wz);
      });
      const head = pts[pts.length - 1];
      const dir = head.clone().sub(pts[pts.length - 2]).normalize();
      const danger = !!playerForceId && tgt.ownerForceId === playerForceId && a.forceId !== playerForceId;
      arrows.push({
        key: a.id, pts, head, dir,
        color: forces[a.forceId]?.color ?? '#bcbcbc',
        width: 1.6 + Math.min(4, a.troops / 3500),
        danger,
      });
      if (danger && !pulseMap.has(tgt.id)) {
        const [cwx, cwz] = pxToWorld(tpx, tpy);
        pulseMap.set(tgt.id, new THREE.Vector3(cwx, cityElevation(cwx, cwz) + 0.06, cwz));
      }
    }
    return { arrows, pulses: Array.from(pulseMap.entries()) };
  }, [armies, cities, forces, fog, playerForceId]);

  // Animate the dashes so each arrow visibly *flows* toward its target.
  const lineRefs = useRef<Array<{ material: { dashOffset: number } } | null>>([]);
  useFrame((_, delta) => {
    for (const m of lineRefs.current) {
      if (m && m.material) m.material.dashOffset -= delta * 0.8;
    }
  });

  const up = useMemo(() => new THREE.Vector3(0, 1, 0), []);
  return (
    <group renderOrder={4}>
      {arrows.map((ar, i) => (
        <group key={ar.key}>
          {/* soft under-glow so danger arrows read even over busy terrain */}
          <Line points={ar.pts} color={ar.danger ? '#ff3a28' : ar.color}
            lineWidth={ar.width + (ar.danger ? 2.6 : 1.4)} transparent opacity={0.16} depthTest={false} />
          <Line
            ref={(o) => { lineRefs.current[i] = o as unknown as { material: { dashOffset: number } } | null; }}
            points={ar.pts}
            color={ar.danger ? '#ff6a4d' : ar.color}
            lineWidth={ar.width}
            dashed dashSize={0.5} gapSize={0.32}
            transparent opacity={0.92} depthTest={false}
          />
          <mesh position={ar.head} quaternion={new THREE.Quaternion().setFromUnitVectors(up, ar.dir)}>
            <coneGeometry args={[0.14 + ar.width * 0.03, 0.42 + ar.width * 0.06, 8]} />
            <meshBasicMaterial color={ar.danger ? '#ff6a4d' : ar.color} transparent opacity={0.95} toneMapped={false} depthTest={false} />
          </mesh>
        </group>
      ))}
      {pulses.map(([id, pos]) => <ThreatPulse key={`pulse-${id}`} pos={pos} />)}
    </group>
  );
}

/* ─── 邦交關係線 — the web of pacts and grudges, capital to capital ────
   The 邦交 overlay arcs every meaningful relation between living forces:
   gold solid = alliance, green dashed = non-aggression pact, red = open
   hostility (neutral status soured to score ≤ -40). Plain neutrals stay
   undrawn or the map turns to spaghetti. Lines involving the player ride
   slightly thicker; the midpoint chip carries the relation score. */
export function DiplomacyLines3D({ cities, forces }: {
  cities: Record<string, City>;
  forces: Record<string, Force>;
}) {
  const diplomacy = useGameStore((s) => s.diplomacy);
  const playerForceId = useGameStore((s) => s.playerForceId);

  const links = useMemo(() => {
    // A force is alive if it still holds a city; anchor at its capital,
    // falling back to any city it holds (capitals do fall).
    const holdings = new Map<string, City[]>();
    for (const c of Object.values(cities)) {
      if (!c.ownerForceId) continue;
      if (!holdings.has(c.ownerForceId)) holdings.set(c.ownerForceId, []);
      holdings.get(c.ownerForceId)!.push(c);
    }
    const anchorOf = (forceId: string): City | null => {
      const owned = holdings.get(forceId);
      if (!owned || owned.length === 0) return null;
      const cap = forces[forceId] ? cities[forces[forceId].capitalCityId] : null;
      return cap && cap.ownerForceId === forceId ? cap : owned[0];
    };
    const out: Array<{
      pts: THREE.Vector3[];
      mid: THREE.Vector3;
      kind: 'allied' | 'pact' | 'hostile';
      score: number;
      mine: boolean;
    }> = [];
    for (const rel of Object.values(diplomacy.relations)) {
      const hostile = rel.status === 'neutral' && rel.score <= -40;
      if (rel.status === 'neutral' && !hostile) continue;
      const a = anchorOf(rel.forceA);
      const b = anchorOf(rel.forceB);
      if (!a || !b) continue;
      const [ax, az] = pxToWorld(...cityPixel(a.id, a.coords.x, a.coords.y));
      const [bx, bz] = pxToWorld(...cityPixel(b.id, b.coords.x, b.coords.y));
      const ay = cityElevation(ax, az) + 0.25;
      const by = cityElevation(bx, bz) + 0.25;
      const dist = Math.hypot(bx - ax, bz - az);
      const mid = new THREE.Vector3((ax + bx) / 2, Math.max(ay, by) + 0.7 + dist * 0.16, (az + bz) / 2);
      const curve = new THREE.QuadraticBezierCurve3(
        new THREE.Vector3(ax, ay, az), mid, new THREE.Vector3(bx, by, bz),
      );
      out.push({
        pts: curve.getPoints(28),
        mid,
        kind: rel.status === 'allied' ? 'allied' : rel.status === 'non-aggression' ? 'pact' : 'hostile',
        score: rel.score,
        mine: rel.forceA === playerForceId || rel.forceB === playerForceId,
      });
    }
    return out;
  }, [diplomacy, cities, forces, playerForceId]);

  const STYLE = {
    allied:  { color: '#f0c060', zh: '盟' },
    pact:    { color: '#9ed68a', zh: '約' },
    hostile: { color: '#ff5040', zh: '仇' },
  } as const;

  return (
    <group>
      {links.map((l, i) => {
        const st = STYLE[l.kind];
        return (
          <group key={i}>
            <Line
              points={l.pts}
              color={st.color}
              dashed={l.kind === 'pact'}
              dashSize={0.4}
              gapSize={0.22}
              lineWidth={l.mine ? 2.2 : 1.3}
              transparent
              opacity={l.mine ? 0.95 : 0.65}
            />
            <Html position={l.mid} center distanceFactor={11} zIndexRange={[28, 18]} style={{ pointerEvents: 'none' }}>
              <div style={{
                background: 'rgba(20,14,8,0.88)', border: `1px solid ${st.color}`, borderRadius: 'var(--tkm-radius-xs)',
                padding: '1px 6px', fontFamily: 'var(--tkm-font-body)', fontSize: 10,
                color: st.color, whiteSpace: 'nowrap', letterSpacing: '1px',
              }}>
                {st.zh} {l.score > 0 ? `+${l.score}` : l.score}
              </div>
            </Html>
          </group>
        );
      })}
    </group>
  );
}

