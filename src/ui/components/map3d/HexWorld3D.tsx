/* ⬡ 棋盤世界 — the hex-prism quilt: canonical-lattice tiles, progressive
 * warm-up cache, per-tile ownership/paint/scar colouring and the ground
 * click/hover contract. Split out of StrategicMap3D.tsx (2026-07, batch 3);
 * pure mechanical move. */
import { useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { Html } from '@react-three/drei';
import { useGameStore } from '../../../game/state/store';
import type { City, Force } from '../../../game/types';
import { cityPos } from '../../../game/data/cityGeo';
import { generateTerritories, terrainRoute } from '../../../game/data/territories';
import { PROVINCE_BY_CITY } from '../../../game/data/provinces';
import { seasonStampOf } from '../../../game/systems/hexPaint';
import { HEX_R as GEO_HEX_R, hexAt as geoHexAt, battleGroundAt } from '../../../game/data/geography';
import { useLanguage, useT, pickName } from '../../i18n';
import { IS_MOBILE, PIXEL_TO_WORLD, MAP_W, MAP_D, sampleTerrainHeight } from './shared';

/* ─── ⬡ 棋盤世界 — experimental hex-tile world terrain ──────────────────
   The whole strategic map rendered as the same hex-prism quilt the battle
   board and city hinterland use — one visual language from world to battle.
   Each hex samples the REAL geography (battleGroundAt) for its kind and the
   SAME height function the entities already stand on (sampleTerrainHeight),
   so cities/armies/forts sit perfectly without touching any of them. Sea
   hexes are skipped — the animated Ocean shows through. Toggleable; the
   painted scroll map stays as the default/backup. */

export type HexWorldTile = { x: number; z: number; topY: number; kind: string; c: number; r: number };

// P1 統一格網 — the quilt IS the canonical lattice (geography.ts): the
// board you see is the board battles are cut from, and armies/cities sit
// on its cell centres. ONE logical grid on every device (~12k cells).
export const HEXW_R = GEO_HEX_R * PIXEL_TO_WORLD;    // canonical radius in world units
const HEXW_COL = 1.5 * HEXW_R;
export const HEXW_ROW = Math.sqrt(3) * HEXW_R;
export const HEXWORLD_COLOR: Record<string, string> = {
  river: '#2c5882', lake: '#27607f', riverbank: '#8a8a5e',
  mountain: '#6f5e4d', hill: '#7c7250', plain: '#5f7a42',
};
// Generated once per session — ~60k geography samples are far too slow per
// render, and even one synchronous build hitches the first toggle. The cache
// builds COLUMN-CHUNKED so the title screen's asset warmer can grind it out
// during idle time before the player ever opens the map.
let HEXWORLD_CACHE: HexWorldTile[] | null = null;
const hexWarmPartial: HexWorldTile[] = [];
let hexWarmCol = 0;
function buildHexColumn(c: number, out: HexWorldTile[]): boolean {
  const x = -MAP_W / 2 + c * HEXW_COL;
  if (x > MAP_W / 2) return false;
  for (let r = 0; ; r++) {
    const z = -MAP_D / 2 + r * HEXW_ROW + (c & 1 ? HEXW_ROW / 2 : 0);
    if (z > MAP_D / 2) break;
    const px = (x + MAP_W / 2) / PIXEL_TO_WORLD;
    const py = (z + MAP_D / 2) / PIXEL_TO_WORLD;
    const kind = battleGroundAt(px, py);
    if (kind === 'sea') continue; // let the living ocean show through
    const water = kind === 'river' || kind === 'lake';
    const topY = water ? 0.012 : Math.max(0.05, sampleTerrainHeight(x, z));
    out.push({ x, z, topY, kind, c, r });
  }
  return true;
}
/** Build a slice of the hex world; true once the whole quilt is cached. */
export function warmHexWorldTiles(cols = 10): boolean {
  if (HEXWORLD_CACHE) return true;
  for (let i = 0; i < cols; i++) {
    if (!buildHexColumn(hexWarmCol, hexWarmPartial)) {
      HEXWORLD_CACHE = hexWarmPartial;
      return true;
    }
    hexWarmCol++;
  }
  return false;
}
export function buildHexWorldTiles(): HexWorldTile[] {
  while (!warmHexWorldTiles(64)) { /* finish synchronously if still cold */ }
  return HEXWORLD_CACHE!;
}

/** The hex quilt as one InstancedMesh — matrices are written once (tiles never
 *  move), and ownership/season changes only rewrite the instanceColor buffer,
 *  so a conquest recolours ~22k prisms without touching the scene graph. */
export function HexQuilt({ tiles, colors }: { tiles: HexWorldTile[]; colors: string[] }) {
  const meshRef = useRef<THREE.InstancedMesh>(null!);

  useEffect(() => {
    const mesh = meshRef.current;
    if (!mesh) return;
    const m = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    // 手機減負 — flat discs lie ON the terrain instead of extruded prisms:
    // 6× fewer triangles, or the fine lattice OOM-kills the WKWebView GPU
    // process (iPhone context-loss lesson: heavy GPU features need their
    // own mobile gate).
    if (IS_MOBILE) q.setFromAxisAngle(new THREE.Vector3(1, 0, 0), -Math.PI / 2);
    const pos = new THREE.Vector3();
    const scl = new THREE.Vector3();
    tiles.forEach((t, i) => {
      if (IS_MOBILE) {
        pos.set(t.x, t.topY + 0.012, t.z);
        scl.set(HEXW_R * 0.995, HEXW_R * 0.995, 1);
      } else {
        pos.set(t.x, (t.topY - 0.3) / 2, t.z);
        scl.set(HEXW_R * 0.995, t.topY + 0.3, HEXW_R * 0.995);
      }
      mesh.setMatrixAt(i, m.compose(pos, q, scl));
    });
    mesh.instanceMatrix.needsUpdate = true;
    mesh.computeBoundingSphere();
  }, [tiles]);

  useEffect(() => {
    const mesh = meshRef.current;
    if (!mesh) return;
    const c = new THREE.Color();
    for (let i = 0; i < colors.length; i++) mesh.setColorAt(i, c.set(colors[i]));
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  }, [colors]);

  return (
    <instancedMesh
      ref={meshRef}
      args={[undefined, undefined, Math.max(1, tiles.length)]}
      receiveShadow
      frustumCulled={false}
    >
      {/* thetaStart π/6 (cylinder) / 0 (circle) points the hex vertices
          along ±x — the flat-top orientation our 1.5R/√3R column layout
          tessellates with. Without it the hexes sit 30° off and leave
          diagonal gaps. Mobile renders flat discs (see matrix setup). */}
      {IS_MOBILE
        ? <circleGeometry args={[1, 6]} />
        : <cylinderGeometry args={[1, 1, 1, 6, 1, false, Math.PI / 6]} />}
      <meshStandardMaterial roughness={0.93} metalness={0.02} />
    </instancedMesh>
  );
}

export function HexWorldTerrain({ winter, cities, forces, territoryOwnership, hexPaint, worldScars, fogCityIds, onGroundClick }: {
  winter: boolean;
  cities: Record<string, City>;
  forces: Record<string, Force>;
  territoryOwnership: Record<string, string | null>;
  /** 塗色 — walked-cell paint overriding the nearest-city tint. */
  hexPaint: Record<string, { f: string; t: number }>;
  /** 戰場烙印 — battle-scarred hexes (焦土/斷渡) char the quilt until healed. */
  worldScars?: Record<string, { kind: string; t: number }>;
  /** 戰爭迷霧 — when set, tiles seeded by an out-of-view city dim. */
  fogCityIds?: Set<string> | null;
  onGroundClick?: (px: number, py: number) => void;
}) {
  // 漸進鋪盤 — if the idle warmer hasn't finished the quilt, grind it in
  // frame-sized chunks and reveal columns as they land (west→east sweep)
  // instead of freezing the main thread for the whole 48k-cell build.
  const [tiles, setTiles] = useState<HexWorldTile[]>(() => (warmHexWorldTiles(0), HEXWORLD_CACHE ?? []));
  useEffect(() => {
    if (HEXWORLD_CACHE) { setTiles(HEXWORLD_CACHE); return; }
    let raf = 0;
    let chunk = 0;
    const grind = () => {
      const done = warmHexWorldTiles(24);
      chunk++;
      if (done) setTiles(buildHexWorldTiles());
      else {
        if (chunk % 4 === 0) setTiles([...hexWarmPartial]); // reveal every ~96 cols
        raf = requestAnimationFrame(grind);
      }
    };
    raf = requestAnimationFrame(grind);
    return () => cancelAnimationFrame(raf);
  }, []);

  // Shared (c,r) → tile-index lookup for neighbours, roads and hover.
  const tileIndex = useMemo(() => {
    const m = new Map<string, number>();
    tiles.forEach((t, i) => m.set(`${t.c},${t.r}`, i));
    return m;
  }, [tiles]);

  // 道路地塊 — walk every adjacent-city pair's REAL march route and stamp the
  // hexes under it as road, so the network armies actually travel is the one
  // you see paved into the quilt.
  const roadTiles = useMemo(() => {
    const set = new Set<number>();
    const seen = new Set<string>();
    const stepPx = (HEXW_ROW / PIXEL_TO_WORLD) * 0.5;
    for (const a of Object.values(cities)) {
      for (const adjId of a.adjacentCityIds ?? []) {
        const b = cities[adjId];
        if (!b) continue;
        const key = a.id < adjId ? a.id + adjId : adjId + a.id;
        if (seen.has(key)) continue;
        seen.add(key);
        const pa = cityPos(a);
        const pb = cityPos(b);
        const route = terrainRoute(pa.x, pa.y, pb.x, pb.y);
        for (let s = 0; s < route.length - 1; s++) {
          const p0 = route[s], p1 = route[s + 1];
          const steps = Math.max(1, Math.ceil(Math.hypot(p1.x - p0.x, p1.y - p0.y) / stepPx));
          for (let k = 0; k <= steps; k++) {
            const px = p0.x + (p1.x - p0.x) * (k / steps);
            const py = p0.y + (p1.y - p0.y) * (k / steps);
            const h = geoHexAt(px, py);
            const i = tileIndex.get(`${h.col},${h.row}`);
            if (i !== undefined) set.add(i);
          }
        }
      }
    }
    return set;
  }, [tiles, tileIndex, cities]);

  // 領土歸屬 — each land hex takes its nearest territory centroid's owner
  // (override ?? parent city's lord), the SAME resolution the painted
  // territory layer uses, so both map styles always agree on borders.
  const { baseOwner, tileCity } = useMemo(() => {
    const seeds = generateTerritories(Object.values(cities)).map((t) => ({
      x: t.coords.x,
      y: t.coords.y,
      owner: territoryOwnership[t.id] ?? cities[t.parentCityId]?.ownerForceId ?? null,
      province: PROVINCE_BY_CITY[t.parentCityId] ?? null,
      city: t.parentCityId,
    }));
    const owners: Array<string | null> = [];
    const provinces: Array<string | null> = [];
    const citySeeds: Array<string | null> = [];
    for (const t of tiles) {
      if (t.kind === 'river' || t.kind === 'lake') { owners.push(null); provinces.push(null); citySeeds.push(null); continue; }
      const px = (t.x + MAP_W / 2) / PIXEL_TO_WORLD;
      const py = (t.z + MAP_D / 2) / PIXEL_TO_WORLD;
      let best: string | null = null;
      let bestProv: string | null = null;
      let bestCity: string | null = null;
      let bestD = Infinity;
      for (const s of seeds) {
        const d = (s.x - px) * (s.x - px) + (s.y - py) * (s.y - py);
        if (d < bestD) { bestD = d; best = s.owner; bestProv = s.province; bestCity = s.city; }
      }
      owners.push(best);
      provinces.push(bestProv);
      citySeeds.push(bestCity);
    }
    void provinces; // province seams retired with the flat realm wash
    return { baseOwner: owners, tileCity: citySeeds };
  }, [tiles, cities, territoryOwnership]);

  // 塗色 — a walked cell wears the walker's colour (RTK-XIV trail). Split
  // from the nearest-seed scan above so the LIVE day-flow painting (hexPaint
  // changes every few ticks) only pays this cheap overlay pass, never the
  // 48k×seeds ownership scan.
  const tileOwner = useMemo(() => tiles.map((t, i) => {
    if (t.kind === 'river' || t.kind === 'lake') return baseOwner[i];
    const painted = hexPaint[`${t.c},${t.r}`];
    return painted && forces[painted.f] ? painted.f : baseOwner[i];
  }), [tiles, baseOwner, hexPaint, forces]);

  // 州界 — province seams (decals sink into the prisms, so the quilt carves
  // its own): a land tile whose neighbour belongs to a different province
  // takes a subtle charcoal seam (realm borders win when both apply).
  // 國界 — an owned hex bordering a DIFFERENT owner (or unowned wilderness)
  // is a frontier tile: it gets a deeper, more saturated realm colour so the
  // borders cut sharply. Sea/river neighbours don't count (coasts and rivers
  // already outline themselves).
  const tileBorder = useMemo(() => {
    const isWater = (k: string) => k === 'river' || k === 'lake';
    return tiles.map((t, i) => {
      if (isWater(t.kind)) return false;
      const own = tileOwner[i];
      if (!own) return false;
      // Flat-top hex neighbours; odd columns are shifted +half a row.
      const nbs = t.c & 1
        ? [[0, -1], [0, 1], [-1, 0], [1, 0], [-1, 1], [1, 1]]
        : [[0, -1], [0, 1], [-1, 0], [1, 0], [-1, -1], [1, -1]];
      for (const [dc, dr] of nbs) {
        const j = tileIndex.get(`${t.c + dc},${t.r + dr}`);
        if (j === undefined) continue;          // sea — no edge
        if (isWater(tiles[j].kind)) continue;   // river — no edge
        if (tileOwner[j] !== own) return true;
      }
      return false;
    });
  }, [tiles, tileIndex, tileOwner]);

  // 前線餘燼 — cells walked THIS season by a force that isn't the ground's
  // base owner: the active incursion corridor. Blended into the tile colour
  // as a scorched ember cast, so「哪裡正在拉鋸」reads at a glance.
  const dateNow = useGameStore((st) => st.date);
  const tileEmber = useMemo(() => {
    const nowStamp = seasonStampOf(dateNow.year, dateNow.season);
    return tiles.map((t, i) => {
      if (t.kind === 'river' || t.kind === 'lake') return false;
      const painted = hexPaint[`${t.c},${t.r}`];
      return !!painted && painted.t >= nowStamp && painted.f !== baseOwner[i];
    });
  }, [tiles, hexPaint, baseOwner, dateNow]);

  // 戰場烙印 — torched hexes read charred; a burned crossing greys the water.
  const tileScar = useMemo(() => tiles.map((t): false | 'char' | 'broken' => {
    const sc = worldScars?.[`${t.c},${t.r}`]?.kind;
    if (t.kind === 'river' || t.kind === 'lake') return sc === 'bridge-broken' ? 'broken' : false;
    return sc === 'scorched' ? 'char' : false;
  }), [tiles, worldScars]);

  // 國界墨線 — a crisp ink stroke along every edge where ownership flips
  // (owner vs different owner / wilderness). One LineSegments for the whole
  // realm map; rebuilt only when ownership actually changes.
  const borderGeom = useMemo(() => {
    const isWater = (k: string) => k === 'river' || k === 'lake';
    const pts: number[] = [];
    const HALF = HEXW_R * 0.49;   // side length = circumradius; slight inset
    for (let i = 0; i < tiles.length; i++) {
      const t = tiles[i];
      if (isWater(t.kind)) continue;
      const own = tileOwner[i];
      const nbs = t.c & 1
        ? [[0, -1], [0, 1], [-1, 0], [1, 0], [-1, 1], [1, 1]]
        : [[0, -1], [0, 1], [-1, 0], [1, 0], [-1, -1], [1, -1]];
      for (const [dc, dr] of nbs) {
        const j = tileIndex.get(`${t.c + dc},${t.r + dr}`);
        if (j === undefined || j <= i) continue;       // dedupe pairs
        const n = tiles[j];
        if (isWater(n.kind)) continue;
        const other = tileOwner[j];
        if (other === own || (!own && !other)) continue;
        const mx = (t.x + n.x) / 2, mz = (t.z + n.z) / 2;
        let dx = n.x - t.x, dz = n.z - t.z;
        const len = Math.hypot(dx, dz) || 1;
        dx /= len; dz /= len;
        const y = Math.max(t.topY, n.topY) + 0.02;
        pts.push(mx - dz * HALF, y, mz + dx * HALF, mx + dz * HALF, y, mz - dx * HALF);
      }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
    return g;
  }, [tiles, tileIndex, tileOwner]);
  useEffect(() => () => { borderGeom.dispose(); }, [borderGeom]);

  // Per-tile colour — terrain base blended toward the owning force's colour
  // (deeper on frontier tiles); seasonal: snow-dusted land in winter.
  const colors = useMemo(() => tiles.map((t, i) => {
    const water = t.kind === 'river' || t.kind === 'lake';
    const ownerId = tileOwner[i];
    const owner = ownerId ? (forces[ownerId]?.color ?? null) : null;
    const border = tileBorder[i];
    if (winter) {
      const roadW = !water && roadTiles.has(i);
      const snow = water ? '#bcd2dc' : roadW ? '#a89878' : t.kind === 'mountain' ? '#cfd4d8' : '#c9cfc3';
      if (!owner || water || roadW) return snow; // packed dirt shows through the snow
      const col = new THREE.Color(snow).lerp(new THREE.Color(owner), border ? 0.55 : 0.4);
      if (border) col.offsetHSL(0, 0, -0.06);
      if (tileEmber[i]) col.lerp(new THREE.Color('#8a3a1a'), 0.24);
      if (tileScar[i] === 'char') col.lerp(new THREE.Color('#2e2620'), 0.5); // char shows through the snow
      if (tileScar[i] === 'broken') col.lerp(new THREE.Color('#2c3540'), 0.5);
      return `#${col.getHexString()}`;
    }
    const road = !water && roadTiles.has(i);
    const base = road ? '#9a8358' : (HEXWORLD_COLOR[t.kind] ?? HEXWORLD_COLOR.plain);
    const col = new THREE.Color(base);
    // 地塊質感 — match the painted map's PBR bake on the quilt: every land
    // tile takes a mottle + relief shading off its north neighbour, and the
    // high ranges a cool atmospheric cast.
    if (!road && !water) {
      const mottle = Math.abs(Math.sin(t.x * 9.1 + t.z * 4.7)) * 0.06 - 0.03; // 平涂:斑驳减半
      const ni = tileIndex.get(`${t.c},${t.r - 1}`);
      const northTop = ni !== undefined ? tiles[ni].topY : t.topY;
      const shade = Math.max(-0.1, Math.min(0.1, (t.topY - northTop) * 0.6));
      col.offsetHSL(0, 0, mottle + shade);
      if (t.topY > 0.55) col.lerp(new THREE.Color('#8a98aa'), Math.min(0.26, (t.topY - 0.55) * 0.4));
    }
    if (owner && !water) {
      // Roads take only a light realm wash so the network stays readable.
      // ROTK-XIV 平涂 — a deep, even realm wash; terrain only ghosts through.
      col.lerp(new THREE.Color(owner), road ? 0.18 : border ? 0.72 : 0.55);
      if (border && !road) col.offsetHSL(0, 0.05, -0.08);
    }
    // 前線餘燼 — this season's incursion corridor smoulders warm.
    if (tileEmber[i] && !water) col.lerp(new THREE.Color('#8a3a1a'), 0.3);
    // 戰場烙印 — torched ground stays charred until the land heals.
    if (tileScar[i] === 'char' && !water) col.lerp(new THREE.Color('#2e2620'), 0.55);
    // 斷渡 — a burned crossing dims the water it once spanned.
    if (tileScar[i] === 'broken' && water) col.lerp(new THREE.Color('#2c3540'), 0.5);
    // 戰爭迷霧 — ground seeded by a city you can't see fades toward dusk.
    if (fogCityIds && !water && tileCity[i] && !fogCityIds.has(tileCity[i]!)) col.offsetHSL(0, -0.12, -0.13);
    return `#${col.getHexString()}`;
  }), [tiles, winter, tileOwner, tileBorder, tileEmber, tileScar, roadTiles, forces, fogCityIds, tileCity]);

  // 地塊資訊 — hover (desktop) names the tile: terrain, road, owning realm.
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);
  const hoverTile = hoverIdx != null ? tiles[hoverIdx] : null;
  const lang = useLanguage();
  const t = useT();
  const KIND_ZH: Record<string, string> = lang === 'en'
    ? { plain: 'Plain', hill: 'Hills', mountain: 'Mountain', river: 'River', lake: 'Lake', riverbank: 'Riverbank' }
    : { plain: '平原', hill: '丘陵', mountain: '山地', river: '大河', lake: '湖泊', riverbank: '河岸' };

  return (
    <group>
      {/* Invisible click/hover-catcher — same click contract as MapTerrain. */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0, 0]}
        onClick={(e) => {
          e.stopPropagation();
          // Touch has no hover — a tap doubles as the tile inspector
          // (auto-dismisses; doesn't interfere with march-to-cell orders).
          if (IS_MOBILE) {
            const hpt = geoHexAt((e.point.x + MAP_W / 2) / PIXEL_TO_WORLD, (e.point.z + MAP_D / 2) / PIXEL_TO_WORLD);
            const c = hpt.col, r = hpt.row;
            const i = tileIndex.get(`${c},${r}`) ?? null;
            setHoverIdx(i);
            if (i != null) window.setTimeout(() => setHoverIdx((cur) => (cur === i ? null : cur)), 2600);
          }
          if (!onGroundClick) return;
          const px = (e.point.x + MAP_W / 2) / PIXEL_TO_WORLD;
          const py = (e.point.z + MAP_D / 2) / PIXEL_TO_WORLD;
          onGroundClick(px, py);
        }}
        onPointerMove={IS_MOBILE ? undefined : (e) => {
          const hpt2 = geoHexAt((e.point.x + MAP_W / 2) / PIXEL_TO_WORLD, (e.point.z + MAP_D / 2) / PIXEL_TO_WORLD);
          const c = hpt2.col, r = hpt2.row;
          const i = tileIndex.get(`${c},${r}`) ?? null;
          if (i !== hoverIdx) setHoverIdx(i);
        }}
        onPointerOut={IS_MOBILE ? undefined : () => setHoverIdx(null)}
      >
        <planeGeometry args={[MAP_W, MAP_D]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>
      <HexQuilt tiles={tiles} colors={colors} />
      {/* 國界墨線 — the realm outline reads at a glance, RTK-XIV style. */}
      <lineSegments geometry={borderGeom} frustumCulled={false} raycast={() => null}>
        <lineBasicMaterial color="#161009" transparent opacity={0.55} depthWrite={false} />
      </lineSegments>
      {hoverTile && (() => {
        const ownerId = tileOwner[hoverIdx!];
        const ownerForce = ownerId ? forces[ownerId] : null;
        const ownerName = ownerForce ? pickName(ownerForce.name, lang) : null;
        const road = roadTiles.has(hoverIdx!);
        return (
          <Html position={[hoverTile.x, hoverTile.topY + 0.35, hoverTile.z]} center distanceFactor={9} zIndexRange={[30, 20]} style={{ pointerEvents: 'none' }}>
            <div style={{
              background: 'rgba(20, 14, 8, 0.88)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 'var(--tkm-radius)',
              padding: '2px 7px', fontFamily: 'var(--tkm-font-body)', fontSize: '11px',
              color: '#e8d9b0', whiteSpace: 'nowrap', letterSpacing: '0.5px',
            }}>
              {KIND_ZH[hoverTile.kind] ?? hoverTile.kind}{road ? t(' · 道', ' · Road') : ''}{tileScar[hoverIdx!] === 'char' ? t(' · 焦土', ' · Scorched') : tileScar[hoverIdx!] === 'broken' ? t(' · 斷渡', ' · Crossing down') : ''}
              {ownerName ? <span style={{ color: forces[ownerId!]?.color ?? '#c0a878' }}> · {ownerName}{t('領', '')}</span> : t(' · 無主之地', ' · Unclaimed')}
            </div>
          </Html>
        );
      })()}
    </group>
  );
}

