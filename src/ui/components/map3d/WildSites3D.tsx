/* 部族・野地據點・名勝 — tribes, wild sites and scenic spots on the world
 * map. Split out of StrategicMap3D.tsx (2026-07, batch 4); mechanical. */
import { useMemo } from 'react';
import * as THREE from 'three';
import { Html } from '@react-three/drei';
import { useGameStore } from '../../../game/state/store';
import { geoToPixel } from '../../../game/data/geography';
import { TRIBES } from '../../../game/data/tribes';
import { SCENIC_SITES } from '../../../game/data/scenicSites';
import { useLanguage, pickName } from '../../i18n';
import { pxToWorld, sampleTerrainHeight, PIXEL_TO_WORLD, MARKER_SCALE } from './shared';

/* ─── 異族部落 — frontier tribe homelands ─────────────────────────────
 * The Nanman jungles, Wuhuan steppe, Qiang highlands… each raid-source
 * tribe now sits as a 部落寨 (tent cluster + totem) just beyond the cities
 * it harries. Clicking opens the 征討/招撫 panel. */
export function Tribes3D({ onTribeClick }: { onTribeClick: (tribeId: string) => void }) {
  const aggression = useGameStore((s) => s.tribeState.aggression);
  const lang = useLanguage();
  const sites = useMemo(() => TRIBES.map((tb) => {
    const [px, py] = geoToPixel(tb.homeland.lon, tb.homeland.lat);
    const [wx, wz] = pxToWorld(px, py);
    return { id: tb.id, zh: pickName(tb.name, lang), color: tb.color, wx, wz };
  }), [lang]);
  const scale = PIXEL_TO_WORLD * 50 * 0.5 * MARKER_SCALE;
  return (
    <group>
      {sites.map((s) => {
        const y = sampleTerrainHeight(s.wx, s.wz);
        const agg = aggression[s.id] ?? 0.15;
        const restless = agg > 0.22;
        return (
          <group key={s.id} position={[s.wx, y, s.wz]} scale={scale}>
            {/* Click target — a low ground disc */}
            <mesh
              position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}
              onClick={(e) => { e.stopPropagation(); onTribeClick(s.id); }}
              onPointerOver={(e) => { e.stopPropagation(); document.body.style.cursor = 'pointer'; }}
              onPointerOut={() => { document.body.style.cursor = ''; }}
            >
              <circleGeometry args={[0.55, 20]} />
              <meshBasicMaterial color={s.color} transparent opacity={0.32} />
            </mesh>
            {/* Three hide tents */}
            {([[-0.28, 0.1], [0.26, -0.04], [0.02, 0.3]] as const).map(([tx, tz], i) => (
              <group key={i} position={[tx, 0, tz]}>
                <mesh position={[0, 0.16, 0]} castShadow>
                  <coneGeometry args={[0.17, 0.34, 7]} />
                  <meshStandardMaterial color={i === 1 ? '#8a7256' : '#766350'} roughness={0.92} />
                </mesh>
                {/* Tent-pole tips poking through the top */}
                <mesh position={[0, 0.35, 0]}>
                  <coneGeometry args={[0.02, 0.08, 4]} />
                  <meshStandardMaterial color="#4a3c2c" roughness={0.9} />
                </mesh>
              </group>
            ))}
            {/* Central totem / banner pole in the tribe colour */}
            <mesh position={[0, 0.3, 0]} castShadow>
              <cylinderGeometry args={[0.022, 0.022, 0.6, 6]} />
              <meshStandardMaterial color="#3a2c1c" roughness={0.85} />
            </mesh>
            <mesh position={[0.09, 0.5, 0]} castShadow>
              <boxGeometry args={[0.16, 0.12, 0.02]} />
              <meshStandardMaterial color={s.color} side={THREE.DoubleSide} roughness={0.7} />
            </mesh>
            {/* Restless tribes smoulder a warning campfire glow */}
            {restless && (
              <mesh position={[0, 0.05, -0.3]}>
                <sphereGeometry args={[0.07, 8, 6]} />
                <meshBasicMaterial color="#e0662a" transparent opacity={0.7} />
              </mesh>
            )}
            <Html position={[0, 0.78, 0]} center distanceFactor={12} zIndexRange={[8, 0]} style={{ pointerEvents: 'none' }}>
              <div style={{
                background: 'rgba(28, 18, 10, 0.82)', border: `1px solid ${s.color}`, borderRadius: 'var(--tkm-radius-xs)',
                padding: '1px 6px', color: '#f0d8a8', fontFamily: '"Ma Shan Zheng", "Songti SC", serif',
                fontSize: '11px', whiteSpace: 'nowrap',
              }}>⛺ {s.zh}</div>
            </Html>
          </group>
        );
      })}
    </group>
  );
}

/* ─── 野外據點 — bandit nests, river fords, resource deposits ─────────── */
function WildSite3D({ site, color, onClick }: {
  site: import('../../../game/types').WildSite;
  color: string;
  onClick: () => void;
}) {
  const lang = useLanguage();
  const [px, py] = geoToPixel(site.coords.lon, site.coords.lat);
  const [wx, wz] = pxToWorld(px, py);
  const y = sampleTerrainHeight(wx, wz);
  const scale = PIXEL_TO_WORLD * 50 * 0.45 * MARKER_SCALE;
  const disc = (
    <mesh
      position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}
      onClick={(e) => { e.stopPropagation(); onClick(); }}
      onPointerOver={(e) => { e.stopPropagation(); document.body.style.cursor = 'pointer'; }}
      onPointerOut={() => { document.body.style.cursor = ''; }}
    >
      <circleGeometry args={[0.5, 18]} />
      <meshBasicMaterial color={color} transparent opacity={0.34} />
    </mesh>
  );
  let body: React.ReactNode = null;
  if (site.subtype === 'bandit') {
    // Palisade ring + raised black banner.
    body = (
      <group>
        {Array.from({ length: 8 }).map((_, i) => {
          const a = (i / 8) * Math.PI * 2;
          return (
            <mesh key={i} position={[Math.cos(a) * 0.34, 0.16, Math.sin(a) * 0.34]} rotation={[0, -a, 0.12]} castShadow>
              <cylinderGeometry args={[0.03, 0.04, 0.34, 5]} />
              <meshStandardMaterial color="#4a3a28" roughness={0.95} />
            </mesh>
          );
        })}
        <mesh position={[0, 0.34, 0]} castShadow><cylinderGeometry args={[0.022, 0.022, 0.66, 6]} /><meshStandardMaterial color="#2a2018" roughness={0.9} /></mesh>
        <mesh position={[0.1, 0.58, 0]} castShadow><boxGeometry args={[0.18, 0.13, 0.02]} /><meshStandardMaterial color="#1a1a1a" side={THREE.DoubleSide} roughness={0.6} /></mesh>
      </group>
    );
  } else if (site.subtype === 'ford') {
    // A short jetty with two pilings and a moored skiff.
    body = (
      <group>
        <mesh position={[0, 0.08, 0]} castShadow receiveShadow><boxGeometry args={[0.5, 0.05, 0.16]} /><meshStandardMaterial color="#6a553a" roughness={0.9} /></mesh>
        <mesh position={[-0.2, 0.04, 0.12]} castShadow><cylinderGeometry args={[0.025, 0.025, 0.18, 6]} /><meshStandardMaterial color="#4a3a28" roughness={0.92} /></mesh>
        <mesh position={[0.2, 0.04, 0.12]} castShadow><cylinderGeometry args={[0.025, 0.025, 0.18, 6]} /><meshStandardMaterial color="#4a3a28" roughness={0.92} /></mesh>
        <mesh position={[0.3, 0.1, -0.05]} rotation={[0, 0.3, 0]} castShadow><boxGeometry args={[0.34, 0.06, 0.12]} /><meshStandardMaterial color="#5a4a36" roughness={0.85} /></mesh>
      </group>
    );
  } else {
    // Resource — an ore pile + a pick-frame; tint by variant.
    const oreColor = site.variant === 'salt' ? '#e8e4dc'
      : site.variant === 'gold' ? '#d8b13a'
      : site.variant === 'copper' ? '#b5703a'
      : site.variant === 'horse' ? '#7a8a5a'
      : '#6a6a72';   // iron
    body = (
      <group>
        <mesh position={[0, 0.12, 0]} castShadow><coneGeometry args={[0.26, 0.26, 8]} /><meshStandardMaterial color={oreColor} roughness={0.85} metalness={site.variant === 'gold' || site.variant === 'copper' ? 0.4 : 0.1} /></mesh>
        <mesh position={[-0.22, 0.16, 0.06]} rotation={[0, 0, 0.5]} castShadow><cylinderGeometry args={[0.018, 0.018, 0.34, 5]} /><meshStandardMaterial color="#5a4a36" roughness={0.9} /></mesh>
        <mesh position={[-0.28, 0.32, 0.06]} rotation={[0, 0, 1.3]} castShadow><boxGeometry args={[0.16, 0.03, 0.03]} /><meshStandardMaterial color="#7a7a82" roughness={0.6} metalness={0.4} /></mesh>
      </group>
    );
  }
  return (
    <group position={[wx, y, wz]} scale={scale}>
      {disc}
      {body}
      <Html position={[0, 0.8, 0]} center distanceFactor={12} zIndexRange={[8, 0]} style={{ pointerEvents: 'none' }}>
        <div style={{
          background: 'rgba(28, 18, 10, 0.8)', border: `1px solid ${color}`, borderRadius: 'var(--tkm-radius-xs)',
          padding: '1px 6px', color: '#e8d4a0', fontFamily: '"Ma Shan Zheng", "Songti SC", serif',
          fontSize: '10.5px', whiteSpace: 'nowrap',
        }}>{site.subtype === 'bandit' ? '🏴' : site.subtype === 'ford' ? '⛵' : '⛏'} {pickName(site.name, lang)}</div>
      </Html>
    </group>
  );
}

export function WildSites3D({ onSiteClick }: { onSiteClick: (siteId: string) => void }) {
  const sites = useGameStore((s) => s.sites);
  const forces = useGameStore((s) => s.forces);
  return (
    <group>
      {Object.values(sites).map((site) => {
        const color = site.ownerForceId
          ? (forces[site.ownerForceId]?.color ?? '#5a4530')
          : site.subtype === 'bandit' ? '#7a2a22' : '#6a6250';
        return <WildSite3D key={site.id} site={site} color={color} onClick={() => onSiteClick(site.id)} />;
      })}
    </group>
  );
}

/* ─── 名所 — legendary scenic sites (訪賢尋寶) ───────────────────────── */
export function ScenicSites3D({ onScenicClick }: { onScenicClick: (siteId: string) => void }) {
  const scenicLooted = useGameStore((s) => s.scenicLooted);
  const lang = useLanguage();
  const sites = useMemo(() => SCENIC_SITES.map((s) => {
    const [px, py] = geoToPixel(s.coords.lon, s.coords.lat);
    const [wx, wz] = pxToWorld(px, py);
    return { id: s.id, zh: pickName(s.name, lang), wx, wz };
  }), [lang]);
  const scale = PIXEL_TO_WORLD * 50 * 0.45 * MARKER_SCALE;
  return (
    <group>
      {sites.map((s) => {
        const y = sampleTerrainHeight(s.wx, s.wz);
        const fresh = !scenicLooted[s.id];
        return (
          <group key={s.id} position={[s.wx, y, s.wz]} scale={scale}>
            <mesh
              position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}
              onClick={(e) => { e.stopPropagation(); onScenicClick(s.id); }}
              onPointerOver={(e) => { e.stopPropagation(); document.body.style.cursor = 'pointer'; }}
              onPointerOut={() => { document.body.style.cursor = ''; }}
            >
              <circleGeometry args={[0.5, 18]} />
              <meshBasicMaterial color="#c9a23c" transparent opacity={0.3} />
            </mesh>
            {/* A thatched scholar's pavilion (草廬) */}
            <mesh position={[0, 0.14, 0]} castShadow><boxGeometry args={[0.34, 0.22, 0.3]} /><meshStandardMaterial color="#caa878" roughness={0.9} /></mesh>
            <mesh position={[0, 0.3, 0]} castShadow><coneGeometry args={[0.3, 0.18, 4]} /><meshStandardMaterial color="#9a7b4a" roughness={0.95} /></mesh>
            {/* A 賢 banner — gold pole + flag */}
            <mesh position={[0.22, 0.3, 0.16]} castShadow><cylinderGeometry args={[0.014, 0.014, 0.4, 6]} /><meshStandardMaterial color="#6a553a" roughness={0.85} /></mesh>
            <mesh position={[0.3, 0.42, 0.16]} castShadow><boxGeometry args={[0.14, 0.1, 0.015]} /><meshStandardMaterial color="#c9a23c" side={THREE.DoubleSide} roughness={0.6} /></mesh>
            {/* A soft glow while there's still something to find */}
            {fresh && (
              <mesh position={[0, 0.5, 0]}>
                <sphereGeometry args={[0.06, 8, 6]} />
                <meshBasicMaterial color="#f0e08a" transparent opacity={0.7} />
              </mesh>
            )}
            <Html position={[0, 0.7, 0]} center distanceFactor={12} zIndexRange={[8, 0]} style={{ pointerEvents: 'none' }}>
              <div style={{
                background: 'rgba(28, 18, 10, 0.8)', border: '1px solid #c9a23c', borderRadius: 'var(--tkm-radius-xs)',
                padding: '1px 6px', color: '#f0d89a', fontFamily: '"Ma Shan Zheng", "Songti SC", serif',
                fontSize: '10.5px', whiteSpace: 'nowrap',
              }}>⛰ {s.zh}</div>
            </Html>
          </group>
        );
      })}
    </group>
  );
}

