/* 關砦與港埠 — permanent pass-forts, player stockades/施設 and the river
 * ports. Split out of StrategicMap3D.tsx (2026-07, batch 4); mechanical. */
import { useMemo } from 'react';
import * as THREE from 'three';
import { Html } from '@react-three/drei';
import { useGameStore } from '../../../game/state/store';
import { geoToPixel } from '../../../game/data/geography';
import { FACILITY_DEFS } from '../../../game/types';
import { useLanguage, pickName } from '../../i18n';
import { pxToWorld, sampleTerrainHeight, PIXEL_TO_WORLD } from './shared';

/* ─── Independent ports (RTK 14-style) ─────────────────────────────
 *  Placed at real (lon, lat). Owner color independent of any city.
 *  Sea routes drawn as faint blue lines connecting linked ports. */
/* ─── Forts (砦/壘) — small wooden military strongpoints ─────────── */
export function Forts3D({ onFortClick, hideNearPx }: {
  onFortClick: (fortId: string) => void;
  hideNearPx?: { x: number; y: number } | null;
}) {
  const forts = useGameStore((s) => s.forts);
  const forces = useGameStore((s) => s.forces);
  const playerForceId = useGameStore((s) => s.playerForceId);
  const lang = useLanguage();
  return (
    <group>
      {Object.values(forts).map((fort) => {
        const color = fort.ownerForceId ? (forces[fort.ownerForceId]?.color ?? '#5a4530') : '#5a4530';
        const fac = fort.facility ? FACILITY_DEFS[fort.facility] : null;
        const [fpx, fpy] = geoToPixel(fort.coords.lon, fort.coords.lat);
        // Hidden under the battle diorama (in-range facilities fight ON it).
        if (hideNearPx && Math.hypot(fpx - hideNearPx.x, fpy - hideNearPx.y) < 42) return null;
        const [wx, wz] = pxToWorld(fpx, fpy);
        const wy = sampleTerrainHeight(wx, wz) + 0.04;
        // Scale grows with level: Lv1 ×0.5, Lv2 ×0.62, Lv3 ×0.75
        const levelMul = 0.50 + 0.125 * ((fort.level ?? 1) - 1);
        const s = PIXEL_TO_WORLD * 50 * levelMul;
        const hpPct = Math.max(0, Math.min(1, fort.hp / fort.maxHp));
        return (
          <group key={fort.id} position={[wx, wy, wz]} scale={s}>
            {/* Wooden palisade square base — also the click target */}
            <mesh
              position={[0, 0.15, 0]}
              castShadow receiveShadow
              onClick={(e) => { e.stopPropagation(); onFortClick(fort.id); }}
              onPointerOver={(e) => { e.stopPropagation(); document.body.style.cursor = 'pointer'; }}
              onPointerOut={() => { document.body.style.cursor = ''; }}
            >
              <boxGeometry args={[0.5, 0.30, 0.5]} />
              <meshStandardMaterial color="#5a4530" roughness={0.95} />
            </mesh>
            {/* Central watchtower */}
            <mesh position={[0, 0.50, 0]} castShadow>
              <boxGeometry args={[0.20, 0.40, 0.20]} />
              <meshStandardMaterial color={color} roughness={0.75} />
            </mesh>
            {/* Pyramidal roof */}
            <mesh position={[0, 0.75, 0]} rotation={[0, Math.PI / 4, 0]} castShadow>
              <coneGeometry args={[0.18, 0.20, 4]} />
              <meshStandardMaterial color="#3a3a4a" roughness={0.85} />
            </mesh>
            {/* Banner pole */}
            <mesh position={[0.20, 0.50, 0]} castShadow>
              <cylinderGeometry args={[0.012, 0.012, 0.55, 4]} />
              <meshStandardMaterial color="#1a1410" />
            </mesh>
            <mesh position={[0.30, 0.65, 0]} castShadow>
              <planeGeometry args={[0.16, 0.10]} />
              <meshStandardMaterial color={color} side={THREE.DoubleSide} />
            </mesh>
            {/* 施設 accent + interdiction range ring. The ring radius is the
                facility's range in map-pixels, undone through the group scale so
                it reads at true world size. Own facilities ring brightest. */}
            {fac && (
              <mesh position={[0, 0.96, 0]} rotation={[0, Math.PI / 4, 0]} castShadow>
                <coneGeometry args={[0.13, 0.26, fort.facility === 'catapult' ? 3 : 4]} />
                <meshStandardMaterial color={fac.color} emissive={fac.color} emissiveIntensity={0.25} roughness={0.6} />
              </mesh>
            )}
            {fac && fac.range > 0 && (
              <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
                <ringGeometry args={[fac.range / (50 * levelMul) - 0.06, fac.range / (50 * levelMul), 48]} />
                <meshBasicMaterial
                  color={fac.color}
                  transparent
                  opacity={fort.ownerForceId === playerForceId ? 0.5 : 0.22}
                  side={THREE.DoubleSide}
                />
              </mesh>
            )}
            {/* Label + HP bar */}
            <Html position={[0, 1.10, 0]} center distanceFactor={10} zIndexRange={[10, 0]} style={{ pointerEvents: 'none' }}>
              <div style={{
                fontFamily: 'var(--tkm-font-body)',
                fontSize: '10px',
                color: '#f0e8d0',
                background: 'rgba(20, 14, 8, 0.78)',
                border: `1px solid ${color}`,
                padding: '1px 5px',
                whiteSpace: 'nowrap',
                textAlign: 'center',
              }}>
                <div>⚔ {pickName(fort.name, lang)} <span style={{ color: '#d4a84a' }}>{'★'.repeat(fort.level ?? 1)}</span></div>
                <div style={{ height: 2, marginTop: 2, background: '#1a1410' }}>
                  <div style={{
                    height: '100%',
                    width: `${Math.round(hpPct * 100)}%`,
                    background: hpPct > 0.5 ? '#7ed68a' : '#b8442e',
                  }} />
                </div>
              </div>
            </Html>
          </group>
        );
      })}
    </group>
  );
}

export function Ports3D({ onPortClick }: { onPortClick: (portId: string) => void }) {
  const ports = useGameStore((s) => s.ports);
  const forces = useGameStore((s) => s.forces);
  const portList = useMemo(() => Object.values(ports), [ports]);

  // Sea routes geometry (one per connection, dedup'd)
  const routeGeoms = useMemo(() => {
    const seen = new Set<string>();
    const list: THREE.BufferGeometry[] = [];
    for (const p of portList) {
      for (const otherId of p.connectedPortIds) {
        const a = p.id < otherId ? p.id : otherId;
        const b = p.id < otherId ? otherId : p.id;
        const key = `${a}|${b}`;
        if (seen.has(key)) continue;
        seen.add(key);
        const other = ports[otherId];
        if (!other) continue;
        const [fx, fz] = pxToWorld(...geoToPixel(p.coords.lon, p.coords.lat));
        const [tx, tz] = pxToWorld(...geoToPixel(other.coords.lon, other.coords.lat));
        list.push(new THREE.BufferGeometry().setFromPoints([
          new THREE.Vector3(fx, 0.02, fz),
          new THREE.Vector3(tx, 0.02, tz),
        ]));
      }
    }
    return list;
  }, [portList, ports]);

  return (
    <group>
      {/* Sea-route lines — pale blue dashed-look */}
      {routeGeoms.map((g, i) => (
        <line key={`route-${i}`}>
          <primitive object={g} attach="geometry" />
          <lineBasicMaterial color="#5a9bc8" transparent opacity={0.45} />
        </line>
      ))}
      {/* Each port as a small dock structure */}
      {portList.map((p) => {
        const color = p.ownerForceId ? (forces[p.ownerForceId]?.color ?? '#5a4530') : '#5a4530';
        return <Port3D key={p.id} port={p} color={color} onClick={() => onPortClick(p.id)} />;
      })}
    </group>
  );
}

function Port3D({ port, color, onClick }: {
  port: import('../../../game/types').Port;
  color: string;
  onClick: () => void;
}) {
  const lang = useLanguage();
  const [wx, wz] = pxToWorld(...geoToPixel(port.coords.lon, port.coords.lat));
  // Scale to match enlarged world
  const s = PIXEL_TO_WORLD * 50 * 0.6;
  const hpPct = Math.max(0, Math.min(1, port.hp / port.maxHp));
  return (
    <group position={[wx, 0, wz]} scale={s}>
      {/* Stone quay — main slab — click target */}
      <mesh
        position={[0, 0.05, 0]}
        castShadow receiveShadow
        onClick={(e) => { e.stopPropagation(); onClick(); }}
        onPointerOver={(e) => { e.stopPropagation(); document.body.style.cursor = 'pointer'; }}
        onPointerOut={() => { document.body.style.cursor = ''; }}
      >
        <boxGeometry args={[0.6, 0.08, 0.25]} />
        <meshStandardMaterial color="#7a6750" roughness={0.92} />
      </mesh>
      {/* Wooden jetty running out over the water (L-shape) on stilts */}
      <mesh position={[-0.10, 0.045, 0.32]} castShadow receiveShadow>
        <boxGeometry args={[0.14, 0.035, 0.45]} />
        <meshStandardMaterial color="#6b5238" roughness={0.9} />
      </mesh>
      {[0.16, 0.34, 0.50].map((dz, i) => (
        <mesh key={i} position={[-0.10, -0.02, dz]} castShadow>
          <cylinderGeometry args={[0.012, 0.012, 0.12, 4]} />
          <meshStandardMaterial color="#4a3826" roughness={0.95} />
        </mesh>
      ))}
      {/* Warehouse hut on the shore end */}
      <mesh position={[0.18, 0.135, -0.04]} castShadow receiveShadow>
        <boxGeometry args={[0.16, 0.11, 0.13]} />
        <meshStandardMaterial color="#8a6a4a" roughness={0.85} />
      </mesh>
      <mesh position={[0.18, 0.215, -0.04]} rotation={[0, Math.PI / 4, 0]} castShadow>
        <coneGeometry args={[0.125, 0.09, 4]} />
        <meshStandardMaterial color="#3a3a4a" roughness={0.8} />
      </mesh>
      {/* Beacon — pole with a glowing brazier at the jetty head */}
      <mesh position={[-0.10, 0.16, 0.52]} castShadow>
        <cylinderGeometry args={[0.010, 0.013, 0.24, 4]} />
        <meshStandardMaterial color="#1a1410" />
      </mesh>
      <mesh position={[-0.10, 0.30, 0.52]}>
        <sphereGeometry args={[0.030, 8, 6]} />
        <meshStandardMaterial color="#ffb238" emissive="#ff8c1a" emissiveIntensity={1.6} />
      </mesh>
      {/* Breakwater — three stone blocks arcing off the quay */}
      {[[-0.42, 0.30], [-0.52, 0.16], [-0.56, 0.00]].map(([bx, bz], i) => (
        <mesh key={i} position={[bx, 0.015, bz]} rotation={[0, i * 0.5, 0]} castShadow>
          <boxGeometry args={[0.14, 0.07, 0.09]} />
          <meshStandardMaterial color="#6e6354" roughness={0.96} />
        </mesh>
      ))}
      {/* Owner banner pole + flag */}
      <mesh position={[0.28, 0.35, 0]} castShadow>
        <cylinderGeometry args={[0.015, 0.015, 0.55, 4]} />
        <meshStandardMaterial color="#1a1410" />
      </mesh>
      <mesh position={[0.40, 0.50, 0]} castShadow>
        <planeGeometry args={[0.22, 0.15]} />
        <meshStandardMaterial color={color} side={THREE.DoubleSide} />
      </mesh>
      {/* War junk moored at the jetty — hull, raised stern, batten sail */}
      <group position={[-0.30, 0.06, 0.42]} rotation={[0, 0.35, 0]}>
        <mesh position={[0, 0.04, 0]} castShadow>
          <boxGeometry args={[0.34, 0.07, 0.11]} />
          <meshStandardMaterial color="#5a4530" roughness={0.85} />
        </mesh>
        <mesh position={[-0.145, 0.095, 0]} castShadow>
          <boxGeometry args={[0.06, 0.05, 0.10]} />
          <meshStandardMaterial color="#6b5238" roughness={0.85} />
        </mesh>
        <mesh position={[0.02, 0.22, 0]} castShadow>
          <cylinderGeometry args={[0.008, 0.008, 0.30, 4]} />
          <meshStandardMaterial color="#3a2818" />
        </mesh>
        <mesh position={[0.02, 0.24, 0.015]} rotation={[0, 0, -0.08]}>
          <planeGeometry args={[0.16, 0.20]} />
          <meshStandardMaterial color="#c8b078" roughness={0.9} side={THREE.DoubleSide} />
        </mesh>
        {/* sail battens */}
        {[-0.06, 0, 0.06].map((dy, i) => (
          <mesh key={i} position={[0.02, 0.24 + dy, 0.018]} rotation={[0, 0, -0.08]}>
            <boxGeometry args={[0.165, 0.006, 0.004]} />
            <meshStandardMaterial color="#7a5c38" />
          </mesh>
        ))}
      </group>
      {/* Second, smaller sampan */}
      <mesh position={[0.10, 0.075, 0.50]} rotation={[0, -0.4, 0]} castShadow>
        <boxGeometry args={[0.18, 0.05, 0.07]} />
        <meshStandardMaterial color="#6b5238" roughness={0.88} />
      </mesh>
      {/* Label + HP bar — drei Html */}
      <Html position={[0, 0.85, 0]} center distanceFactor={9} zIndexRange={[10, 0]} style={{ pointerEvents: 'none' }}>
        <div style={{
          fontFamily: 'var(--tkm-font-body)',
          fontSize: '11px',
          color: '#f0e8d0',
          background: 'rgba(20, 14, 8, 0.78)',
          border: `1px solid ${color}`,
          padding: '1px 5px',
          whiteSpace: 'nowrap',
          textAlign: 'center',
          minWidth: 40,
        }}>
          <div>⚓ {pickName(port.name, lang)}</div>
          <div style={{ height: 2, marginTop: 2, background: '#1a1410' }}>
            <div style={{
              height: '100%',
              width: `${Math.round(hpPct * 100)}%`,
              background: hpPct > 0.5 ? '#7ed68a' : '#b8442e',
            }} />
          </div>
        </div>
      </Html>
    </group>
  );
}

