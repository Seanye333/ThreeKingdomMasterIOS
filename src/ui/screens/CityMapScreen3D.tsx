import { useMemo, useState, useEffect, useRef, useContext } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import { OrbitControls, Html, Instances, Instance } from '@react-three/drei';
import * as THREE from 'three';
import { RENDER_HI } from '../renderQuality';
import { useGLRecovery } from '../hooks/useGLRecovery';
import { FrameRateWatch } from '../components/FrameRateWatch';
import { SelectionRing3D } from '../components/SelectionRing3D';
import { useGameStore } from '../../game/state/store';
import {
  DEFENSE_BUILDINGS,
  type DefenseBuildingId,
  aggregateSlotEffects,
} from '../../game/data/defenseBuildings';
import { previewBattlefield } from '../../game/systems/tacticalSetup';
import { battleGroundAt, geoToPixel } from '../../game/data/geography';
import { FACILITY_DEFS, type FacilityKind } from '../../game/types';
import { citySize, cityMeetsSize, CITY_SIZES_BY_ID } from '../../game/systems/citySize';
import { COMMAND_DEFS, meetsMinSize, previewCommandGain } from '../../game/systems/commands';
import { commandFitMultiplier } from '../../game/systems/traitEffects';
import { appointmentBonusFor } from '../../game/systems/appointmentEffects';
import { tickCityEconomy } from '../../game/systems/economy';
import { buyQuote, sellQuote, foodRate, marketOutlook, borderTariff, buyHorses, sellHorses, buyIron, sellIron } from '../../game/systems/market';
import { buildingBonuses } from '../../game/systems/buildings';
import { CITY_SPECIALTY } from '../../game/data/specialties';
import { getRelation } from '../../game/types/diplomacy';
import { useMarketShock } from '../hooks/useMarketShock';
import type { WeatherKind } from '../../game/systems/weather';
import type { InternalAffairsType, CommandType, Officer } from '../../game/types';
import { OfficerPicker } from '../components/OfficerPicker';
import { OfficerFigure3D, Residence3D, StreetEncounterFigure, Watchman3D, Refugee3D, MourningBanner3D, FestivalPennants3D, SeasonCtx, NightCtx, InspectCtx, type InspectInfo } from './city3d/Folk3D';
import { LocatorMap } from '../components/LocatorMap';
import { IntroDive } from '../components/IntroDive';
import { cityViewWindow } from '../viewWindow';
import { BUILDING_DEFS, BUILDING_DEFS_BY_ID, BUILDING_CATEGORY, BUILDING_CATEGORY_LABEL, BUILDING_PREREQ, BUILDING_MIN_SIZE, buildingGroupSynergy } from '../../game/data/buildings';
import { cityAffinity, citySpecialty, type SpecialtyDef } from '../../game/data/specialties';
import { startCityAmbience, stopCityAmbience, playSfx } from '../../game/systems/sound';
import type { EntityId, BuildingId, City } from '../../game/types';
import { SEASON_LABEL, type Season } from '../../game/types/common';
import { useLanguage, pickName, useT } from '../i18n';
// Reuse the polished 3D primitives from the tactical battle scene so the
// city map matches its visual fidelity — terrain art, lighting, walls.
import {
  hexWorld,
  HEX_COL_STEP,
  HEX_ROW_STEP,
  HexTile,
  InstancedTilePrisms,
  DefenseStructure,
} from './TacticalBattleScreen3D';
import { INSIDE_BUILDING_DEF, InsideBuilding3D, WallSegment3D, innerWallCells, InnerWallSeg3D, InnerGate3D, CityGate3D, CornerTower3D, Moat3D, canalRow, CanalBridge3D, cityBuildPlots, FoundationPlot3D, GhostBuilding3D, ConstructionSite3D, Smoke3D } from './city3d/Architecture3D';

/** Coarse-pointer / small-screen device — drop pixel ratio and skip the
 *  post-processing pass so phones keep a playable framerate. */
const IS_MOBILE = typeof window !== 'undefined'
  && (window.matchMedia?.('(pointer: coarse)')?.matches || window.innerWidth < 700);

/**
 * 3D version of CityMapScreen — uses the same hex tile / lighting /
 * structure primitives as the live tactical battle, so what you see
 * planning defenses is what you get when sieged.
 */

// (城郭建築 — walls/gates/towers/moat/canal, build plots, ghost/construction
//  markers, InsideBuilding3D and the shared Banner3D/useFlutter live in
//  city3d/Architecture3D.tsx.)

import {
  Barracks3D,
  BellTower3D,
  Birds3D,
  Brazier3D,
  Cart3D,
  CommandActivity3D,
  Dock3D,
  DrumTower3D,
  Dwelling,
  Farmland3D,
  FlowerBed3D,
  Garden3D,
  GardenTree3D,
  GarrisonBanners3D,
  GovernmentHall3D,
  GrassTufts3D,
  Lantern3D,
  LilyPads3D,
  MarketStall3D,
  MovingCart3D,
  NO_BUILD_TERRAIN,
  Pagoda3D,
  Paifang3D,
  Reed3D,
  RuinsOverlay,
  SEASON_LIGHT,
  SmallBoat3D,
  SpecialtyProp3D,
  StoneBridge3D,
  StonePath3D,
  Tavern3D,
  Villager3D,
  WILDERNESS_TERRAIN,
  Walker3D,
  WallBanner3D,
  WaterGate3D,
  Well3D,
  dwellingHash,
} from './city3d/Scenery3D';
import type {
  CityActivity,
  CityFigures,
  CityStats,
  LandmarkInfo,
  SeasonKey,
} from './city3d/Scenery3D';

function CityDwellings3D({ preview, cityWallCol, occupied, bannerColor, stats, grand, landmarkInfo, weatherKind, ruined, isCapital, specialty, troops, activity, plagued, season, figures, night, encounter, onEncounterClick, household }: {
  preview: ReturnType<typeof previewBattlefield>;
  cityWallCol: number;
  occupied: Set<string>;
  bannerColor: string;
  stats: CityStats;
  grand: boolean;
  landmarkInfo: LandmarkInfo;
  weatherKind: WeatherKind;
  ruined: boolean;
  isCapital: boolean;
  specialty: SpecialtyDef | null;
  troops: number;
  activity: CityActivity;
  /** 疫病 — city was struck by plague last season (white banners, empty lanes). */
  plagued: boolean;
  season: SeasonKey;
  figures: CityFigures;
  /** 下旬月夜 — lanes empty out, the night watchman walks the avenue. */
  night: boolean;
  encounter: { kind: 'merchant' | 'knight' | 'soothsayer' | 'storyteller' } | null;
  onEncounterClick: () => void;
  household: { lordZh: string; spouses: string[]; kids: Array<{ nameZh: string; age: number; heir: boolean; female: boolean; comingSoon: boolean }> } | null;
}) {
  const t = useT();
  const inspect = useContext(InspectCtx);
  // The market grows with commerce — a sleepy 2-stall corner at low trade,
  // a packed bazaar when business booms.
  const market = useMemo(() => {
    const W = preview.width, H = preview.height;
    const out: Array<{ x: number; z: number; seed: number; key: string }> = [];
    const baseCol = Math.min(W - 2, Math.round(cityWallCol * 0.62));
    const baseRow = Math.max(1, Math.round(H * 0.6));
    const OFFSETS = [[0, 0], [1, 0], [0, 1], [1, 1], [2, 0], [2, 1], [0, 2], [1, 2], [2, 2]] as const;
    const count = Math.max(2, Math.min(OFFSETS.length, 2 + Math.round(stats.fCommerce * 7)));
    for (const [dc, dr] of OFFSETS.slice(0, count)) {
      const col = baseCol + dc, row = baseRow + dr;
      if (col < 1 || col >= W - 1 || row < 1 || row >= H - 1) continue;
      const key = `${col},${row}`;
      if (occupied.has(key)) continue;
      const [x, z] = hexWorld(col, row);
      out.push({ x, z, seed: dwellingHash(col, row), key });
    }
    return out;
  }, [preview.width, preview.height, cityWallCol, occupied, stats.fCommerce]);

  // Twin landmark towers in the back corners — 鼓樓 left, 寶塔 right. Their
  // footprints (and a one-tile margin) are kept clear of houses.
  const landmarks = useMemo(() => {
    const W = preview.width, H = preview.height;
    const pagodaCell = { col: Math.max(3, W - 4), row: 3 };
    const drumCell = { col: 3, row: 3 };
    // Bell tower mirrors the drum tower, front-right (row H-4 has no plots).
    const bellCell = { col: Math.max(3, W - 4), row: Math.max(2, H - 4) };
    // Garden near the gate, in the rows below the foundation grid (rows ≥ H-3
    // never hold a plot), so it never overlaps a player building.
    const gateCol = Math.floor(W / 2);
    const gardenCell = { col: Math.max(2, gateCol === W - 4 ? gateCol - 4 : gateCol - 3), row: Math.max(2, H - 3) };
    // The 府衙 compound — reserve a 3×3 so stray houses don't sit in its court.
    const hallCell = { col: Math.max(1, Math.round(cityWallCol * 0.42)), row: Math.round(H / 2) };
    // 屯田 farm plot front-right, below the foundation grid.
    const farmCell = { col: Math.max(3, W - 5), row: Math.max(2, H - 3) };
    // 兵營 / 酒樓 flank the entrance avenue, in the plot-free south band.
    const barracksCell = { col: Math.max(2, gateCol - 4), row: Math.max(2, H - 3) };
    const tavernCell = { col: Math.min(W - 2, gateCol + 3), row: Math.max(2, H - 3) };
    const keys = new Set<string>();
    for (const c of [pagodaCell, drumCell, bellCell, gardenCell, hallCell, barracksCell, tavernCell]) {
      for (let dc = -1; dc <= 1; dc++) for (let dr = -1; dr <= 1; dr++) keys.add(`${c.col + dc},${c.row + dr}`);
    }
    for (let dc = -1; dc <= 2; dc++) for (let dr = -1; dr <= 1; dr++) keys.add(`${farmCell.col + dc},${farmCell.row + dr}`);
    // Keep houses off the inner palace wall line in great cities.
    if (grand) for (const c of innerWallCells(W, H).cells) keys.add(`${c.col},${c.row}`);
    // …or off the canal line in lesser cities.
    else { const cr = canalRow(H); for (let c = 1; c <= W - 2; c++) keys.add(`${c},${cr}`); }
    const [px, pz] = hexWorld(pagodaCell.col, pagodaCell.row);
    const [dx, dz] = hexWorld(drumCell.col, drumCell.row);
    const [bx, bz] = hexWorld(bellCell.col, bellCell.row);
    const [gx2, gz2] = hexWorld(gardenCell.col, gardenCell.row);
    const [fx, fz] = hexWorld(farmCell.col, farmCell.row);
    const [barx, barz] = hexWorld(barracksCell.col, barracksCell.row);
    const [tavx, tavz] = hexWorld(tavernCell.col, tavernCell.row);
    return { keys, pagoda: { x: px, z: pz }, drum: { x: dx, z: dz }, bell: { x: bx, z: bz }, garden: { x: gx2, z: gz2 }, farm: { x: fx, z: fz }, barracks: { x: barx, z: barz }, tavern: { x: tavx, z: tavz } };
  }, [preview.width, preview.height, cityWallCol, grand]);

  const { houses, trees, paths, villagers, flowers, avenue, grass, dirt, puddles } = useMemo(() => {
    const houses: Array<{ x: number; z: number; seed: number; key: string }> = [];
    const trees: Array<{ x: number; z: number; seed: number; key: string }> = [];
    const paths: Array<{ x: number; z: number; seed: number; key: string }> = [];
    const villagers: Array<{ x: number; z: number; seed: number; key: string }> = [];
    const flowers: Array<{ x: number; z: number; seed: number; key: string }> = [];
    const avenue: Array<{ x: number; z: number; key: string }> = [];
    const grass: Array<{ x: number; z: number; s: number; r: number; c: string }> = [];
    const dirt: Array<{ x: number; z: number; seed: number; key: string }> = [];
    const puddles: Array<{ x: number; z: number; key: string }> = [];
    const GRASSC = ['#4a7a3a', '#3f6e34', '#56833f', '#5f8a44'];
    const sow = (cx: number, cz: number, seed: number) => {
      const n = 3 + (seed % 3);
      for (let i = 0; i < n && grass.length < 460; i++) {
        const a = seed * 0.7 + i * 2.4;
        grass.push({
          x: cx + Math.cos(a) * 0.42, z: cz + Math.sin(a * 1.3) * 0.42,
          s: 0.7 + ((seed >> i) % 3) * 0.18, r: a, c: GRASSC[(seed + i) % 4],
        });
      }
    };
    const marketKeys = new Set(market.map((m) => m.key));
    // Crowds scale with population — a thronging capital vs a quiet hamlet.
    const villagerCap = Math.round(6 + stats.fPop * 36);
    const W = preview.width, H = preview.height;
    // Main avenue straight in from the south gate — paved, kept clear of houses.
    const gateCol = Math.floor(W / 2);
    const avenueKeys = new Set<string>();
    for (let r = 1; r <= H - 2; r++) avenueKeys.add(`${gateCol},${r}`);
    // A planned street grid: streets run along every 3rd col/row, leaving 2×2
    // block interiors for houses, gardens and the player's foundations.
    for (const tile of preview.tiles) {
      const { col, row } = tile.coord;
      // Strictly inside the perimeter wall ring.
      if (col < 1 || col >= W - 1 || row < 1 || row >= H - 1) continue;
      if (NO_BUILD_TERRAIN.has(tile.terrain as string)) continue;
      const key = `${col},${row}`;
      if (occupied.has(key)) continue; // slots / buildings / foundations
      if (landmarks.keys.has(key)) continue; // pagoda / drum-tower footprints
      const [x, z] = hexWorld(col, row);
      if (avenueKeys.has(key)) { avenue.push({ x, z, key }); continue; } // main road
      if (marketKeys.has(key)) continue;
      const seed = dwellingHash(col, row);
      // Grid streets (paved); foundations live at col%3===2 so never clash.
      if (col % 3 === 0 || row % 3 === 0) {
        if (paths.length < 240) paths.push({ x, z, seed, key });
        continue;
      }
      // Block interior — mostly housing, with garden / townsfolk / flower beds.
      const bucket = seed % 100;
      if (bucket < 60 && houses.length < 64) houses.push({ x, z, seed, key });          // houses
      else if (bucket < 78 && trees.length < 30) { trees.push({ x, z, seed, key }); sow(x, z, seed); } // gardens
      else if (bucket < 90 && villagers.length < villagerCap) { villagers.push({ x, z, seed, key }); sow(x, z, seed); } // townsfolk
      else if (flowers.length < 20) flowers.push({ x, z, seed, key });                  // flower beds
      else {                                                                             // open ground
        sow(x, z, seed);
        const sub = (seed >> 9) % 12;
        if (sub < 2 && dirt.length < 20) dirt.push({ x, z, seed, key });                 // bare earth
        else if (sub === 2 && puddles.length < 10) puddles.push({ x, z, key });          // puddle
      }
    }
    return { houses, trees, paths, villagers, flowers, avenue, grass, dirt, puddles };
  }, [preview, occupied, market, landmarks, stats.fPop]);

  const hall = useMemo(() => {
    const col = Math.max(1, Math.round(cityWallCol * 0.42));
    const row = Math.round(preview.height / 2);
    const [x, z] = hexWorld(col, row);
    return { x, z };
  }, [preview.height, cityWallCol]);

  // A few lanterns flanking the hall + just inside the gate.
  const lanterns = useMemo(() => {
    const W = preview.width, H = preview.height;
    const spots: Array<[number, number]> = [
      [Math.round(cityWallCol * 0.42) - 2, Math.round(H / 2)],
      [Math.round(cityWallCol * 0.42) + 2, Math.round(H / 2)],
      [Math.floor(W / 2), H - 3], // inside the south gate
    ];
    return spots.map(([c, r]) => {
      const cc = Math.max(1, Math.min(W - 2, c));
      const rr = Math.max(1, Math.min(H - 2, r));
      const [x, z] = hexWorld(cc, rr);
      return { x, z, key: `${cc},${rr}` };
    });
  }, [preview.width, preview.height, cityWallCol]);

  // Hero props clustered around the civic centre + market.
  const props = useMemo(() => {
    const braziers = [
      { x: hall.x - 1.8, z: hall.z + 1.8 },
      { x: hall.x + 1.8, z: hall.z + 1.8 },
    ];
    const m0 = market[0];
    const well = m0 ? { x: m0.x - 1.3, z: m0.z + 1.0 } : { x: hall.x + 2.6, z: hall.z + 1.7 };
    const cart = m0 ? { x: m0.x + 1.5, z: m0.z + 0.5, seed: m0.seed >> 1 } : null;
    // Shoppers crowd the stalls in proportion to population — a plague
    // empties the lanes (folk shut their doors and stay in).
    const crowdMul = (plagued ? 0.45 : 1) * (night ? 0.55 : 1);
    const folkCount = Math.max(plagued ? 1 : 2, Math.round((2 + stats.fPop * 8) * crowdMul));
    const folk = market.flatMap((m, i) => [
      { x: m.x + (i % 2 ? 0.72 : -0.72), z: m.z - 0.72, seed: (m.seed >> 2) + i * 7 },
      { x: m.x - 0.5, z: m.z + 0.7, seed: (m.seed >> 4) + i * 13 },
    ]).slice(0, folkCount);
    // 牌坊 archway a few tiles in from the gate, straddling the avenue.
    const avSorted = [...avenue].sort((a, b) => b.z - a.z);
    const paifang = avSorted[2] ?? avSorted[avSorted.length - 1] ?? null;
    // Lanterns lining the main avenue — a loyal, contented city decks every
    // tile in lanterns (張燈結綵); a discontented one barely lights the way.
    const avenueLanterns: Array<{ x: number; z: number }> = [];
    const lanternStride = stats.fLoyalty > 0.66 ? 1 : stats.fLoyalty > 0.33 ? 2 : 3;
    avenue.forEach((a, i) => {
      if (i % lanternStride === 0) {
        avenueLanterns.push({ x: a.x - 0.92, z: a.z });
        avenueLanterns.push({ x: a.x + 0.92, z: a.z });
      }
    });
    // Pedestrians strolling the main avenue — density is the city's pulse:
    // population brings people, commerce brings traders; a bustling
    // market-town street and a hollowed-out frontier town read apart at
    // a glance. High commerce also rolls a second ox-cart (goods moving).
    const avZ = [...avenue].sort((a, b) => a.z - b.z);
    const walkerN = Math.round((2 + stats.fPop * 6 + stats.fCommerce * 6) * crowdMul);
    const walkers: Array<{ ax: number; az: number; bx: number; bz: number; seed: number }> = [];
    for (let i = 0; i + 3 < avZ.length && walkers.length < walkerN; i += 1) {
      const a = avZ[i], b = avZ[i + 3];
      const side = (i % 4 < 2 ? -0.5 : 0.5) + ((i * 37) % 5) * 0.08;
      walkers.push({ ax: a.x + side, az: a.z, bx: b.x + side, bz: b.z, seed: i * 13 + 5 });
    }
    const oxcart = avZ.length > 3
      ? { ax: avZ[1].x + 0.1, az: avZ[1].z, bx: avZ[avZ.length - 2].x + 0.1, bz: avZ[avZ.length - 2].z, seed: 1.7 }
      : null;
    const oxcart2 = avZ.length > 5 && stats.fCommerce > 0.55
      ? { ax: avZ[avZ.length - 2].x - 0.35, az: avZ[avZ.length - 2].z, bx: avZ[1].x - 0.35, bz: avZ[1].z, seed: 4.3 }
      : null;
    return { braziers, well, cart, folk, paifang, avenueLanterns, walkers, oxcart, oxcart2 };
  }, [hall, market, avenue, stats.fPop, stats.fCommerce, stats.fLoyalty, plagued, night]);

  // 民情 — the city's living condition written into the streets: cratered
  // loyalty puts refugees at the roadside, a plague hangs mourning banners
  // over stricken households, and a loyal city in autumn strings festival
  // pennants over the avenue (秋社廟會).
  const festival = season === 'autumn' && stats.fLoyalty > 0.66 && !plagued && !ruined;
  const civic = useMemo(() => {
    const avZ = [...avenue].sort((a, b) => b.z - a.z); // gate end first
    const refugees: Array<{ x: number; z: number; seed: number }> = [];
    if (stats.fLoyalty < 0.35 && !ruined) {
      const n = stats.fLoyalty < 0.18 ? 6 : 4;
      for (let i = 0; i < n; i++) {
        const a = avZ[Math.min(avZ.length - 1, (i >> 1) + 1)];
        if (!a) break;
        const side = i % 2 ? 1.05 : -1.05;
        refugees.push({ x: a.x + side + ((i * 29) % 3) * 0.14, z: a.z + ((i * 17) % 3) * 0.2 - 0.2, seed: i * 31 + 7 });
      }
    }
    const banners = plagued && !ruined
      ? houses.filter((_, i) => i % 5 === 0).slice(0, 6).map((h, i) => ({ x: h.x + 0.55, z: h.z + 0.3, seed: i }))
      : [];
    const pennants: Array<{ ax: number; az: number; bx: number; bz: number }> = [];
    if (festival) {
      // Cap the strings (8 desktop / 5 phone) — a long, loyal avenue could
      // otherwise hang dozens of pennant lines.
      const maxStrings = RENDER_HI ? 8 : 5;
      for (let i = 0; i + 1 < props.avenueLanterns.length && pennants.length < maxStrings; i += 2) {
        const a = props.avenueLanterns[i], b = props.avenueLanterns[i + 1];
        pennants.push({ ax: a.x, az: a.z, bx: b.x, bz: b.z });
      }
    }
    return { refugees, banners, pennants };
  }, [avenue, houses, stats.fLoyalty, plagued, ruined, festival, props.avenueLanterns]);

  return (
    <>
      {/* Main avenue first so other paving/props sit on top of it */}
      {avenue.map((a) => (
        <mesh key={`av-${a.key}`} position={[a.x, 0.045, a.z]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <boxGeometry args={[1.46, 1.46, 0.07]} />
          <meshStandardMaterial color="#a89c84" roughness={0.97} />
        </mesh>
      ))}
      {/* Bare-earth patches + puddles break up the green ground */}
      {dirt.map((d) => (
        <mesh key={`dt-${d.key}`} position={[d.x, 0.035, d.z]} rotation={[-Math.PI / 2, (d.seed % 4) * 0.4, 0]} receiveShadow>
          <boxGeometry args={[1.0 + (d.seed % 3) * 0.12, 0.9 + (d.seed % 2) * 0.2, 0.05]} />
          <meshStandardMaterial color="#6a5740" roughness={0.98} />
        </mesh>
      ))}
      {puddles.map((p) => (
        <mesh key={`pd-${p.key}`} position={[p.x, 0.05, p.z]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <circleGeometry args={[0.34, 16]} />
          <meshStandardMaterial color="#3a4a52" roughness={0.18} metalness={0.55} />
        </mesh>
      ))}
      <GrassTufts3D tufts={grass} />
      {paths.map((p) => <StonePath3D key={`pa-${p.key}`} x={p.x} z={p.z} seed={p.seed} />)}
      {flowers.map((f) => <FlowerBed3D key={`fb-${f.key}`} x={f.x} z={f.z} seed={f.seed} />)}
      {houses.map((h) => <Dwelling key={`dw-${h.key}`} x={h.x} z={h.z} seed={h.seed} />)}
      {trees.map((tr) => <GardenTree3D key={`tr-${tr.key}`} x={tr.x} z={tr.z} seed={tr.seed} />)}
      <group onClick={(e) => { e.stopPropagation(); inspect({ title: '市集 · 商坊', body: '城中商市,理一城之財貨。可於此勸課商賈。', color: '#d4a84a', commands: ['develop-commerce', 'major-commerce'] }); }}>
        {market.map((m) => <MarketStall3D key={`mk-${m.key}`} x={m.x} z={m.z} seed={m.seed} />)}
      </group>
      {/* 焦土 — a razed city empties of life: no crowds, no festive lanterns. */}
      {!ruined && villagers.map((v) => <Villager3D key={`vl-${v.key}`} x={v.x} z={v.z} seed={v.seed} />)}
      {!ruined && props.folk.map((v, i) => <Villager3D key={`mf-${i}`} x={v.x} z={v.z} seed={v.seed} />)}
      {!ruined && props.walkers.map((wk, i) => <Walker3D key={`wk-${i}`} ax={wk.ax} az={wk.az} bx={wk.bx} bz={wk.bz} seed={wk.seed} />)}
      {!ruined && props.oxcart && <MovingCart3D ax={props.oxcart.ax} az={props.oxcart.az} bx={props.oxcart.bx} bz={props.oxcart.bz} seed={props.oxcart.seed} />}
      {!ruined && props.oxcart2 && <MovingCart3D ax={props.oxcart2.ax} az={props.oxcart2.az} bx={props.oxcart2.bx} bz={props.oxcart2.bz} seed={props.oxcart2.seed} />}
      {/* 流民 — poverty made visible; tap them to open the relief levers. */}
      {civic.refugees.length > 0 && (
        <group onClick={(e) => { e.stopPropagation(); inspect({ title: '流民 · 饑寒', body: '民忠已墮,流民聚於道旁,扶老攜幼、席地而棲。可賑濟安民,或招撫入籍以充戶口。', color: '#b89060', commands: ['relief', 'improve-loyalty', 'encourage-migration'] }); }}>
        {civic.refugees.map((r, i) => <Refugee3D key={`rf-${i}`} x={r.x} z={r.z} seed={r.seed} />)}
        </group>
      )}
      {/* 白幡 — plague mourning banners on stricken households. */}
      {civic.banners.map((b, i) => <MourningBanner3D key={`mb-${i}`} x={b.x} z={b.z} seed={b.seed} />)}
      {/* 秋社廟會 — festival pennants over the avenue in a loyal autumn. */}
      {civic.pennants.map((p, i) => <FestivalPennants3D key={`fp-${i}`} ax={p.ax} az={p.az} bx={p.bx} bz={p.bz} />)}
      {/* 街頭際遇 — a special figure stands by the archway this season:
          sparkling ring underfoot, tap to hear them out. */}
      {!ruined && encounter && props.paifang && (
        <StreetEncounterFigure
          x={props.paifang.x + 1.2}
          z={props.paifang.z + 0.6}
          kind={encounter.kind}
          onClick={onEncounterClick}
        />
      )}
      {/* 打更人 — on a moonlit lower-phase night the watchman walks the
          avenue, lantern in hand (梆子聲遠,燈火獨行). */}
      {!ruined && night && avenue.length > 3 && (() => {
        const avZ2 = [...avenue].sort((a, b) => a.z - b.z);
        const a0 = avZ2[0], b0 = avZ2[avZ2.length - 1];
        return <Watchman3D ax={a0.x} az={a0.z} bx={b0.x} bz={b0.z} />;
      })()}
      {/* Chimney smoke from a scattering of homes (peaceful) — black pillars of
          ruin smoke if the city has been razed. */}
      {!ruined && houses.filter((_, i) => i % 8 === 0).slice(0, 5).map((h) => (
        <Smoke3D key={`sm-${h.key}`} x={h.x} z={h.z} base={1.15} />
      ))}
      {ruined && <RuinsOverlay houses={houses} />}
      {props.cart && !ruined && <Cart3D x={props.cart.x} z={props.cart.z} seed={props.cart.seed} />}
      <Well3D x={props.well.x} z={props.well.z} />
      {props.braziers.map((b, i) => <Brazier3D key={`bz-${i}`} x={b.x} z={b.z} />)}
      {!ruined && lanterns.map((l) => <Lantern3D key={`ln-${l.key}`} x={l.x} z={l.z} />)}
      {!ruined && props.avenueLanterns.map((l, i) => <Lantern3D key={`al-${i}`} x={l.x} z={l.z} />)}
      {props.paifang && <Paifang3D x={props.paifang.x} z={props.paifang.z} />}
      {/* 名產 — a signature-good prop by the market wards (salt heap, horse pen,
          loom…), a visual nod to the city's specialty trade edge. */}
      {specialty && market[0] && <SpecialtyProp3D specialty={specialty} x={market[0].x + 1.7} z={market[0].z + 1.6} />}
      {/* 駐軍旌旗 — a rank of banners by the drill ground, taller for a big garrison. */}
      {!ruined && <GarrisonBanners3D x={landmarks.barracks.x} z={landmarks.barracks.z} troops={troops} color={bannerColor} />}
      {/* 施政中 — work-in-progress at the landmark whose order is queued. */}
      {activity.farm && <CommandActivity3D x={landmarks.farm.x} z={landmarks.farm.z + 1.6} color="#bcd07a" label={t('勸課農桑', 'Farming')} />}
      {activity.market && market[0] && <CommandActivity3D x={market[0].x} z={market[0].z + 1.5} color="#d4a84a" label={t('興商理財', 'Trade')} />}
      {activity.barracks && <CommandActivity3D x={landmarks.barracks.x} z={landmarks.barracks.z + 1.6} color="#c08858" label={t('操演徵募', 'Drilling')} soldier />}
      {activity.hall && <CommandActivity3D x={hall.x} z={hall.z + 2.6} color="#f0d98a" label={t('撫民理政', 'Governing')} />}
      {activity.tavern && <CommandActivity3D x={landmarks.tavern.x} z={landmarks.tavern.z + 1.3} color="#d98a6a" label={t('探訪賢才', 'Recruiting')} />}
      <group onClick={(e) => { e.stopPropagation(); inspect({ title: t('寶塔 · 瞭望', 'Pagoda · Lookout'), body: landmarkInfo.pagodaBody, color: '#e0c060' }); }}>
        <Pagoda3D x={landmarks.pagoda.x} z={landmarks.pagoda.z} />
      </group>
      <group onClick={(e) => { e.stopPropagation(); inspect({ title: t('鼓樓 · 報時', 'Drum Tower · Watches'), body: landmarkInfo.timeBody, color: '#e0c060' }); }}>
        <DrumTower3D x={landmarks.drum.x} z={landmarks.drum.z} />
      </group>
      <group onClick={(e) => { e.stopPropagation(); inspect({ title: t('鐘樓 · 報時', 'Bell Tower · Watches'), body: landmarkInfo.timeBody, color: '#e0c060' }); }}>
        <BellTower3D x={landmarks.bell.x} z={landmarks.bell.z} />
      </group>
      <group onClick={(e) => { e.stopPropagation(); inspect({ title: '園林 · 雅集', body: landmarkInfo.gardenBody, color: '#9ac06a' }); }}>
        <Garden3D x={landmarks.garden.x} z={landmarks.garden.z} />
      </group>
      <group onClick={(e) => { e.stopPropagation(); inspect({ title: '屯田 · 田畝', body: '军民屯垦之田,城邑粮秣所出。可於此勸課農桑、興修水利。', color: '#bcd07a', commands: ['develop-agriculture', 'major-agriculture', 'flood-control'] }); }}>
        <Farmland3D x={landmarks.farm.x} z={landmarks.farm.z} lush={weatherKind === 'drought' ? stats.fAgri * 0.32 : stats.fAgri} />
      </group>
      <group onClick={(e) => { e.stopPropagation(); inspect({ title: '府衙 · 治所', body: '一城之治所,太守理政、安民撫眾、興学教化之地。', color: '#f0d98a', commands: ['improve-loyalty', 'relief', 'anti-corruption', 'encourage-migration', 'promote-learning'] }); }}>
        <GovernmentHall3D x={hall.x} z={hall.z} bannerColor={bannerColor} isCapital={isCapital} />
      </group>
      <group onClick={(e) => { e.stopPropagation(); inspect({ title: '兵營 · 校場', body: '操演士卒、招募新軍、屯田練兵、鎮守疆場之所。', color: '#c08858', commands: ['recruit-troops', 'military-farming', 'drill-troops', 'garrison'] }); }}>
        <Barracks3D x={landmarks.barracks.x} z={landmarks.barracks.z} bannerColor={bannerColor} />
      </group>
      <group onClick={(e) => { e.stopPropagation(); inspect({ title: '酒樓', body: '杯酒之間,常聞在野賢才之名。可於此遣人探訪。', color: '#d98a6a', commands: ['search'] }); }}>
        <Tavern3D x={landmarks.tavern.x} z={landmarks.tavern.z} />
      </group>
      {/* 城中人物 — stationed officers stand where they'd be found: court
          officers before the yamen, martial officers on the drill ground,
          discovered wanderers outside the tavern. Anonymous hooded figures
          hint at undiscovered talent (搜索 pays). All clickable. */}
      {!ruined && figures.hall.map((o, i) => (
        <OfficerFigure3D
          key={`ofh-${o.id}`}
          x={hall.x + (i - (figures.hall.length - 1) / 2) * 0.85}
          z={hall.z + 2.15}
          nameZh={o.name.zh} kind="court" seed={i * 5 + 1}
          onClick={() => inspect({
            title: `${o.name.zh} · 在城武將`,
            body: `統${o.stats.leadership} 武${o.stats.war} 智${o.stats.intelligence} 政${o.stats.politics} 魅${o.stats.charisma}。現於府衙聽候調遣,可委以政務或特訓。`,
            color: '#8fa8d8', commands: ['special-training'],
          })}
        />
      ))}
      {!ruined && figures.barracks.map((o, i) => (
        <OfficerFigure3D
          key={`ofb-${o.id}`}
          x={landmarks.barracks.x + (i === 0 ? -1.0 : 1.0)}
          z={landmarks.barracks.z + 1.55}
          nameZh={o.name.zh} kind="martial" seed={i * 7 + 3}
          onClick={() => inspect({
            title: `${o.name.zh} · 在城武將`,
            body: `統${o.stats.leadership} 武${o.stats.war} 智${o.stats.intelligence} 政${o.stats.politics} 魅${o.stats.charisma}。正於校場操演士卒,可領兵、練兵或特訓。`,
            color: '#c86a4a', commands: ['drill-troops', 'special-training'],
          })}
        />
      ))}
      {!ruined && figures.tavern.map((o, i) => (
        <OfficerFigure3D
          key={`oft-${o.id}`}
          x={landmarks.tavern.x + (i - (figures.tavern.length - 1) / 2) * 0.8}
          z={landmarks.tavern.z + 1.4}
          nameZh={o.name.zh} kind="wanderer" seed={i * 11 + 5}
          onClick={() => inspect({
            title: `${o.name.zh} · 在野`,
            body: `統${o.stats.leadership} 武${o.stats.war} 智${o.stats.intelligence} 政${o.stats.politics} 魅${o.stats.charisma}。在野之士,寓居此城。杯酒論交,或可延攬入幕。`,
            color: '#7ab88a', commands: ['search'],
          })}
        />
      ))}
      {/* 官邸 — the lord's household at the capital: residence by the yamen,
          spouse + children in the courtyard. Tap for the family card. */}
      {!ruined && household && (
        <Residence3D
          x={hall.x - 3.1} z={hall.z + 2.4}
          household={household}
          onClick={() => inspect({
            title: `官邸 · ${household.lordZh}家眷`,
            body: [
              household.spouses.length > 0 ? t(`妻室:${household.spouses.join('、')}`, `Spouses: ${household.spouses.join(', ')}`) : '',
              ...household.kids.map((k) =>
                `${k.female ? '女' : '子'} ${k.nameZh} · ${k.age}歲${k.heir ? ' · 世子' : ''}${k.comingSoon ? '(將於14歲出仕)' : ''}`),
              household.kids.length === 0 ? '膝下尚虛 — 子嗣未降。' : '',
            ].filter(Boolean).join('\n'),
            color: '#e8b4c8',
          })}
        />
      )}
      {!ruined && Array.from({ length: figures.hiddenCount }).map((_, i) => (
        <OfficerFigure3D
          key={`ofx-${i}`}
          x={landmarks.tavern.x + 1.55}
          z={landmarks.tavern.z + 0.45 + i * 0.75}
          kind="hidden" seed={i * 13 + 9}
          onClick={() => inspect({
            title: '市井傳聞',
            body: '酒肆之間風聞有賢士隱於此城,姓名未詳、蹤跡難尋。遣人探訪,或有所獲。',
            color: '#9a9aa4', commands: ['search'],
          })}
        />
      ))}
    </>
  );
}

/* ─── 城外腹地 (Hinterland) ────────────────────────────────────────────
   The walled city sits at the centre. Beyond its moat we sample the REAL
   strategic-map geography in every direction — so the river that runs east
   toward a neighbour appears to the east, the mountains north appear north,
   and every approach shows the ground that actually lies between this city
   and that neighbour. The 8 defence slots ride the outer ring at their true
   compass bearings (directional defence), and a signed road runs out toward
   each adjacent city. */

interface Neighbor {
  id: EntityId;
  nameZh: string;
  nameEn: string;
  x: number;
  y: number;
  color: string;
  rel: 'self' | 'other' | 'neutral';
}

/** A strategic 施設 near this city, projected into the hinterland by its true
 *  bearing/distance so the same building shows on the world, city and battle. */
interface HinterlandFacility {
  id: EntityId;
  kind: FacilityKind;
  /** Geo-pixel offset from the city centre (east = +dx, south = +dy). */
  dx: number;
  dy: number;
  dist: number;
  owned: boolean;
}

/** An army marching near this city — shown on the hinterland at its true
 *  bearing so you watch columns close in from the direction they're coming. */
interface HinterlandArmy {
  id: EntityId;
  dx: number;
  dy: number;
  dist: number;
  color: string;
  troops: number;
  nameZh: string;
  own: boolean;
  /** Bearing down on THIS city. */
  incoming: boolean;
}

const HINTERLAND_BELT_DEPTH = 21;    // world units of countryside beyond the moat
const HINTERLAND_STRAT_REACH = 70;   // fallback reach (strategic units) for directions with no neighbour
const HINTERLAND_TILE_SP = IS_MOBILE ? 1.7 : 1.2; // belt sampling spacing — denser on desktop resolves thin rivers
const MOAT_PAD = 4;                  // moat half-extends this far past the grid
const HINTERLAND_REACH_MIN = 32;     // never sample shorter than this…
const HINTERLAND_REACH_MAX = 150;    // …nor farther than this (strategic units)

// Real-ground → colour / relief. Water sits flat & low; hills and mountains
// rise so the countryside reads in 3D.
const GROUND_COLOR: Record<string, string> = {
  sea:       '#1d4a68',
  lake:      '#27607f',
  river:     '#2c5882',
  riverbank: '#8a8a5e',
  mountain:  '#6a5b4c',
  hill:      '#7c7250',
  plain:     '#5f7a42',
};
const GROUND_HEIGHT: Record<string, number> = {
  sea: 0.1, lake: 0.1, river: 0.1, riverbank: 0.22,
  mountain: 1.8, hill: 0.75, plain: 0.28,
};
const WATER_GROUND = new Set(['sea', 'lake', 'river']);

// Compass slot directions in world space (x = east, +z = south, so N = −z).
// Index order matches computeSlotPositions / SLOT_POSITIONS: N,NE,E,SE,S,SW,W,NW.
const S2 = Math.SQRT1_2;
const COMPASS_DIR: Array<[number, number]> = [
  [0, -1], [S2, -S2], [1, 0], [S2, S2],
  [0, 1], [-S2, S2], [-1, 0], [-S2, -S2],
];
const COMPASS_ZH = ['北', '東北', '東', '東南', '南', '西南', '西', '西北'];
const COMPASS_EN = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];

/** Which compass slot (0-7) guards a given world bearing (dx east, dz south). */
function octantForWorldDir(dx: number, dz: number): number {
  // 0° = north (−z), increasing clockwise through east.
  let deg = (Math.atan2(dx, -dz) * 180) / Math.PI;
  if (deg < 0) deg += 360;
  return Math.round(deg / 45) % 8;
}

/** A clickable octagon pad for a directional defence slot, with its compass
 *  label. Built defences render on top via the shared DefenseStructure. */
function HinterlandSlot3D({
  x, z, compass, occupied, selected, onClick, showLabel,
}: {
  x: number; z: number; compass: string; occupied: boolean;
  selected: boolean; onClick: () => void; showLabel: boolean;
}) {
  return (
    <group position={[x, 0, z]}>
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0.07, 0]}
        onClick={(e) => { e.stopPropagation(); onClick(); }}
        onPointerOver={(e) => { e.stopPropagation(); document.body.style.cursor = 'pointer'; }}
        onPointerOut={() => { document.body.style.cursor = 'auto'; }}
      >
        <cylinderGeometry args={[0.92, 0.92, 0.14, 8]} />
        <meshStandardMaterial
          color={occupied ? '#3a2d1a' : '#d4a84a'}
          emissive={selected ? '#f0e0b0' : occupied ? '#000000' : '#6a4a18'}
          emissiveIntensity={selected ? 0.6 : 0.25}
          transparent
          opacity={occupied ? 0.55 : 0.9}
          roughness={0.6}
        />
      </mesh>
      {selected && <SelectionRing3D radius={1.18} y={0.02} segments={24} />}
      {showLabel && (
        <Html center position={[0, 1.0, 0]} distanceFactor={26} occlude={false}>
          <div style={{
            color: occupied ? '#c0a878' : '#f0d98a',
            fontFamily: 'var(--tkm-font-body)', fontSize: '13px',
            letterSpacing: '1px', whiteSpace: 'nowrap',
            textShadow: '0 1px 3px #000', pointerEvents: 'none',
          }}>
            {compass}
          </div>
        </Html>
      )}
    </group>
  );
}

type HinterlandSite = { id: string; dx: number; dy: number; dist: number; nameZh: string; owned: boolean };

/** Pulsing ground ring at a recent battle site — same语言 as the world map. */
function ScarPulse3D({ x, z }: { x: number; z: number }) {
  const ref = useRef<THREE.Mesh>(null);
  const mat = useRef<THREE.MeshBasicMaterial>(null);
  useFrame((state) => {
    const t = (state.clock.elapsedTime % 1.7) / 1.7;
    const s = 0.3 + t * 1.4;
    if (ref.current) ref.current.scale.set(s, s, s);
    if (mat.current) mat.current.opacity = (1 - t) * 0.5;
  });
  return (
    <mesh ref={ref} rotation={[-Math.PI / 2, 0, 0]} position={[x, 0.06, z]}>
      <ringGeometry args={[0.7, 0.9, 28]} />
      <meshBasicMaterial ref={mat} color="#d4a84a" transparent side={THREE.DoubleSide} />
    </mesh>
  );
}

function Hinterland3D({
  preview, city, neighbors, facilities, armies, stockades, ports, scars, slots, selectedSlot, onSlotClick, showOverlays,
}: {
  preview: ReturnType<typeof previewBattlefield>;
  city: { coords: { x: number; y: number } };
  neighbors: Neighbor[];
  facilities: HinterlandFacility[];
  armies: HinterlandArmy[];
  stockades: HinterlandSite[];
  ports: HinterlandSite[];
  scars: Array<{ dx: number; dy: number; dist: number; fresh: boolean }>;
  slots: ReturnType<typeof useGameStore.getState>['cities'][string]['buildSlots'];
  selectedSlot: number | null;
  onSlotClick: (slot: number) => void;
  showOverlays: boolean;
}) {
  const lang = useLanguage();
  const W = preview.width, H = preview.height;
  const cx = (W * HEX_COL_STEP) / 2;
  const cz = (H * HEX_ROW_STEP) / 2;
  const innerX = (W * HEX_COL_STEP) / 2 + MOAT_PAD;
  const innerZ = (H * HEX_ROW_STEP) / 2 + MOAT_PAD;
  const outerX = innerX + HINTERLAND_BELT_DEPTH;
  const outerZ = innerZ + HINTERLAND_BELT_DEPTH;

  // True bearing + strategic distance to each neighbour (same x=east / +y=south
  // frame the belt samples in), so each approach can reach its neighbour's real
  // distance rather than a flat fixed reach.
  const nbVecs = useMemo(
    () => neighbors.map((n) => ({
      bearing: Math.atan2(n.y - city.coords.y, n.x - city.coords.x),
      dist: Math.hypot(n.x - city.coords.x, n.y - city.coords.y),
    })),
    [neighbors, city.coords.x, city.coords.y],
  );

  // Sample a belt of real ground around the city. A tile's depth across the
  // belt maps to how far out we sample the strategic map; the OUTER reach in a
  // given direction is blended from the actual neighbours that lie that way —
  // so the country shown on each approach is the real ground between this city
  // and the neighbour it leads to, all the way to its doorstep.
  const tiles = useMemo(() => {
    const out: Array<{ x: number; z: number; color: string; h: number; water: boolean }> = [];
    const ellR = (ang: number, rx: number, rz: number) =>
      1 / Math.hypot(Math.cos(ang) / rx, Math.sin(ang) / rz);
    const reachAt = (ang: number) => {
      if (nbVecs.length === 0) return HINTERLAND_STRAT_REACH;
      let ws = 0, ds = 0;
      for (const n of nbVecs) {
        let d = Math.abs(ang - n.bearing);
        if (d > Math.PI) d = 2 * Math.PI - d;
        // Weight peaks sharply toward a neighbour's bearing, with a small floor
        // so in-between directions still blend rather than snap.
        const w = Math.pow(Math.max(0, Math.cos(d)), 3) + 0.08;
        ws += w; ds += w * n.dist;
      }
      return Math.max(HINTERLAND_REACH_MIN, Math.min(HINTERLAND_REACH_MAX, ds / ws));
    };
    for (let wx = cx - outerX; wx <= cx + outerX; wx += HINTERLAND_TILE_SP) {
      for (let wz = cz - outerZ; wz <= cz + outerZ; wz += HINTERLAND_TILE_SP) {
        const dx = wx - cx, dz = wz - cz;
        const r = Math.hypot(dx, dz);
        if (r < 0.001) continue;
        const ang = Math.atan2(dz, dx);
        const inR = ellR(ang, innerX, innerZ);
        const outR = ellR(ang, outerX, outerZ);
        if (r < inR || r > outR) continue;
        const t = (r - inR) / Math.max(0.001, outR - inR);
        const strat = 6 + t * (reachAt(ang) - 6);
        const ux = dx / r, uz = dz / r;
        const g = battleGroundAt(city.coords.x + ux * strat, city.coords.y + uz * strat);
        out.push({
          x: wx, z: wz,
          color: GROUND_COLOR[g] ?? GROUND_COLOR.plain,
          h: GROUND_HEIGHT[g] ?? 0.28,
          water: WATER_GROUND.has(g),
        });
      }
    }
    return out;
  }, [cx, cz, innerX, innerZ, outerX, outerZ, city.coords.x, city.coords.y, nbVecs]);

  const slotMap = new Map((slots ?? []).map((s) => [s.slot, s]));

  return (
    <group>
      {/* Countryside belt — instanced hex prisms, coloured & raised by real ground.
          No castShadow: shadow-mapping the whole belt is costly and barely visible. */}
      <Instances limit={Math.max(1, tiles.length)} receiveShadow>
        <cylinderGeometry args={[1.0, 1.0, 1, 6]} />
        <meshStandardMaterial roughness={0.92} metalness={0.02} />
        {tiles.map((t, i) => (
          <Instance
            key={i}
            position={[t.x, t.water ? 0.05 : t.h / 2, t.z]}
            scale={[1, Math.max(0.12, t.h), 1]}
            color={t.color}
          />
        ))}
      </Instances>

      {/* Roads + signposts out to each neighbouring city, in its true direction */}
      {neighbors.map((n) => {
        const dx = n.x - city.coords.x, dz = n.y - city.coords.y;
        const len = Math.hypot(dx, dz) || 1;
        const ux = dx / len, uz = dz / len;
        const ang = Math.atan2(dz, dx);
        const inR = 1 / Math.hypot(Math.cos(ang) / innerX, Math.sin(ang) / innerZ);
        const outR = 1 / Math.hypot(Math.cos(ang) / outerX, Math.sin(ang) / outerZ);
        const mid = (inR + outR) / 2;
        const roadLen = outR - inR + 1.5;
        const postX = cx + ux * (outR + 0.4);
        const postZ = cz + uz * (outR + 0.4);
        return (
          <group key={n.id}>
            {/* Packed-earth road strip aligned along the bearing */}
            <mesh
              position={[cx + ux * mid, 0.16, cz + uz * mid]}
              rotation={[0, Math.atan2(-uz, ux), 0]}
              receiveShadow
            >
              <boxGeometry args={[roadLen, 0.08, 1.3]} />
              <meshStandardMaterial color="#9a8358" roughness={0.95} />
            </mesh>
            {/* Signpost */}
            <mesh position={[postX, 0.7, postZ]} castShadow>
              <cylinderGeometry args={[0.09, 0.09, 1.4, 6]} />
              <meshStandardMaterial color="#5a4326" roughness={0.9} />
            </mesh>
            <Html center position={[postX, 1.7, postZ]} distanceFactor={30} occlude={false}>
              <div style={{
                background: 'rgba(20,14,8,0.82)',
                border: `1px solid ${n.color}`,
                borderRadius: 'var(--tkm-radius-xs)',
                padding: '2px 7px',
                color: n.rel === 'self' ? '#7ed68a' : n.rel === 'other' ? '#e0a0a0' : '#c0a878',
                fontFamily: 'var(--tkm-font-body)', fontSize: '12px',
                letterSpacing: '1px', whiteSpace: 'nowrap',
                textShadow: '0 1px 2px #000', pointerEvents: 'none',
              }}>
                往 {n.nameZh}
              </div>
            </Html>
          </group>
        );
      })}

      {/* 8 directional defence slots on the outer ring */}
      {COMPASS_DIR.map(([dxC, dzC], i) => {
        const px = cx + dxC * (innerX - 0.5);
        const pz = cz + dzC * (innerZ - 0.5);
        const s = slotMap.get(i);
        const occupied = !!s?.buildingId;
        return (
          <group key={`hslot-${i}`}>
            <HinterlandSlot3D
              x={px} z={pz}
              compass={COMPASS_ZH[i]}
              occupied={occupied}
              selected={selectedSlot === i}
              onClick={() => onSlotClick(i)}
              showLabel={showOverlays}
            />
            {/* 防守扇形 — the selected slot lights the octant it guards, so
                the defence's facing reads at a glance (E16). */}
            {selectedSlot === i && (() => {
              const thetaC = Math.atan2(-dzC, dxC);
              const r0 = (innerX + innerZ) / 2;
              return (
                <group position={[cx, 0.07, cz]}>
                  <mesh rotation={[-Math.PI / 2, 0, 0]}>
                    <ringGeometry args={[r0 * 0.82, r0 * 2.1, 24, 1, thetaC - Math.PI / 8, Math.PI / 4]} />
                    <meshBasicMaterial color="#7fb4ff" transparent opacity={0.2} side={THREE.DoubleSide} depthWrite={false} toneMapped={false} />
                  </mesh>
                  <mesh rotation={[-Math.PI / 2, 0, 0]}>
                    <ringGeometry args={[r0 * 0.82, r0 * 0.9, 24, 1, thetaC - Math.PI / 8, Math.PI / 4]} />
                    <meshBasicMaterial color="#aecdff" transparent opacity={0.55} side={THREE.DoubleSide} depthWrite={false} toneMapped={false} />
                  </mesh>
                </group>
              );
            })()}
            {occupied && s && (() => {
              const maxHp = 100 * s.level + 100;
              return (
                <group position={[px, 0, pz]}>
                  <DefenseStructure
                    coord={{ col: 0, row: 0 }}
                    buildingId={s.buildingId!}
                    level={s.level}
                    hp={maxHp}
                    maxHp={maxHp}
                  />
                </group>
              );
            })()}
          </group>
        );
      })}

      {/* 施設 — strategic facilities (箭樓/投石臺/陣/防壁) near this city, placed
          on the hinterland by their true bearing so the SAME building shows on
          the world map, here, and on the battlefield. */}
      {facilities.map((f) => {
        const ang = Math.atan2(f.dy, f.dx);
        const ellR = (rx: number, rz: number) => 1 / Math.hypot(Math.cos(ang) / rx, Math.sin(ang) / rz);
        const inR = ellR(innerX, innerZ), outR = ellR(outerX, outerZ);
        const tt = Math.min(1, f.dist / HINTERLAND_STRAT_REACH);
        const r = inR + tt * (outR - inR);
        const fpx = cx + Math.cos(ang) * r, fpz = cz + Math.sin(ang) * r;
        const def = FACILITY_DEFS[f.kind];
        return (
          <group key={f.id} position={[fpx, 0, fpz]}>
            <mesh position={[0, 0.45, 0]} castShadow receiveShadow>
              <boxGeometry args={[0.7, 0.9, 0.7]} />
              <meshStandardMaterial color="#5a4530" roughness={0.92} />
            </mesh>
            <mesh position={[0, 1.15, 0]} rotation={[0, Math.PI / 4, 0]} castShadow>
              <coneGeometry args={[0.42, 0.7, f.kind === 'catapult' ? 3 : 4]} />
              <meshStandardMaterial color={def.color} emissive={def.color} emissiveIntensity={0.3} roughness={0.6} />
            </mesh>
            {showOverlays && (
              <Html center position={[0, 1.95, 0]} distanceFactor={28} occlude={false}>
                <div style={{
                  color: f.owned ? '#f0d98a' : '#e0a0a0',
                  fontFamily: 'var(--tkm-font-body)', fontSize: '12px',
                  letterSpacing: '1px', whiteSpace: 'nowrap',
                  textShadow: '0 1px 3px #000', pointerEvents: 'none',
                }}>{pickName(def.name, lang)}</div>
              </Html>
            )}
          </group>
        );
      })}

      {/* Armies near the city — projected onto the hinterland by true bearing, so
          you watch columns (enemy in red) close in from the direction they march. */}
      {armies.map((a) => {
        const ang = Math.atan2(a.dy, a.dx);
        const ellR = (rx: number, rz: number) => 1 / Math.hypot(Math.cos(ang) / rx, Math.sin(ang) / rz);
        const inR = ellR(innerX, innerZ), outR = ellR(outerX, outerZ);
        const tt = Math.min(1, Math.max(0.08, a.dist / HINTERLAND_STRAT_REACH));
        const r = inR + tt * (outR - inR);
        const apx = cx + Math.cos(ang) * r, apz = cz + Math.sin(ang) * r;
        const threat = a.incoming && !a.own;
        return (
          <group key={a.id} position={[apx, 0, apz]}>
            {/* Banner pole + flag */}
            <mesh position={[0, 0.7, 0]} castShadow>
              <cylinderGeometry args={[0.05, 0.05, 1.4, 5]} />
              <meshStandardMaterial color="#1a1410" />
            </mesh>
            <mesh position={[0.32, 1.1, 0]} castShadow>
              <planeGeometry args={[0.55, 0.36]} />
              <meshStandardMaterial color={a.color} side={THREE.DoubleSide} emissive={threat ? a.color : '#000'} emissiveIntensity={threat ? 0.4 : 0} />
            </mesh>
            {/* A couple of troop blocks at the base */}
            {[-0.3, 0, 0.3].map((dx, i) => (
              <mesh key={i} position={[dx, 0.18, 0.25]} castShadow>
                <boxGeometry args={[0.18, 0.36, 0.18]} />
                <meshStandardMaterial color={a.own ? '#6a7a8a' : '#8a5a4a'} roughness={0.9} />
              </mesh>
            ))}
            {showOverlays && (
              <Html center position={[0, 1.95, 0]} distanceFactor={28} occlude={false}>
                <div style={{
                  color: a.own ? '#9ec9f0' : '#f0a0a0',
                  fontFamily: 'var(--tkm-font-body)', fontSize: '11px',
                  letterSpacing: '0.5px', whiteSpace: 'nowrap',
                  textShadow: '0 1px 3px #000', pointerEvents: 'none',
                }}>
                  {threat ? '⚔ ' : ''}{a.nameZh} {a.troops.toLocaleString()}
                </div>
              </Html>
            )}
          </group>
        );
      })}

      {/* Shared bearing/depth projection for the point sites below. */}
      {(() => {
        const project = (dx: number, dy: number, dist: number): [number, number] => {
          const ang = Math.atan2(dy, dx);
          const ellR = (rx: number, rz: number) => 1 / Math.hypot(Math.cos(ang) / rx, Math.sin(ang) / rz);
          const inR = ellR(innerX, innerZ), outR = ellR(outerX, outerZ);
          const tt = Math.min(1, Math.max(0.08, dist / HINTERLAND_STRAT_REACH));
          const r = inR + tt * (outR - inR);
          return [cx + Math.cos(ang) * r, cz + Math.sin(ang) * r];
        };
        return (
          <>
            {/* 塢壘/關砦 — wooden fort markers at their true bearing. */}
            {stockades.map((s) => {
              const [sx, sz] = project(s.dx, s.dy, s.dist);
              return (
                <group key={s.id} position={[sx, 0, sz]}>
                  <mesh position={[0, 0.35, 0]} castShadow>
                    <boxGeometry args={[0.8, 0.7, 0.8]} />
                    <meshStandardMaterial color="#6b4f2a" roughness={0.95} />
                  </mesh>
                  <mesh position={[0, 0.95, 0]} rotation={[0, Math.PI / 4, 0]} castShadow>
                    <coneGeometry args={[0.34, 0.5, 4]} />
                    <meshStandardMaterial color="#3a3a4a" roughness={0.85} />
                  </mesh>
                  {showOverlays && (
                    <Html center position={[0, 1.7, 0]} distanceFactor={28} occlude={false}>
                      <div style={{
                        color: s.owned ? '#f0d98a' : '#e0a0a0',
                        fontFamily: 'var(--tkm-font-body)', fontSize: '11px', whiteSpace: 'nowrap',
                        textShadow: '0 1px 3px #000', pointerEvents: 'none',
                      }}>{s.nameZh}</div>
                    </Html>
                  )}
                </group>
              );
            })}
            {/* 港口 — a wharf plank + anchor chip at the waterline bearing. */}
            {ports.map((p) => {
              const [sx, sz] = project(p.dx, p.dy, p.dist);
              return (
                <group key={p.id} position={[sx, 0, sz]}>
                  <mesh position={[0, 0.12, 0]} castShadow>
                    <boxGeometry args={[1.3, 0.18, 0.5]} />
                    <meshStandardMaterial color="#7a6242" roughness={0.9} />
                  </mesh>
                  <mesh position={[0.45, 0.55, 0]} castShadow>
                    <cylinderGeometry args={[0.05, 0.05, 0.8, 5]} />
                    <meshStandardMaterial color="#4a3a26" />
                  </mesh>
                  {showOverlays && (
                    <Html center position={[0, 1.3, 0]} distanceFactor={28} occlude={false}>
                      <div style={{
                        color: p.owned ? '#88b7e8' : '#c0a878',
                        fontFamily: 'var(--tkm-font-body)', fontSize: '11px', whiteSpace: 'nowrap',
                        textShadow: '0 1px 3px #000', pointerEvents: 'none',
                      }}>⚓ {p.nameZh}</div>
                    </Html>
                  )}
                </group>
              );
            })}
            {/* 戰痕 — crossed sabres; fresh sites pulse (同 world map). */}
            {scars.map((m, i) => {
              const [sx, sz] = project(m.dx, m.dy, m.dist);
              return (
                <group key={`scar-${i}`}>
                  <group position={[sx, 0.08, sz]} rotation={[-Math.PI / 2, 0, 0]}>
                    {[Math.PI / 4, -Math.PI / 4].map((rot, k) => (
                      <mesh key={k} rotation={[0, 0, rot]}>
                        <boxGeometry args={[0.9, 0.09, 0.02]} />
                        <meshBasicMaterial color="#9aa6b4" transparent opacity={0.85} />
                      </mesh>
                    ))}
                  </group>
                  {m.fresh && <ScarPulse3D x={sx} z={sz} />}
                </group>
              );
            })}
          </>
        );
      })()}
    </group>
  );
}

function CityScene({
  preview, slots, buildings, construction, plots, cityWallCol, bannerColor, light, season, stats, grand, onInspect,
  selectedPlot, onPlotClick, hovered, onHover, onClick, showOverlays, ghostBuilding,
  city, neighbors, facilities, armies, stockades, ports, scars, selectedSlot, onSlotClick, landmarkInfo,
  weatherKind, isCapital, specialty, activity, plagued, figures, night, encounter, onEncounterClick, household,
}: {
  preview: ReturnType<typeof previewBattlefield>;
  slots: ReturnType<typeof useGameStore.getState>['cities'][string]['buildSlots'];
  buildings: Array<{ coord: { col: number; row: number }; buildingId: BuildingId; level: number; damaged?: boolean }>;
  construction: Array<{ coord: { col: number; row: number }; nameZh: string }>;
  plots: Array<{ col: number; row: number }>;
  cityWallCol: number;
  light: typeof SEASON_LIGHT[SeasonKey];
  season: SeasonKey;
  stats: CityStats;
  grand: boolean;
  onInspect: (info: InspectInfo) => void;
  bannerColor: string;
  selectedPlot: number | null;
  /** 營建幻影 — build option being hovered in the panel (ghost on the plot). */
  ghostBuilding?: BuildingId | null;
  onPlotClick: (plotIndex: number) => void;
  hovered: { col: number; row: number } | null;
  onHover: (c: { col: number; row: number } | null) => void;
  onClick: (c: { col: number; row: number }) => void;
  showOverlays: boolean;
  city: City;
  neighbors: Neighbor[];
  facilities: HinterlandFacility[];
  armies: HinterlandArmy[];
  stockades: HinterlandSite[];
  ports: HinterlandSite[];
  scars: Array<{ dx: number; dy: number; dist: number; fresh: boolean }>;
  selectedSlot: number | null;
  onSlotClick: (slot: number) => void;
  landmarkInfo: LandmarkInfo;
  weatherKind: WeatherKind;
  isCapital: boolean;
  specialty: SpecialtyDef | null;
  activity: CityActivity;
  plagued: boolean;
  figures: CityFigures;
  /** 下旬月夜 — night crowd thinning + the watchman making his rounds. */
  night: boolean;
  /** 街頭際遇 — this season's special street figure (if any). */
  encounter: { kind: 'merchant' | 'knight' | 'soothsayer' | 'storyteller' } | null;
  onEncounterClick: () => void;
  /** 家眷 — the lord's household at the capital (spouse + underage heirs). */
  household: { lordZh: string; spouses: string[]; kids: Array<{ nameZh: string; age: number; heir: boolean; female: boolean; comingSoon: boolean }> } | null;
}) {
  const t = useT();
  // Defence slots now ride the outer hinterland ring (directional defence),
  // not the city-wall hexes — so they no longer occupy any grid hex here.

  // Hexes that already hold something — a finished building OR a site under
  // construction. Empty foundations (not in this set) stay tappable to build.
  const buildingHexes = new Set([
    ...buildings.map((b) => `${b.coord.col},${b.coord.row}`),
    ...construction.map((c) => `${c.coord.col},${c.coord.row}`),
  ]);
  const occupiedHexes = new Set<string>();
  for (const b of buildings) occupiedHexes.add(`${b.coord.col},${b.coord.row}`);
  for (const p of plots) occupiedHexes.add(`${p.col},${p.row}`); // foundations

  // Season-driven lighting mood.
  return (
    <SeasonCtx.Provider value={season}>
     <NightCtx.Provider value={night}>
      <SeasonalDrift season={season} />
      <WeatherFX kind={weatherKind} width={preview.width} height={preview.height} />
     <InspectCtx.Provider value={onInspect}>
      <ambientLight intensity={light.ambient * 0.7} color={light.ambientColor} />
      {/* Sky/ground hemisphere fill for richer ambient colour grading */}
      <hemisphereLight args={[light.ambientColor, '#6a5a3e', 0.45]} />
      <directionalLight
        position={light.sunPos} intensity={light.sunI} color={light.sun}
        castShadow
        shadow-mapSize-width={2048} shadow-mapSize-height={2048}
      />
      <directionalLight position={[-8, 6, -6]} intensity={0.25} color={light.sun} />
      {/* Fog far-plane scales with the whole region (city + hinterland) so the
          countryside stays visible when the camera pulls back; near keeps the
          close-up atmosphere. */}
      <fog attach="fog" args={[light.fog, 40, Math.max(preview.width * HEX_COL_STEP, preview.height * HEX_ROW_STEP) * 5]} />

      {/* Warm lantern glow — stronger in the dim seasons, so winter reads as a
          lantern-lit dusk and summer is barely tinted. */}
      {(() => {
        const W = preview.width, H = preview.height;
        const cx = (W * HEX_COL_STEP) / 2, cz = (H * HEX_ROW_STEP) / 2;
        const [gx, gz] = hexWorld(Math.floor(W / 2), H - 1);
        const I = 0.3 + light.nightGlow * 1.7;
        return (
          <>
            <pointLight position={[cx, 3.2, cz]} intensity={I} color="#ffb060" distance={22} decay={2} />
            <pointLight position={[gx, 2.6, gz - 1.5]} intensity={I * 0.8} color="#ffa850" distance={13} decay={2} />
            <pointLight position={[cx - 6, 2.4, cz - 4]} intensity={I * 0.7} color="#ffb878" distance={13} decay={2} />
          </>
        );
      })()}

      {/* Terrain tiles — prisms batched into one InstancedMesh (same as the
          battle board); per-tile groups keep hover/click. */}
      <InstancedTilePrisms tiles={preview.tiles} hovered={hovered} />
      {preview.tiles.map((tile) => {
        const isHovered = !!hovered && hovered.col === tile.coord.col && hovered.row === tile.coord.row;
        return (
          <group
            key={`${tile.coord.col},${tile.coord.row}`}
            onPointerOver={(e) => { e.stopPropagation(); onHover(tile.coord); }}
            onPointerOut={(e) => { e.stopPropagation(); onHover(null); }}
          >
            <HexTile
              tile={tile}
              hovered={isHovered}
              highlight={undefined}
              windStrength={0.4}
              onClick={() => onClick(tile.coord)}
              instancedBase
            />
          </group>
        );
      })}

      {/* Surrounding moat, seen beyond the walls. */}
      <Moat3D W={preview.width} H={preview.height} />

      {/* Moat life — lily pads, reed clumps, a drifting sampan */}
      {(() => {
        const W = preview.width, H = preview.height;
        const [ax, az] = hexWorld(0, 0);
        const [bx, bz] = hexWorld(W - 1, H - 1);
        const minX = Math.min(ax, bx), maxX = Math.max(ax, bx);
        const minZ = Math.min(az, bz), maxZ = Math.max(az, bz);
        const pads: Array<{ x: number; z: number; s: number }> = [];
        const N = 10;
        for (let i = 0; i < N; i++) {
          const t = i / (N - 1);
          const s1 = i * 97 + 11, s2 = i * 53 + 29;
          pads.push({ x: minX - 1.7 - (s1 % 8) * 0.12, z: minZ + t * (maxZ - minZ) + ((s1 % 7) - 3) * 0.18, s: 0.7 + (s1 % 4) * 0.14 });
          pads.push({ x: maxX + 1.7 + (s2 % 8) * 0.12, z: minZ + t * (maxZ - minZ) + ((s2 % 7) - 3) * 0.18, s: 0.7 + (s2 % 4) * 0.14 });
          pads.push({ x: minX + t * (maxX - minX) + ((s2 % 7) - 3) * 0.18, z: minZ - 1.7 - (s1 % 8) * 0.12, s: 0.7 + (s1 % 3) * 0.16 });
        }
        const reeds = [
          { x: minX - 1.5, z: minZ - 1.3, seed: 2 },
          { x: maxX + 1.5, z: minZ - 1.3, seed: 5 },
          { x: minX - 1.5, z: maxZ + 1.3, seed: 8 },
        ];
        return (
          <>
            <LilyPads3D pads={pads} />
            {reeds.map((r, i) => <Reed3D key={`rd-${i}`} x={r.x} z={r.z} seed={r.seed} />)}
            <SmallBoat3D x={minX - 2.1} z={(minZ + maxZ) / 2} seed={1.2} />
          </>
        );
      })()}

      {/* City walls — full perimeter ring, towers at the corners, gate south. */}
      {(() => {
        const W = preview.width, H = preview.height;
        const gateCol = Math.floor(W / 2), gateRow = H - 1;
        // 水門 on the east wall, opening to the moat where the wharf sits.
        const waterCol = W - 1, waterRow = Math.max(1, Math.min(H - 2, Math.round(H * 0.38)));
        const isWater = (s: { col: number; row: number }) => s.col === waterCol && s.row === waterRow;
        const corners = new Set([`0,0`, `${W - 1},0`, `0,${H - 1}`, `${W - 1},${H - 1}`]);
        const segs: Array<{ col: number; row: number }> = [];
        for (let c = 0; c < W; c++) { segs.push({ col: c, row: 0 }); segs.push({ col: c, row: H - 1 }); }
        for (let r = 1; r < H - 1; r++) { segs.push({ col: 0, row: r }); segs.push({ col: W - 1, row: r }); }
        const [gx, gz] = hexWorld(gateCol, gateRow);
        const [wx, wz] = hexWorld(waterCol, waterRow);
        return (
          <>
            {segs.filter((s) => !(s.col === gateCol && s.row === gateRow) && !corners.has(`${s.col},${s.row}`) && !isWater(s)).map((s) => {
              const [x, z] = hexWorld(s.col, s.row);
              return <WallSegment3D key={`wall-${s.col}-${s.row}`} x={x} z={z} tier={city.wallTier ?? 1} />;
            })}
            {/* Banners flying from the wall-walk at intervals */}
            {segs.filter((s) => !corners.has(`${s.col},${s.row}`) && !(s.col === gateCol && s.row === gateRow) && !isWater(s) && (s.col + s.row) % 5 === 0).map((s) => {
              const [x, z] = hexWorld(s.col, s.row);
              return <WallBanner3D key={`wb-${s.col}-${s.row}`} x={x} z={z} color={bannerColor} />;
            })}
            {[...corners].map((c) => {
              const [col, row] = c.split(',').map(Number);
              const [x, z] = hexWorld(col, row);
              return <CornerTower3D key={`tower-${c}`} x={x} z={z} bannerColor={bannerColor} />;
            })}
            <group onClick={(e) => { e.stopPropagation(); onInspect({ title: '城牆 · 城門', body: '一城之屏障。可於此修築城防、大興築城、強化城壁。', color: '#9aa6b0', commands: ['build-defense', 'major-defense', 'upgrade-wall'] }); }}>
              <CityGate3D x={gx} z={gz} bannerColor={bannerColor} />
            </group>
            {/* 築城修壁中 — scaffolding + work crew when a defence order is queued. */}
            {activity.wall && <CommandActivity3D x={gx} z={gz - 1.4} color="#9aa6b0" label={t('築城修壁', 'Fortifying')} build />}
            {/* Stone bridge crossing the moat out from the gate */}
            <StoneBridge3D x={gx} z={gz + 2.1} />
            {/* Water gate + wharf on the east wall */}
            <WaterGate3D x={wx} z={wz} bannerColor={bannerColor} />
            <Dock3D x={wx} z={wz} />
          </>
        );
      })()}

      {/* 内城/皇城 — a second, lower wall ring around the civic centre, raised
          only in great cities; gated south where the avenue enters. */}
      {grand && (() => {
        const W = preview.width, H = preview.height;
        const gateCol = Math.floor(W / 2);
        const { cells, ir0, ir1 } = innerWallCells(W, H);
        const [igx, igz] = hexWorld(gateCol, ir1);
        const avenueCross = (c: { col: number; row: number }) => c.col === gateCol && (c.row === ir0 || c.row === ir1);
        return (
          <>
            {cells.filter((c) => !avenueCross(c)).map((c) => {
              const [x, z] = hexWorld(c.col, c.row);
              return <InnerWallSeg3D key={`iw-${c.col}-${c.row}`} x={x} z={z} />;
            })}
            <InnerGate3D x={igx} z={igz} bannerColor={bannerColor} />
          </>
        );
      })()}

      {/* Cross-city canal — lesser cities (no inner wall) get a waterway with
          stone banks and bridges where the avenue/streets cross it. */}
      {!grand && (() => {
        const W = preview.width, H = preview.height;
        const cr = canalRow(H);
        const [x0] = hexWorld(1, cr);
        const [x1, cz] = hexWorld(W - 2, cr);
        const cxMid = (x0 + x1) / 2;
        const lenX = Math.abs(x1 - x0) + HEX_COL_STEP;
        const bridgeCols = [Math.floor(W / 2), Math.round(W * 0.25), Math.round(W * 0.75)];
        return (
          <group>
            {/* Water channel */}
            <mesh position={[cxMid, -0.04, cz]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
              <planeGeometry args={[lenX, HEX_ROW_STEP * 1.1]} />
              <meshStandardMaterial color="#2c5882" roughness={0.32} metalness={0.45} />
            </mesh>
            {/* Stone banks north & south */}
            {[-1, 1].map((s, i) => (
              <mesh key={i} position={[cxMid, 0.08, cz + s * HEX_ROW_STEP * 0.62]} castShadow receiveShadow>
                <boxGeometry args={[lenX, 0.2, 0.22]} />
                <meshStandardMaterial color="#9a8f78" roughness={0.94} />
              </mesh>
            ))}
            {bridgeCols.map((bc, i) => {
              const [bx] = hexWorld(bc, cr);
              return <CanalBridge3D key={`cb${i}`} x={bx} z={cz} />;
            })}
          </group>
        );
      })()}

      {/* 城外腹地 — real-geography countryside in every direction, roads to
          each neighbour, and the 8 defence slots on their compass bearings. */}
      <Hinterland3D
        preview={preview}
        city={city}
        neighbors={neighbors}
        facilities={facilities}
        armies={armies}
        stockades={stockades}
        ports={ports}
        scars={scars}
        slots={slots}
        selectedSlot={selectedSlot}
        onSlotClick={onSlotClick}
        showOverlays={showOverlays}
      />

      {/* Building foundations (地基) — real buildings sit on their plots, empty
          ones show a gold buildable ring; tap one to open the build menu. */}
      {plots.map((p, i) => {
        const [x, z] = hexWorld(p.col, p.row);
        const occupied = buildingHexes.has(`${p.col},${p.row}`);
        return (
          <FoundationPlot3D
            key={`plot-${p.col}-${p.row}`}
            x={x} z={z}
            occupied={occupied}
            selected={selectedPlot === i}
            onClick={occupied ? undefined : () => onPlotClick(i)}
          />
        );
      })}

      {/* 營建幻影 — hover a build option: its ghost stands on the plot. */}
      {ghostBuilding != null && selectedPlot != null && plots[selectedPlot] && (() => {
        const [gx, gz] = hexWorld(plots[selectedPlot].col, plots[selectedPlot].row);
        return <GhostBuilding3D x={gx} z={gz} buildingId={ghostBuilding} />;
      })()}

      {/* Buildings still under construction — scaffolding + 建造中 banner. */}
      {construction.map((c) => {
        const [x, z] = hexWorld(c.coord.col, c.coord.row);
        return <ConstructionSite3D key={`cons-${c.coord.col}-${c.coord.row}`} x={x} z={z} nameZh={c.nameZh} />;
      })}

      {/* Living-city dwellings + central 府衙 (cosmetic) */}
      <CityDwellings3D preview={preview} cityWallCol={cityWallCol} occupied={occupiedHexes} bannerColor={bannerColor} stats={stats} grand={grand} landmarkInfo={landmarkInfo} weatherKind={weatherKind} ruined={!!city.ruined} isCapital={isCapital} specialty={specialty} troops={city.troops} activity={activity} plagued={plagued} season={season} figures={figures} night={night} encounter={encounter} onEncounterClick={onEncounterClick} household={household} />

      {/* A few birds wheeling over the rooftops */}
      <Birds3D
        cx={(preview.width * HEX_COL_STEP) / 2}
        cz={(preview.height * HEX_ROW_STEP) / 2}
        radius={Math.min(preview.width * HEX_COL_STEP, preview.height * HEX_ROW_STEP) * 0.32}
        y={8}
      />

      {/* Inside-city buildings */}
      {buildings.map((b) => (
        <InsideBuilding3D
          key={`bld-${b.coord.col},${b.coord.row}`}
          coord={b.coord}
          buildingId={b.buildingId}
          level={b.level}
          damaged={b.damaged}
        />
      ))}

     </InspectCtx.Provider>
     </NightCtx.Provider>
    </SeasonCtx.Provider>
  );
}

/* ─── 市易 — inline grain market for the 市集 inspect card (金⇄糧 at the
 *  city's live, season-bent rate), so the player needn't open the flat panel. */
function MarketTradeRow({ city, season, cityId, tradeFood, onTraded }: {
  city: City;
  season: Season;
  cityId: EntityId;
  tradeFood: (cityId: EntityId, kind: 'buy' | 'sell', amount: number) => { ok: boolean; got: number };
  onTraded: (msg: string) => void;
}) {
  const t = useT();
  const lang = useLanguage();
  const buildings = useGameStore((s) => s.buildings);
  const allCities = useGameStore((s) => s.cities);
  const forces = useGameStore((s) => s.forces);
  const diplomacy = useGameStore((s) => s.diplomacy);
  const playerForceId = useGameStore((s) => s.playerForceId);
  const borderTrade = useGameStore((s) => s.borderTrade);
  const tradeHorses = useGameStore((s) => s.tradeHorses);
  const tradeIron = useGameStore((s) => s.tradeIron);
  const mkt = { stability: buildingBonuses(cityId, buildings).priceStability };
  const shock = useMarketShock(cityId);
  const outlook = marketOutlook(city, season, mkt, shock);
  // 榷場 — adjacent foreign cities of forces we're at peace with.
  const tariff = borderTariff(buildingBonuses(cityId, buildings).tradeMul);
  const borderPartners = city.adjacentCityIds
    .map((nid) => allCities[nid])
    .filter((n) => !!n && n.ownerForceId != null && n.ownerForceId !== playerForceId
      && (getRelation(diplomacy, playerForceId!, n.ownerForceId).status === 'allied'
        || getRelation(diplomacy, playerForceId!, n.ownerForceId).status === 'non-aggression'));
  const rate = outlook.spot;
  const levelTag = outlook.level === 'cheap'
    ? { t: '穀賤', c: '#9ac06a' }
    : outlook.level === 'dear'
      ? { t: '穀貴', c: '#e07a5a' }
      : { t: '平', c: '#8a7858' };
  const nextArrow = outlook.nextDir === 'cheaper' ? '↓賤' : outlook.nextDir === 'dearer' ? '↑貴' : '→平';
  const btn = (label: string, disabled: boolean, onClick: () => void, key: string) => (
    <button key={key} disabled={disabled} onClick={onClick} style={{
      background: disabled ? 'transparent' : '#2a1f14',
      border: `1px solid ${disabled ? '#3a2d20' : '#d4a84a'}`,
      color: disabled ? '#5a4a35' : '#f0d98a',
      padding: '0.26rem 0.5rem', cursor: disabled ? 'not-allowed' : 'pointer',
      fontFamily: 'inherit', fontSize: '0.72rem',
    }}>{label}</button>
  );
  return (
    <div style={{ marginTop: 8, borderTop: '1px solid #3a2d20', paddingTop: 6, fontSize: '0.72rem', color: '#c0a878' }}>
      <div style={{ marginBottom: 5 }}>
        <span style={{ color: '#8a7858' }}>{t('市易', 'Market')}</span> {t('糧價', 'Grain')} <strong style={{ color: '#d4a84a' }}>{rate.toFixed(1)}</strong> {t('糧/金', 'per gold')}
        <span style={{ marginLeft: 6, color: levelTag.c }}>{levelTag.t}</span>
        <span style={{ marginLeft: 6, color: '#8a7050' }}>{t('來季', 'Next')} {nextArrow}</span>
        <span style={{ marginLeft: 8, color: '#8a7050' }}>{t('庫', 'Held')} {t('金', 'G')}{city.gold.toLocaleString()} · {t('糧', 'F')}{city.food.toLocaleString()}</span>
      </div>
      {outlook.warnings.length > 0 && (
        <div style={{ marginBottom: 5, color: '#e0a060', fontSize: '0.68rem' }}>
          {outlook.warnings.map((w, i) => <div key={i}>⚠ {w.zh}</div>)}
        </div>
      )}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, alignItems: 'center' }}>
        <span style={{ color: '#9ac06a', marginRight: 2 }}>{t('買糧', 'Buy')}</span>
        {[500, 2000].map((g) => btn(`${g}${t('金', 'G')}→${buyQuote(city, season, g, mkt).toLocaleString()}${t('糧', 'F')}`, city.gold < g, () => {
          const r = tradeFood(cityId, 'buy', g);
          if (r.ok) playSfx('coin');
          onTraded(r.ok
            ? t(`市易:${g} 金易得 ${r.got.toLocaleString()} 糧。`, `Market: ${g} gold bought ${r.got.toLocaleString()} grain.`)
            : t('府庫金不足。', 'Not enough gold in the treasury.'));
        }, `b${g}`))}
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, alignItems: 'center', marginTop: 4 }}>
        <span style={{ color: '#e0c060', marginRight: 2 }}>{t('賣糧', 'Sell')}</span>
        {[1000, 5000].map((f) => btn(`${f.toLocaleString()}${t('糧', 'F')}→${sellQuote(city, season, f, mkt).toLocaleString()}${t('金', 'G')}`, city.food < f, () => {
          const r = tradeFood(cityId, 'sell', f);
          if (r.ok) playSfx('coin');
          onTraded(r.ok
            ? t(`市易:${f.toLocaleString()} 糧易得 ${r.got.toLocaleString()} 金。`, `Market: ${f.toLocaleString()} grain fetched ${r.got.toLocaleString()} gold.`)
            : t('存糧不足。', 'Not enough grain in store.'));
        }, `s${f}`))}
      </div>
      {(() => {
        const producer = CITY_SPECIALTY[cityId] === 'horse';
        const held = city.warhorses ?? 0;
        // Show the 馬市 wherever horses are bred (producer) or already stabled.
        if (!producer && held <= 0) return null;
        const buyGold = 1000, sellH = 500;
        const buyGet = buyHorses(city, producer, buyGold, mkt);
        const sellGet = sellHorses(city, producer, sellH, mkt);
        return (
          <div style={{ marginTop: 7, borderTop: '1px dashed #3a2d20', paddingTop: 6 }}>
            <div style={{ color: '#c8a258', marginBottom: 4 }}>
              {t('馬市', 'Horse Market')} <span style={{ color: '#7a6a4a', fontSize: '0.66rem' }}>· {t('戰馬', 'Warhorses')} {held.toLocaleString()} {producer ? t('· 產馬之地(價賤)', '· breeding region (cheap)') : t('· 非產地(價貴)', '· imported (dear)')}</span>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, alignItems: 'center' }}>
              {btn(`${t('糴', 'Buy')} ${buyGold}${t('金', 'G')}→${buyGet.toLocaleString()}${t('馬', 'H')}`, city.gold < buyGold || buyGet <= 0, () => {
                const r = tradeHorses(cityId, 'buy', buyGold);
                if (r.ok) playSfx('coin');
                onTraded(r.ok
                  ? t(`馬市:${buyGold} 金購得 ${r.got.toLocaleString()} 戰馬。`, `Horse market: ${buyGold} gold bought ${r.got.toLocaleString()} warhorses.`)
                  : t('無法購馬。', 'Cannot buy horses.'));
              }, 'hb')}
              {btn(`${t('糶', 'Sell')} ${sellH}${t('馬', 'H')}→${sellGet.toLocaleString()}${t('金', 'G')}`, held < sellH || sellGet <= 0, () => {
                const r = tradeHorses(cityId, 'sell', sellH);
                if (r.ok) playSfx('coin');
                onTraded(r.ok
                  ? t(`馬市:${sellH} 戰馬售得 ${r.got.toLocaleString()} 金。`, `Horse market: ${sellH} warhorses fetched ${r.got.toLocaleString()} gold.`)
                  : t('戰馬不足。', 'Not enough warhorses.'));
              }, 'hs')}
              <span style={{ color: '#7a6a4a', fontSize: '0.64rem' }}>{t('馬充軍備,提升募兵上限', 'Horses raise your recruitment ceiling')}</span>
            </div>
          </div>
        );
      })()}
      {(() => {
        const producer = CITY_SPECIALTY[cityId] === 'iron';
        const held = city.iron ?? 0;
        if (!producer && held <= 0) return null;
        const buyGold = 1000, sellI = 800;
        const buyGet = buyIron(city, producer, buyGold, mkt);
        const sellGet = sellIron(city, producer, sellI, mkt);
        return (
          <div style={{ marginTop: 7, borderTop: '1px dashed #3a2d20', paddingTop: 6 }}>
            <div style={{ color: '#c8a258', marginBottom: 4 }}>
              {t('鐵市', 'Iron Market')} <span style={{ color: '#7a6a4a', fontSize: '0.66rem' }}>· {t('鐵', 'Iron')} {held.toLocaleString()} {producer ? t('· 冶鐵之饒(價賤)', '· smelting region (cheap)') : t('· 非產地(價貴)', '· imported (dear)')}</span>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, alignItems: 'center' }}>
              {btn(`${t('糴', 'Buy')} ${buyGold}${t('金', 'G')}→${buyGet.toLocaleString()}${t('鐵', 'I')}`, city.gold < buyGold || buyGet <= 0, () => {
                const r = tradeIron(cityId, 'buy', buyGold);
                if (r.ok) playSfx('coin');
                onTraded(r.ok
                  ? t(`鐵市:${buyGold} 金購得 ${r.got.toLocaleString()} 鐵。`, `Iron market: ${buyGold} gold bought ${r.got.toLocaleString()} iron.`)
                  : t('無法購鐵。', 'Cannot buy iron.'));
              }, 'ib')}
              {btn(`${t('糶', 'Sell')} ${sellI}${t('鐵', 'I')}→${sellGet.toLocaleString()}${t('金', 'G')}`, held < sellI || sellGet <= 0, () => {
                const r = tradeIron(cityId, 'sell', sellI);
                if (r.ok) playSfx('coin');
                onTraded(r.ok
                  ? t(`鐵市:${sellI} 鐵售得 ${r.got.toLocaleString()} 金。`, `Iron market: ${sellI} iron fetched ${r.got.toLocaleString()} gold.`)
                  : t('存鐵不足。', 'Not enough iron in store.'));
              }, 'is')}
              <span style={{ color: '#7a6a4a', fontSize: '0.64rem' }}>{t('鐵料自給,鍛造打折', 'Home-smelted iron discounts forging')}</span>
            </div>
          </div>
        );
      })()}
      {borderPartners.length > 0 && (
        <div style={{ marginTop: 7, borderTop: '1px dashed #3a2d20', paddingTop: 6 }}>
          <div style={{ color: '#c8a258', marginBottom: 4 }}>{t('榷場', 'Border Market')} <span style={{ color: '#7a6a4a', fontSize: '0.66rem' }}>· {t(`與通好鄰邦互市(關稅 ${(tariff * 100).toFixed(0)}%)`, `trade with friendly neighbours (tariff ${(tariff * 100).toFixed(0)}%)`)}</span></div>
          {borderPartners.map((n) => {
            const nMkt = { stability: buildingBonuses(n.id, buildings).priceStability };
            const nRate = foodRate(n, season, nMkt);
            const fname = pickName(forces[n.ownerForceId!]?.name, lang) || t('鄰邦', 'neighbour');
            const buyGold = 1000, sellFood = 2000;
            const buyGet = Math.floor(buyQuote(n, season, buyGold, nMkt) * (1 - tariff));
            const sellGet = Math.floor(sellQuote(n, season, sellFood, nMkt) * (1 - tariff));
            return (
              <div key={n.id} style={{ marginBottom: 4 }}>
                <div style={{ color: '#a89878', fontSize: '0.68rem', marginBottom: 2 }}>
                  {fname}·{pickName(n.name, lang)} <span style={{ color: nRate > 11 ? '#9ac06a' : nRate < 9 ? '#e07a5a' : '#8a7858' }}>{t('糧價', 'Grain')} {nRate.toFixed(1)}</span>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                  {btn(`${t('糴', 'Buy')} ${buyGold}${t('金', 'G')}→${buyGet.toLocaleString()}${t('糧', 'F')}`, city.gold < buyGold || buyGet <= 0, () => {
                    const r = borderTrade(cityId, n.id, 'buy', buyGold);
                    if (r.ok) playSfx('coin');
                    onTraded(r.ok
                      ? t(`榷場:${buyGold} 金糴得 ${r.got.toLocaleString()} 糧。`, `Border market: ${buyGold} gold bought ${r.got.toLocaleString()} grain.`)
                      : t(`榷場交易未成(${r.reason ?? '失敗'})。`, `Border trade failed (${r.reason ?? 'refused'}).`));
                  }, `qb${n.id}`)}
                  {btn(`${t('糶', 'Sell')} ${sellFood.toLocaleString()}${t('糧', 'F')}→${sellGet.toLocaleString()}${t('金', 'G')}`, city.food < sellFood || sellGet <= 0, () => {
                    const r = borderTrade(cityId, n.id, 'sell', sellFood);
                    if (r.ok) playSfx('coin');
                    onTraded(r.ok
                      ? t(`榷場:${sellFood.toLocaleString()} 糧糶得 ${r.got.toLocaleString()} 金。`, `Border market: ${sellFood.toLocaleString()} grain fetched ${r.got.toLocaleString()} gold.`)
                      : t(`榷場交易未成(${r.reason ?? '失敗'})。`, `Border trade failed (${r.reason ?? 'refused'}).`));
                  }, `qs${n.id}`)}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ─── Top-level screen ──────────────────────────────────────────────── */
export function CityMapScreen3D({ cityId, onClose }: {
  cityId: EntityId;
  onClose: () => void;
}) {
  // Thin shell — the early bail lives HERE so the inner component's ~20 hooks
  // always run unconditionally (the old in-body `if (!city) return null`
  // violated the Rules of Hooks for every hook declared after it).
  const city = useGameStore((s) => s.cities[cityId]);
  if (!city) return null;
  return <CityMapScreen3DInner city={city} cityId={cityId} onClose={onClose} />;
}

function CityMapScreen3DInner({ city, cityId, onClose }: {
  city: import('../../game/types').City;
  cityId: EntityId;
  onClose: () => void;
}) {
  // WebGL 上下文丟失恢復 + FPS 自適應 — same two guards the world map carries.
  const { glEpoch, attachGLRecovery } = useGLRecovery('CityMapScreen3D');
  const [gfxDegraded, setGfxDegraded] = useState(false);
  const playerForceId = useGameStore((s) => s.playerForceId);
  const forces = useGameStore((s) => s.forces);
  const allCities = useGameStore((s) => s.cities);
  const allForts = useGameStore((s) => s.forts);
  const allArmies = useGameStore((s) => s.armies);
  const allBuildings = useGameStore((s) => s.buildings);
  const officersMap = useGameStore((s) => s.officers);
  const appointments = useGameStore((s) => s.appointments);
  const pendingCommands = useGameStore((s) => s.pendingCommands);
  const date = useGameStore((s) => s.date);
  const taxPolicy = useGameStore((s) => s.taxPolicy);
  const inflation = useGameStore((s) => s.inflation ?? 0);
  const weatherKind = useGameStore((s) => (s.weather?.kind ?? 'clear') as WeatherKind);
  // 疫病 — struck by plague last season: mourning banners + emptied lanes.
  const plagued = useGameStore((s) => (s.plagueRiskCityIds ?? []).includes(cityId));
  // 街頭際遇 — at most one per city per season, deterministic per (city,
  // season) so re-entering the view never re-rolls it.
  const streetEncounters = useGameStore((s) => s.streetEncounters);
  const resolveStreetEncounter = useGameStore((s) => s.resolveStreetEncounter);
  const [encounterOpen, setEncounterOpen] = useState(false);
  const tradeFood = useGameStore((s) => s.tradeFood);
  const autoAssignIdle = useGameStore((s) => s.autoAssignIdle);
  const relocateCapital = useGameStore((s) => s.relocateCapital);
  const capitalMoveUsed = useGameStore((s) => s.capitalMoveUsed);
  const [assignMsg, setAssignMsg] = useState<string | null>(null);
  const buildAction = useGameStore((s) => s.buildDefenseStructure);
  const upgradeAction = useGameStore((s) => s.upgradeDefenseStructure);
  const demolishAction = useGameStore((s) => s.demolishDefenseStructure);
  const startBuilding = useGameStore((s) => s.startBuilding);
  const startPracticeBattle = useGameStore((s) => s.startPracticeBattle);
  const season = useGameStore((s) => s.date.season) as SeasonKey;
  const phase = useGameStore((s) => s.date.phase);
  const baseLight = SEASON_LIGHT[season] ?? SEASON_LIGHT.spring;
  // 天時入景 — the weather bends the city's light, not just its harvest:
  // a drought bakes the air amber and hazy, rain greys it down, ruin drains
  // the colour out. The scene reads its own crisis at a glance.
  const light = useMemo(() => {
    let L = { ...baseLight };
    // 旬相入城 — the city keeps the strategic map's clock: 上旬白晝、中旬
    // 黃昏、下旬月夜. Dusk warms and lowers the sun; night goes deep blue,
    // lanterns carrying the streets (nightGlow → full).
    if (phase === 'middle') {
      L = { ...L, ambient: L.ambient * 0.72, ambientColor: '#f4c890', sun: '#ff9a58', sunI: L.sunI * 0.6, sunPos: [18, 5, 6], fog: '#c8a080', sky: 'linear-gradient(180deg, #b8683a 0%, #e0aa74 100%)', nightGlow: Math.max(L.nightGlow, 0.6) };
    } else if (phase === 'lower') {
      L = { ...L, ambient: L.ambient * 0.42, ambientColor: '#9aa8c8', sun: '#b8c8e8', sunI: L.sunI * 0.3, sunPos: [-8, 14, -6], fog: '#3a4458', sky: 'linear-gradient(180deg, #1a2338 0%, #2c3a54 100%)', nightGlow: 1 };
    }
    if (weatherKind === 'drought') {
      L = { ...L, ambient: L.ambient * 1.05, ambientColor: '#f4d79a', sun: '#ffdf9a', sunI: L.sunI * 1.12, fog: '#d8c690' };
    } else if (weatherKind === 'rain') {
      L = { ...L, ambient: L.ambient * 0.7, ambientColor: '#9fb0bc', sun: '#b8c4cc', sunI: L.sunI * 0.5, fog: '#8a98a2', nightGlow: Math.max(L.nightGlow, 0.5) };
    } else if (weatherKind === 'wind') {
      L = { ...L, fog: '#cabfa0' };
    }
    if (city.ruined) {
      L = { ...L, ambient: L.ambient * 0.78, ambientColor: '#b8a890', sun: '#c8b89a', sunI: L.sunI * 0.7, fog: '#7a6e5c', nightGlow: Math.max(L.nightGlow, 0.4) };
    }
    return L;
  }, [baseLight, phase, weatherKind, city.ruined]);
  const [selectedSlot, setSelectedSlot] = useState<number | null>(null);
  const [selectedPlot, setSelectedPlot] = useState<number | null>(null);
  // 營建幻影 — the build option currently hovered in the panel.
  const [ghostBuilding, setGhostBuilding] = useState<BuildingId | null>(null);
  useEffect(() => { setGhostBuilding(null); }, [selectedPlot]);
  const [buildMsg, setBuildMsg] = useState<string | null>(null);
  const [inspect, setInspect] = useState<InspectInfo | null>(null);
  const [pickerCmd, setPickerCmd] = useState<InternalAffairsType | null>(null);
  const [hovered, setHovered] = useState<{ col: number; row: number } | null>(null);
  const [showOverlays, setShowOverlays] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [introDone, setIntroDone] = useState(false);
  // Exit by rising back up toward the strategic-map vantage, then unmount.
  // A timeout OWNS the close so we never depend on the camera animation's
  // callback firing — clicking × always gets you out.
  const [exiting, setExiting] = useState(false);
  const closingRef = useRef(false);
  const beginClose = () => {
    if (closingRef.current) return;
    closingRef.current = true;
    playSfx('whoosh');
    setExiting(true);
    window.setTimeout(onClose, 480);
  };
  const lang = useLanguage();
  const t = useT();

  const rawPreview = useMemo(
    () => previewBattlefield(cityId, {
      terrain: city?.terrain, port: city?.port,
      x: city?.coords.x, y: city?.coords.y,
    }, 30, 19, true), // city view uses a big, consistent grid (forceSize); 30×19 → 45 raw plots (sliced to building-type count)
    [cityId, city?.terrain, city?.port, city?.coords.x, city?.coords.y],
  );
  // Inside the walls the ground is a city, not a battlefield — flatten the
  // wilderness (mountains, hills, trees) to level ground, keeping only water
  // as the odd pond/canal.
  const preview = useMemo(() => ({
    ...rawPreview,
    tiles: rawPreview.tiles.map((tl) =>
      WILDERNESS_TERRAIN.has(tl.terrain as string) ? { ...tl, terrain: 'plain' as typeof tl.terrain } : tl,
    ),
  }), [rawPreview]);

  const isPlayer = city.ownerForceId === playerForceId;
  const slots = city.buildSlots ?? [];
  const size = citySize(city);
  const total = aggregateSlotEffects(slots);
  const builtCount = slots.filter((s) => s.buildingId).length;
  const cityWallCol = preview.width - 1;
  const ownerForce = city.ownerForceId ? forces[city.ownerForceId] : null;
  const bannerColor = ownerForce?.color ?? '#5a4530';
  // Live data the 3D scene reflects — a bustling market means high commerce, a
  // big farm means high agriculture, crowds mean population, lanterns mean a
  // loyal populace. The city view becomes a readout of its own numbers.
  const cap = size.statCap || 100;
  const econCap = size.econCap || cap;
  // 施政預覽 — for each command button, estimate the gain the city's BEST idle
  // officer would yield, so the player can judge value before opening the picker.
  const apptBonus = useMemo(
    () => appointmentBonusFor(city.ownerForceId, appointments, officersMap, cityId),
    [city.ownerForceId, appointments, officersMap, cityId],
  );
  const idleOfficers = useMemo(
    () => Object.values(officersMap).filter(
      (o) => o.locationCityId === cityId && o.forceId === city.ownerForceId && o.status === 'idle' && !o.task,
    ),
    [officersMap, cityId, city.ownerForceId],
  );
  // 在城武將 — every officer garrisoned here (興学 lectures lift them all).
  const stationedCount = useMemo(
    () => Object.values(officersMap).filter(
      (o) => o.locationCityId === cityId && o.forceId === city.ownerForceId,
    ).length,
    [officersMap, cityId, city.ownerForceId],
  );
  // 裝飾地標的活文本 — 鐘鼓樓報時、寶塔登高瞭望最近的異旗之城、園林記在城雅集之眾。
  const landmarkInfo = useMemo<LandmarkInfo>(() => {
    const seasonZh = SEASON_LABEL[date.season as Season]?.zh ?? '';
    const timeBody = `晨鐘暮鼓,司一城之辰刻。今為 ${date.year} 年 · ${seasonZh}季;城中現有武將 ${stationedCount} 員。`;
    let nearest: typeof city | null = null;
    let nd = Infinity;
    for (const c of Object.values(allCities)) {
      if (c.id === cityId || c.ownerForceId === city.ownerForceId) continue;
      const d = Math.hypot(c.coords.x - city.coords.x, c.coords.y - city.coords.y);
      if (d < nd) { nd = d; nearest = c; }
    }
    let pagodaBody: string;
    if (nearest) {
      const dx = nearest.coords.x - city.coords.x;
      const dy = nearest.coords.y - city.coords.y;
      const dir = ['東', '東南', '南', '西南', '西', '西北', '北', '東北'][
        Math.round(((Math.atan2(dy, dx) + Math.PI * 2) % (Math.PI * 2)) / (Math.PI / 4)) % 8
      ];
      const ownerZh = nearest.ownerForceId ? (forces[nearest.ownerForceId]?.name.zh ?? '在野') : '在野';
      pagodaBody = `登高瞭望:最近的異旗之城為${dir}面的「${nearest.name.zh}」(${ownerZh}),憑欄可望其旌旗。`;
    } else {
      pagodaBody = '登高瞭望:四望皆我疆土,邊塵不驚。';
    }
    const gardenBody = stationedCount > 0
      ? `官家園池,曲橋亭榭、蓮葉垂柳。今城中 ${stationedCount} 員文武在此雅集休憩,情誼漸篤。`
      : '官家園池,曲橋亭榭、蓮葉垂柳。惜城中無將,池榭空寂。';
    return { timeBody, pagodaBody, gardenBody };
  }, [date.year, date.season, stationedCount, allCities, cityId, city, forces]);
  // 府衙度支 — this city's own seasonal ledger, via the SAME engine the season
  // settles with (not an estimate). Surfaced at the 府衙 so the player needn't
  // leave the city view for the 度支簿.
  const cityEcon = useMemo(() => {
    const cityOfficers = Object.values(officersMap).filter(
      (o) => o.locationCityId === cityId && o.forceId === city.ownerForceId,
    );
    const tax = city.ownerForceId ? (taxPolicy?.[city.ownerForceId] ?? 'normal') : 'normal';
    const infl = city.ownerForceId === playerForceId ? inflation : 0;
    const statecraft = city.ownerForceId ? (forces[city.ownerForceId]?.statecraft ?? null) : null;
    return tickCityEconomy(city, date.season as Season, cityOfficers, tax, infl, weatherKind, allBuildings, statecraft);
  }, [city, officersMap, cityId, taxPolicy, inflation, playerForceId, forces, date.season, weatherKind, allBuildings]);
  const isCapital = !!playerForceId && forces[playerForceId]?.capitalCityId === cityId;
  const specialty = useMemo(() => citySpecialty(cityId), [cityId]);
  // 施政中 — which landmarks have an order queued this season, so the scene can
  // show the work in progress (field hands at the 屯田, drilling at the 校場,
  // scaffolding on the walls…). Reads pendingCommands for this city.
  const activity = useMemo<CityActivity>(() => {
    const a: CityActivity = { farm: false, market: false, barracks: false, wall: false, hall: false, tavern: false };
    for (const c of Object.values(pendingCommands)) {
      if ((c as { cityId?: EntityId }).cityId !== cityId) continue;
      switch ((c as { type?: InternalAffairsType }).type) {
        case 'develop-agriculture': case 'major-agriculture': case 'flood-control': a.farm = true; break;
        case 'military-farming': a.farm = true; a.barracks = true; break;
        case 'develop-commerce': case 'major-commerce': a.market = true; break;
        case 'recruit-troops': case 'drill-troops': case 'garrison': a.barracks = true; break;
        case 'build-defense': case 'major-defense': case 'upgrade-wall': a.wall = true; break;
        case 'improve-loyalty': case 'relief': case 'anti-corruption': case 'encourage-migration': case 'promote-learning': a.hall = true; break;
        case 'search': a.tavern = true; break;
      }
    }
    return a;
  }, [pendingCommands, cityId]);
  // 兵制 (§4.8) — the 徵兵 preview must match what the levy will actually yield.
  const playerServiceSystem = useGameStore((s) => (s.playerForceId ? s.serviceSystem?.[s.playerForceId] : undefined));
  // Best-officer施政預覽 per command, computed once (memoised) rather than
  // re-scanning idleOfficers for every button on every render of the card.
  const previewByCmd = useMemo(() => {
    const out: Partial<Record<InternalAffairsType, ReturnType<typeof previewCommandGain>>> = {};
    const types = (Object.keys(COMMAND_DEFS) as CommandType[]).filter((k): k is InternalAffairsType => k !== 'march');
    for (const ct of types) {
      const stat = COMMAND_DEFS[ct].stat;
      let best: typeof idleOfficers[number] | null = null;
      let bestScore = -1;
      for (const o of idleOfficers) {
        const score = o.stats[stat] * commandFitMultiplier(o, ct);
        if (score > bestScore) { bestScore = score; best = o; }
      }
      out[ct] = best ? previewCommandGain(ct, best, city, {
        internalMultiplier: apptBonus.internalMultiplier,
        recruitBonus: apptBonus.recruitBonus,
      }, playerServiceSystem) : null;
    }
    return out;
  }, [idleOfficers, apptBonus, city]);
  const cityStats = {
    fCommerce: Math.min(1, city.commerce / cap),
    fAgri: Math.min(1, city.agriculture / cap),
    fLoyalty: Math.min(1, city.loyalty / (size.loyaltyCap || 100)),
    fPop: Math.min(1, city.population / 320000),
  };
  // 街頭際遇 — hash (city, season) → does a special figure stand in the
  // street this season, and who? Consumed via resolveStreetEncounter.
  const encounterInfo = useMemo(() => {
    const SEASON_IDX: Record<string, number> = { spring: 0, summer: 1, autumn: 2, winter: 3 };
    const stamp = date.year * 4 + (SEASON_IDX[date.season] ?? 0);
    if ((streetEncounters?.[cityId] ?? -1) >= stamp) return null;
    if (city.ruined || plagued) return null;
    const key = `${cityId}:${stamp}`;
    let h = 2166136261;
    for (let i = 0; i < key.length; i++) h = Math.imul(h ^ key.charCodeAt(i), 16777619);
    if (((h >>> 0) % 1000) / 1000 > 0.35) return null;
    const kinds = ['merchant', 'knight', 'soothsayer', 'storyteller'] as const;
    return { kind: kinds[(h >>> 4) % 4] };
  }, [cityId, date.year, date.season, streetEncounters, city.ruined, plagued]);

  // 家眷 — at the player's CAPITAL, the lord's household lives in the
  // residence by the yamen: spouse + children (heirs age toward 出仕 at 14).
  const familyRels = useGameStore((s) => s.family);
  const pendingHeirs = useGameStore((s) => s.pendingHeirs);
  const forcesAll = useGameStore((s) => s.forces);
  const playerForceIdSel = useGameStore((s) => s.playerForceId);
  const household = useMemo(() => {
    if (!playerForceIdSel) return null;
    const force = forcesAll[playerForceIdSel];
    if (!force || force.capitalCityId !== cityId) return null;
    const lord = officersMap[force.rulerOfficerId];
    if (!lord) return null;
    const spouseIds = familyRels
      .filter((r) => r.kind === 'spouse' && (r.officerA === lord.id || r.officerB === lord.id))
      .map((r) => (r.officerA === lord.id ? r.officerB : r.officerA));
    const spouses = spouseIds.map((id) => officersMap[id]).filter(Boolean);
    const kids = pendingHeirs
      .filter((h) => h.parentAId === lord.id || h.parentBId === lord.id)
      .map((h) => {
        const age = Math.max(0, date.year - h.birthYear);
        return { nameZh: h.name.zh, age, heir: !!(h as { designated?: boolean }).designated, female: h.female, comingSoon: age >= 12 };
      });
    if (spouses.length === 0 && kids.length === 0) return null;
    return { lordZh: lord.name.zh, spouses: spouses.map((o) => o!.name.zh), kids };
  }, [playerForceIdSel, forcesAll, cityId, officersMap, familyRels, pendingHeirs, date.year]);

  // 城中人物 — bucket this city's officers into the spots they'd be found:
  // martial officers (武≥72) drill at the barracks, the rest of the top
  // stationed officers stand before the yamen, discovered wanderers drink
  // at the tavern, and undiscovered ones show as anonymous silhouettes.
  const officerFigures = useMemo<CityFigures>(() => {
    const all = Object.values(officersMap);
    const stationed = all.filter((o) =>
      o.locationCityId === cityId && !!o.forceId && o.forceId === city.ownerForceId
      && (o.status === 'idle' || o.status === 'active'));
    const score = (o: Officer) =>
      o.stats.leadership + o.stats.war + o.stats.intelligence + o.stats.politics + o.stats.charisma;
    const byRank = [...stationed].sort((a, b) => score(b) - score(a));
    const martial = byRank.filter((o) => o.stats.war >= 72).slice(0, 2);
    const mIds = new Set(martial.map((o) => o.id));
    const hall = byRank.filter((o) => !mIds.has(o.id)).slice(0, 3);
    const wanderers = all.filter((o) =>
      o.locationCityId === cityId && !o.forceId && o.status !== 'dead' && o.status !== 'imprisoned');
    const tavern = wanderers.filter((o) => o.status !== 'unsearched').slice(0, 3);
    const hiddenCount = Math.min(2, wanderers.filter((o) => o.status === 'unsearched').length);
    return { hall, barracks: martial, tavern, hiddenCount };
  }, [officersMap, cityId, city.ownerForceId]);
  // Great cities raise a second, inner palace wall around the civic centre.
  const grandCity = size.id === 'capital' || size.id === 'large';

  const cityBuildingsAll = useMemo(
    () => allBuildings.filter((b) => b.cityId === cityId),
    [allBuildings, cityId],
  );
  // Buildable foundations (地基) inside the walls. Each building remembers the
  // plot it was placed on (b.plot); legacy/AI buildings without one fall back
  // to the first free plot in a deterministic order.
  // One foundation per possible building type — slice the raw grid to the
  // building-type count so there are never perpetually-empty buildable rings.
  const plots = useMemo(
    () => cityBuildPlots(preview.width, preview.height).slice(0, BUILDING_DEFS.length),
    [preview.width, preview.height],
  );
  const placed = useMemo(() => {
    const taken = new Set<number>();
    for (const b of cityBuildingsAll) if (typeof b.plot === 'number') taken.add(b.plot);
    let next = 0;
    const claim = () => { while (taken.has(next)) next++; taken.add(next); return next; };
    return cityBuildingsAll.map((b) => {
      const idx = typeof b.plot === 'number' ? b.plot : claim();
      return { building: b, plotIndex: idx, coord: plots[idx] };
    }).filter((p) => !!p.coord);
  }, [cityBuildingsAll, plots]);
  // Completed buildings get a real 3D block; in-progress ones (level 0,
  // progress > 0) show scaffolding so you can watch them go up.
  const insideBuildings = useMemo(
    () => placed.filter((p) => p.building.level > 0)
      .map((p) => ({ coord: p.coord, buildingId: p.building.id, level: p.building.level, damaged: !!p.building.damaged })),
    [placed],
  );
  const construction = useMemo(
    () => placed.filter((p) => p.building.level === 0 && p.building.progress > 0)
      .map((p) => ({ coord: p.coord, nameZh: INSIDE_BUILDING_DEF[p.building.id]?.nameZh ?? p.building.id })),
    [placed],
  );
  const presentTypes = useMemo(() => new Set(cityBuildingsAll.map((b) => b.id)), [cityBuildingsAll]);
  const plotByHex = useMemo(() => {
    const m = new Map<string, number>();
    plots.forEach((p, i) => m.set(`${p.col},${p.row}`, i));
    return m;
  }, [plots]);
  const buildingAtPlot = useMemo(() => {
    const m = new Map<number, typeof placed[number]['building']>();
    placed.forEach((p) => m.set(p.plotIndex, p.building));
    return m;
  }, [placed]);

  // Adjacent cities — used to draw a signed road in each one's true direction
  // and to tell which compass slot guards which approach.
  const neighbors = useMemo<Neighbor[]>(() => {
    if (!city) return [];
    return (city.adjacentCityIds ?? [])
      .map((id) => allCities[id])
      .filter((c): c is NonNullable<typeof c> => !!c)
      .map((c) => {
        const owner = c.ownerForceId ? forces[c.ownerForceId] : null;
        return {
          id: c.id,
          nameZh: pickName(c.name, lang),
          nameEn: c.name.en,
          x: c.coords.x,
          y: c.coords.y,
          color: owner?.color ?? '#8a7050',
          rel: (c.ownerForceId === playerForceId ? 'self'
            : c.ownerForceId ? 'other' : 'neutral') as Neighbor['rel'],
        };
      });
  }, [city, allCities, forces, playerForceId, lang]);

  // Strategic 施設 near this city — projected into the hinterland so the same
  // building shows on the world map, here, and (in range) on the battlefield.
  const nearbyFacilities = useMemo<HinterlandFacility[]>(() => {
    if (!city) return [];
    return Object.values(allForts)
      .filter((f) => f.facility)
      .map((f) => {
        const [fx, fy] = geoToPixel(f.coords.lon, f.coords.lat);
        const dx = fx - city.coords.x, dy = fy - city.coords.y;
        return {
          id: f.id, kind: f.facility!, dx, dy,
          dist: Math.hypot(dx, dy),
          owned: f.ownerForceId === playerForceId,
        };
      })
      .filter((f) => f.dist < 95); // only ones in this city's hinterland
  }, [allForts, city, playerForceId]);

  // 塢壘/關砦 (non-facility forts) near this city — same projection.
  const nearbyStockades = useMemo(() => {
    if (!city) return [] as Array<{ id: string; dx: number; dy: number; dist: number; nameZh: string; owned: boolean }>;
    return Object.values(allForts)
      .filter((f) => !f.facility)
      .map((f) => {
        const [fx, fy] = geoToPixel(f.coords.lon, f.coords.lat);
        const dx = fx - city.coords.x, dy = fy - city.coords.y;
        return { id: f.id, dx, dy, dist: Math.hypot(dx, dy), nameZh: pickName(f.name, lang), owned: f.ownerForceId === playerForceId };
      })
      .filter((f) => f.dist < 95);
  }, [allForts, city, playerForceId, lang]);

  // 港口 near this city — anchored at their true bearing.
  const allPorts = useGameStore((s) => s.ports);
  const nearbyPorts = useMemo(() => {
    if (!city) return [] as Array<{ id: string; dx: number; dy: number; dist: number; nameZh: string; owned: boolean }>;
    return Object.values(allPorts)
      .map((p) => {
        const [ppx, ppy] = geoToPixel(p.coords.lon, p.coords.lat);
        const dx = ppx - city.coords.x, dy = ppy - city.coords.y;
        return { id: p.id, dx, dy, dist: Math.hypot(dx, dy), nameZh: pickName(p.name, lang), owned: p.ownerForceId === playerForceId };
      })
      .filter((p) => p.dist < 95);
  }, [allPorts, city, playerForceId, lang]);

  // 戰痕 — recent battle sites near this city pulse on the hinterland too.
  const fieldBattleMarks = useGameStore((s) => s.fieldBattleMarks);
  const nearbyScars = useMemo(() => {
    if (!city) return [] as Array<{ dx: number; dy: number; dist: number; fresh: boolean }>;
    return fieldBattleMarks
      .map((m) => {
        const dx = m.x - city.coords.x, dy = m.y - city.coords.y;
        return { dx, dy, dist: Math.hypot(dx, dy), fresh: m.seasonsLeft >= 2 };
      })
      .filter((m) => m.dist < 95 && m.dist > 3);
  }, [fieldBattleMarks, city]);

  // Armies marching near this city — projected onto the hinterland so you watch
  // columns close in from their true direction (enemy columns flagged a threat).
  const nearbyArmies = useMemo<HinterlandArmy[]>(() => {
    if (!city) return [];
    return Object.values(allArmies)
      .map((a) => {
        const dx = a.x - city.coords.x, dy = a.y - city.coords.y;
        const force = forces[a.forceId];
        return {
          id: a.id, dx, dy, dist: Math.hypot(dx, dy),
          color: force?.color ?? '#8a7050',
          troops: a.troops,
          nameZh: force ? pickName(force.name, lang) : '',
          own: a.forceId === playerForceId,
          incoming: a.targetCityId === cityId,
        };
      })
      // Skip columns sitting on the city itself (garrison) and far-off ones.
      .filter((a) => a.dist > 4 && a.dist < 95);
  }, [allArmies, city, forces, playerForceId, cityId, lang]);

  // For the selected slot: which neighbour(s) lie in its compass octant.
  const slotGuards = useMemo(() => {
    const m = new Map<number, Neighbor[]>();
    if (!city) return m;
    for (const n of neighbors) {
      const oct = octantForWorldDir(n.x - city.coords.x, n.y - city.coords.y);
      const arr = m.get(oct) ?? [];
      arr.push(n);
      m.set(oct, arr);
    }
    return m;
  }, [neighbors, city]);

  const handleTileClick = (coord: { col: number; row: number }) => {
    if (!isPlayer) return;
    // Defence slots live out in the hinterland now (clicked directly); tapping
    // the city ground only opens building foundations.
    const plotIdx = plotByHex.get(`${coord.col},${coord.row}`);
    if (plotIdx !== undefined) {
      handlePlotClick(plotIdx);
      return;
    }
    setSelectedSlot(null);
    setSelectedPlot(null);
  };

  const handleSlotClick = (slot: number) => {
    if (!isPlayer) return;
    setSelectedSlot(slot);
    setSelectedPlot(null);
    setError(null);
  };

  // 守城演習 from a chosen approach — the assault rolls in along this slot's
  // bearing (from the real neighbour that way, else the compass octant), so the
  // battle board IS this direction's slice of the map at full combat scale.
  const drillFromSlot = (slot: number) => {
    if (!isPlayer || !city) return;
    const guard = (slotGuards.get(slot) ?? [])[0];
    const bearing = guard
      ? Math.atan2(city.coords.y - guard.y, city.coords.x - guard.x)
      : Math.atan2(-COMPASS_DIR[slot][1], -COMPASS_DIR[slot][0]);
    if (startPracticeBattle(cityId, bearing)) onClose();
  };

  const handlePlotClick = (plotIndex: number) => {
    if (!isPlayer) return;
    setSelectedSlot(null);
    setBuildMsg(null);
    setSelectedPlot(plotIndex);
  };

  const tryStartBuilding = (plotIndex: number, id: BuildingId) => {
    setBuildMsg(null);
    const r = startBuilding(cityId, id, plotIndex);
    if (!r.ok) {
      const reasons: Record<string, string> = {
        'not enough gold': '城内存金不足',
        'max level': '已達最高等級',
        'already in progress': '已在建造中',
        'not your city': '非我方城池',
      };
      setBuildMsg(reasons[r.reason ?? ''] ?? r.reason ?? '無法建造');
    } else {
      playSfx('thud');
      setSelectedPlot(null);
    }
  };

  const tryUpgradeBuilding = (id: BuildingId) => {
    setBuildMsg(null);
    const r = startBuilding(cityId, id);
    if (!r.ok) {
      const reasons: Record<string, string> = {
        'not enough gold': '城内存金不足',
        'max level': '已達最高等級',
        'already in progress': '已在建造中',
      };
      setBuildMsg(reasons[r.reason ?? ''] ?? r.reason ?? '無法升級');
    } else {
      playSfx('thud');
    }
  };

  const tryBuild = (slot: number, id: DefenseBuildingId) => {
    setError(null);
    const r = buildAction(cityId, slot, id);
    if (!r.ok) setError(r.reason ?? 'Failed');
    else { playSfx('thud'); setSelectedSlot(null); }
  };
  const tryUpgrade = (slot: number) => {
    setError(null);
    const r = upgradeAction(cityId, slot);
    if (!r.ok) setError(r.reason ?? 'Failed');
    else playSfx('thud');
  };
  const tryDemolish = (slot: number) => {
    demolishAction(cityId, slot);
    setSelectedSlot(null);
  };

  const centerX = (preview.width * HEX_COL_STEP) / 2;
  const centerZ = (preview.height * HEX_ROW_STEP) / 2;
  // Frame the whole city — pull the camera back in proportion to its size.
  const citySpan = Math.max(preview.width * HEX_COL_STEP, preview.height * HEX_ROW_STEP);
  const camHeight = citySpan * 0.62;
  const camOffset = citySpan * 0.64;

  const ALL_BUILDINGS: DefenseBuildingId[] = [
    'watchtower', 'beacon', 'caltrops', 'lookout',
    'barracks-out', 'granary-out',
    'iron-chains', 'rockfall', 'arrow-platform',
  ];

  const currentSlot = selectedSlot !== null ? slots.find((s) => s.slot === selectedSlot) : null;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') beginClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  // City soundscape while the 城内 view is open.
  useEffect(() => {
    playSfx('open-modal');
    startCityAmbience();
    return () => stopCityAmbience();
  }, []);

  return (
    <div className="tkm-city-enter" style={{
      position: 'fixed', inset: 0, background: '#0a0805', zIndex: 320,
      display: 'flex', flexDirection: 'column',
    }}>
      {/* Header bar */}
      <header style={{
        padding: '0.6rem 1rem',
        background: 'linear-gradient(180deg, #1f1610 0%, rgba(31,22,16,0.85) 100%)',
        borderBottom: '1px solid #4a3520',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        zIndex: 10,
      }}>
        <div style={{ color: '#d4a84a', fontFamily: 'var(--tkm-font-body)', letterSpacing: '0.1rem' }}>
          <span style={{ fontSize: '1.3rem' }}>{pickName(city.name, lang)}</span>
          <span style={{ fontSize: '0.85rem', color: size.color, marginLeft: '0.6rem' }}>{pickName(size.name, lang)}</span>
          <span style={{ fontSize: '0.7rem', color: '#8a7050', marginLeft: '0.8rem' }}>
            {builtCount}/8 防禦
            {total.defenseBonus > 0 && ` · +${total.defenseBonus} 守備`}
            {total.rangedPrestrike > 0 && t(` · 預射 ${total.rangedPrestrike}`, ` · Volley ${total.rangedPrestrike}`)}
          </span>
        </div>
        <div style={{ display: 'flex', gap: '0.4rem' }}>
          {isPlayer && idleOfficers.length > 0 && (
            <button
              onClick={() => {
                const r = autoAssignIdle();
                playSfx(r.assigned > 0 ? 'bell' : 'pluck');
                setAssignMsg(r.assigned > 0
                  ? t(`一鍵委派:${r.assigned} 員領命${r.goldSpent > 0 ? `,耗 ${r.goldSpent} 金` : ''}。`, `Auto-assign: ${r.assigned} took post${r.goldSpent > 0 ? `, ${r.goldSpent} gold spent` : ''}.`)
                  : '無閒置武將可委派(或城已委任太守自理)。');
                window.setTimeout(() => setAssignMsg(null), 3200);
              }}
              title={t('把城中閒置武將按需求×適性自動派活', 'Auto-assign idle officers by need × aptitude')}
              style={{
                background: 'rgba(126, 214, 138, 0.16)',
                border: '1px solid rgba(126, 214, 138, 0.5)', borderRadius: 'var(--tkm-radius-lg)',
                color: '#bfeebf', padding: '0.3rem 0.6rem',
                fontFamily: 'var(--tkm-font-body)', fontSize: '0.7rem', cursor: 'pointer',
                letterSpacing: '0.08rem',
              }}
            >
              一鍵委派 ({idleOfficers.length})
            </button>
          )}
          <button
            onClick={() => setShowOverlays(!showOverlays)}
            aria-pressed={showOverlays}
            aria-label={t('戰術疊加', 'Tactical overlay')}
            style={{
              background: showOverlays ? 'rgba(212, 168, 74, 0.2)' : 'transparent',
              border: '1px solid rgba(255,255,255,0.1)', borderRadius: 'var(--tkm-radius-lg)',
              color: showOverlays ? '#d4a84a' : '#8a7050',
              padding: '0.3rem 0.6rem',
              fontFamily: 'var(--tkm-font-body)', fontSize: '0.7rem', cursor: 'pointer',
              letterSpacing: '0.1rem',
            }}
          >
            {showOverlays ? '✓' : ''} 戰術疊加
          </button>
          <button
            onClick={beginClose}
            aria-label={t('離開城內', 'Leave the city')}
            title={t('離開城內', 'Leave the city')}
            style={{
              background: 'transparent', border: 'none', color: '#d4a84a',
              fontSize: '1.5rem', cursor: 'pointer', padding: '0 0.5rem',
            }}
          >×</button>
        </div>
      </header>

      {assignMsg && (
        <div style={{
          position: 'absolute', top: 58, left: '50%', transform: 'translateX(-50%)',
          zIndex: 12, background: 'rgba(20,32,18,0.94)', border: '1px solid #7ed68a',
          borderRadius: 'var(--tkm-radius-sm)', padding: '0.35rem 0.8rem', color: '#bfeebf',
          fontFamily: 'var(--tkm-font-body)', fontSize: '0.76rem', whiteSpace: 'nowrap',
        }}>{assignMsg}</div>
      )}

      {/* 3D canvas */}
      <div style={{ flex: 1, position: 'relative' }}>
        <Canvas
          // Remounts with a fresh GL context if the old one is lost and never
          // restored — otherwise the city goes black until the app restarts.
          key={glEpoch}
          onCreated={({ gl }) => attachGLRecovery(gl)}
          camera={{ position: [centerX, camHeight * 2.6, centerZ + camOffset * 0.18], fov: 50 }}
          shadows={RENDER_HI}
          dpr={RENDER_HI ? [1, 2] : [1, 1.5]}
          style={{ background: light.sky }}
        >
          {/* Shed the post stack if the frame rate stays down. */}
          {!gfxDegraded && <FrameRateWatch onDegrade={() => setGfxDegraded(true)} />}
          {/* Swoop down into the city on entry; rise back up on exit. Distinct
              keys so the exit dive mounts fresh (a reused instance would keep
              its finished state and never animate). The close itself is owned
              by beginClose's timeout, so this is purely visual. */}
          {exiting ? (
            <IntroDive
              key="out"
              mode="out"
              start={[centerX, camHeight * 2.6, centerZ + camOffset * 0.18]}
              end={[centerX, camHeight, centerZ + camOffset]}
              target={[centerX, 0, centerZ]}
              duration={0.45}
            />
          ) : (
            <IntroDive
              key="in"
              start={[centerX, camHeight * 2.6, centerZ + camOffset * 0.18]}
              end={[centerX, camHeight, centerZ + camOffset]}
              target={[centerX, 0, centerZ]}
              onDone={() => setIntroDone(true)}
            />
          )}
          <CityScene
            preview={preview}
            slots={slots}
            buildings={insideBuildings}
            construction={construction}
            plots={plots}
            cityWallCol={cityWallCol}
            bannerColor={bannerColor}
            light={light}
            season={season}
            stats={cityStats}
            grand={grandCity}
            onInspect={(info) => { playSfx('click'); setInspect(info); }}
            selectedPlot={selectedPlot}
            ghostBuilding={ghostBuilding}
            onPlotClick={handlePlotClick}
            hovered={hovered}
            onHover={setHovered}
            onClick={handleTileClick}
            showOverlays={showOverlays}
            city={city}
            neighbors={neighbors}
            facilities={nearbyFacilities}
            armies={nearbyArmies}
            stockades={nearbyStockades}
            ports={nearbyPorts}
            scars={nearbyScars}
            selectedSlot={selectedSlot}
            onSlotClick={handleSlotClick}
            landmarkInfo={landmarkInfo}
            weatherKind={weatherKind}
            isCapital={isCapital}
            specialty={specialty}
            activity={activity}
            plagued={plagued}
            figures={officerFigures}
            night={phase === 'lower'}
            encounter={encounterInfo}
            onEncounterClick={() => setEncounterOpen(true)}
            household={household}
          />
          <OrbitControls
            enabled={introDone && !exiting}
            target={[centerX, 0, centerZ]}
            enablePan
            maxPolarAngle={Math.PI / 2.2}
            minDistance={6}
            maxDistance={citySpan * 2.4}
          />
          {/* Lanterns, braziers and water all catch a soft glow. */}
          {RENDER_HI && !gfxDegraded && (
            <EffectComposer>
              <Bloom luminanceThreshold={0.85} intensity={0.35} mipmapBlur />
            </EffectComposer>
          )}
        </Canvas>

        {/* "You are here" locator — this city's window on the world map. */}
        <div style={{ position: 'absolute', left: 12, bottom: 12 }}>
          <LocatorMap window={cityViewWindow(city)} focusCityId={cityId} />
        </div>

        {/* Slot editor overlay */}
        {selectedSlot !== null && isPlayer && (
          <div
            style={{
              position: 'absolute', right: 12, top: 12, width: 320,
              background: 'rgba(20, 14, 8, 0.95)',
              border: '1px solid #d4a84a',
              padding: '0.8rem',
              color: '#c0a878',
              fontFamily: 'var(--tkm-font-body)',
              fontSize: '0.78rem',
              maxHeight: 'calc(100vh - 80px)',
              overflow: 'auto',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
              <div style={{ color: '#d4a84a', letterSpacing: '0.07rem' }}>
                {lang === 'en'
                  ? `${COMPASS_EN[selectedSlot]} Gate`
                  : `${COMPASS_ZH[selectedSlot]}面 · 第 ${selectedSlot + 1} 號位`}
              </div>
              <button
                onClick={() => setSelectedSlot(null)}
                aria-label={t('關閉城防面板', 'Close defence panel')}
                title={t('關閉城防面板', 'Close defence panel')}
                style={{
                background: 'transparent', border: 'none', color: '#8a7050', cursor: 'pointer',
              }}>×</button>
            </div>
            {/* Which approach this slot covers — directional defence. */}
            {(() => {
              const guarded = slotGuards.get(selectedSlot) ?? [];
              return (
                <div style={{
                  marginBottom: '0.5rem', fontSize: '0.72rem',
                  color: guarded.length ? '#e0b870' : '#7a6a50',
                  letterSpacing: '0.05rem',
                }}>
                  {guarded.length
                    ? (lang === 'en'
                        ? `Guards the road from ${guarded.map((n) => n.nameEn).join('、')}`
                        : `扼守 ${guarded.map((n) => n.nameZh).join('、')} 方向來路`)
                    : (lang === 'en' ? 'No neighbour lies this way' : '此方向無相鄰城池')}
                </div>
              );
            })()}
            {/* 守城演習此面 — fight a sparring assault from exactly this approach,
                on this direction's real terrain with the defences you've built. */}
            <button
              onClick={() => drillFromSlot(selectedSlot)}
              title={lang === 'en'
                ? 'Drill a siege from this approach — same terrain & defences as a real assault here. No losses.'
                : '在此面來敵的真實地形上演練守城,連同你建的防禦一同上陣。不損兵將。'}
              style={{
                width: '100%', padding: '0.45rem',
                background: 'linear-gradient(180deg, #2a3a20, #1d2a16)',
                color: '#9ed68a', border: '1px solid #7ed68a',
                marginBottom: '0.5rem', fontFamily: 'inherit', cursor: 'pointer',
                letterSpacing: '0.1rem',
              }}
            >
              ⚔ {lang === 'en'
                ? `Drill defence — assault from ${COMPASS_EN[selectedSlot]}`
                : `守城演習 · ${COMPASS_ZH[selectedSlot]}面來敵`}
            </button>
            {currentSlot?.buildingId ? (
              <div>
                <div style={{ color: DEFENSE_BUILDINGS[currentSlot.buildingId].color, marginBottom: '0.3rem' }}>
                  {pickName(DEFENSE_BUILDINGS[currentSlot.buildingId].name, lang)} lv{currentSlot.level}
                </div>
                <div style={{ color: '#8a7050', fontSize: '0.72rem', marginBottom: '0.5rem' }}>
                  {DEFENSE_BUILDINGS[currentSlot.buildingId].description}
                </div>
                {currentSlot.level < DEFENSE_BUILDINGS[currentSlot.buildingId].maxLevel && (
                  <button
                    onClick={() => tryUpgrade(selectedSlot)}
                    style={{
                      width: '100%', padding: '0.4rem',
                      background: '#1a3a5a', color: '#88b7e8',
                      border: '1px solid #88b7e8', marginBottom: '0.3rem',
                      fontFamily: 'inherit', cursor: 'pointer',
                    }}
                  >
                    升級 → lv{currentSlot.level + 1}
                  </button>
                )}
                <button
                  onClick={() => tryDemolish(selectedSlot)}
                  style={{
                    width: '100%', padding: '0.4rem',
                    background: '#3a1a1a', color: '#b8442e',
                    border: '1px solid #b8442e',
                    fontFamily: 'inherit', cursor: 'pointer',
                  }}
                >
                  {t('拆除', 'Demolish')}
                </button>
              </div>
            ) : (
              <div>
                <div style={{ color: '#8a7050', marginBottom: '0.4rem' }}>{t('選擇建築:', 'Choose a building:')}</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                  {ALL_BUILDINGS.map((id) => {
                    const def = DEFENSE_BUILDINGS[id];
                    return (
                      <button
                        key={id}
                        onClick={() => tryBuild(selectedSlot, id)}
                        title={def.description}
                        style={{
                          padding: '0.35rem 0.5rem',
                          background: 'rgba(212, 168, 74, 0.08)',
                          border: `1px solid ${def.color}`,
                          color: def.color,
                          fontFamily: 'inherit', fontSize: '0.75rem',
                          cursor: 'pointer', textAlign: 'left',
                        }}
                      >
                        {pickName(def.name, lang)} <span style={{ float: 'right', opacity: 0.7 }}>{def.goldCost}g</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
            {error && (
              <div style={{ color: '#b8442e', marginTop: '0.4rem', fontSize: '0.72rem' }}>{error}</div>
            )}
          </div>
        )}

        {/* Build-menu overlay — opens when a foundation (地基) is tapped. */}
        {selectedPlot !== null && isPlayer && (() => {
          const existing = buildingAtPlot.get(selectedPlot);
          const buildable = BUILDING_DEFS.filter((d) => d.id !== 'wall' && !presentTypes.has(d.id));
          const slotsUsed = cityBuildingsAll.length;
          const slotsCap = size.buildingSlots;
          const atSlotCap = slotsUsed >= slotsCap;
          // 建築群方略 — how many of each category the city already has built (lv≥1).
          const catCountCity: Partial<Record<string, number>> = {};
          const builtTypes = new Set<string>();
          for (const b of cityBuildingsAll) {
            if ((b.level ?? 0) < 1) continue;
            builtTypes.add(b.id);
            const c = BUILDING_CATEGORY[b.id];
            if (c) catCountCity[c] = (catCountCity[c] ?? 0) + 1;
          }
          const groupPct = (count: number) => Math.round((buildingGroupSynergy(count) - 1) * 100);
          const affinity = cityAffinity(cityId); // 地利 — specialty-favoured category
          return (
            <div
              style={{
                position: 'absolute', right: 12, top: 12, width: 320,
                background: 'rgba(20, 14, 8, 0.95)',
                border: '1px solid #d4a84a',
                padding: '0.8rem',
                color: '#c0a878',
                fontFamily: 'var(--tkm-font-body)',
                fontSize: '0.78rem',
                maxHeight: 'calc(100vh - 80px)',
                overflow: 'auto',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                <div style={{ color: '#d4a84a', letterSpacing: '0.07rem' }}>
                  {existing ? '城内設施' : '營建新設施'}
                </div>
                <button
                onClick={() => setSelectedPlot(null)}
                aria-label={t('關閉地塊面板', 'Close plot panel')}
                title={t('關閉地塊面板', 'Close plot panel')}
                style={{
                  background: 'transparent', border: 'none', color: '#8a7050', cursor: 'pointer',
                }}>×</button>
              </div>
              <div style={{ color: '#8a7050', fontSize: '0.7rem', marginBottom: '0.5rem' }}>
                💰 {t('城内存金', 'Treasury')} <span style={{ color: '#e0c060' }}>{city.gold}</span>
                <span style={{ float: 'right' }}>
                  {t('建設位', 'Plots')} <span style={{ color: atSlotCap ? '#b8442e' : '#e0c060' }}>{slotsUsed}/{slotsCap}</span>
                </span>
              </div>

              {existing ? (() => {
                const def = BUILDING_DEFS_BY_ID[existing.id];
                const vis = INSIDE_BUILDING_DEF[existing.id];
                const building = existing.progress > 0 && existing.level === 0;
                const upgrading = existing.progress > 0 && existing.level > 0;
                return (
                  <div>
                    <div style={{ color: vis?.color ?? '#d4a84a', marginBottom: '0.3rem' }}>
                      {vis?.nameZh ?? existing.id} lv{existing.level}
                      {building && <span style={{ color: '#e0c060', marginLeft: 6 }}>{t('· 建造中', '· building')}</span>}
                      {upgrading && <span style={{ color: '#e0c060', marginLeft: 6 }}>{t('· 升級中', '· upgrading')}</span>}
                    </div>
                    <div style={{ color: '#8a7050', fontSize: '0.72rem', marginBottom: '0.5rem' }}>
                      {def?.descriptionZh}
                    </div>
                    {(() => {
                      const cat = BUILDING_CATEGORY[existing.id];
                      const cnt = catCountCity[cat] ?? 0;
                      const pct = groupPct(cnt);
                      return (
                        <div style={{ color: pct > 0 ? '#8fce8f' : '#8a7050', fontSize: '0.7rem', marginBottom: '0.5rem' }}>
                          {BUILDING_CATEGORY_LABEL[cat].zh}群 ×{cnt}
                          {pct > 0 ? t(` → 同類效果 +${pct}%`, ` → same-type effect +${pct}%`) : t('(同類建築相鄰增益,多蓋更強)', '(same-type buildings boost each other when adjacent)')}
                        </div>
                      );
                    })()}
                    {def && existing.level < def.maxLevel && existing.progress === 0 && (
                      <button
                        onClick={() => tryUpgradeBuilding(existing.id)}
                        style={{
                          width: '100%', padding: '0.45rem',
                          background: '#1a3a5a', color: '#88b7e8',
                          border: '1px solid #88b7e8',
                          fontFamily: 'inherit', cursor: 'pointer',
                        }}
                      >
                        升級 → lv{existing.level + 1}
                        <span style={{ float: 'right', opacity: 0.8 }}>{def.goldPerLevel}g · {def.seasonsPerLevel}季</span>
                      </button>
                    )}
                    {def && existing.level >= def.maxLevel && (
                      <div style={{ color: '#8a7050', textAlign: 'center', fontSize: '0.72rem' }}>{t('已達最高等級', 'Max level reached')}</div>
                    )}
                  </div>
                );
              })() : (
                <div>
                  <div style={{ color: '#8a7050', marginBottom: '0.4rem' }}>{t('選擇建築 → 蓋在此地基:', 'Pick a building for this plot:')}</div>
                  {atSlotCap && (
                    <div style={{ color: '#b8442e', textAlign: 'center', fontSize: '0.72rem' }}>
                      建設位已滿 ({slotsUsed}/{slotsCap}) — 城市升級可增加建設位
                    </div>
                  )}
                  {!atSlotCap && buildable.length === 0 && (
                    <div style={{ color: '#8a7050', textAlign: 'center', fontSize: '0.72rem' }}>{t('所有設施已建齊', 'Every facility is built')}</div>
                  )}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.28rem' }}>
                    {!atSlotCap && buildable.map((def) => {
                      const vis = INSIDE_BUILDING_DEF[def.id];
                      const cat = BUILDING_CATEGORY[def.id];
                      const prereq = BUILDING_PREREQ[def.id];
                      const prereqLocked = !!prereq && !builtTypes.has(prereq);
                      const minSize = BUILDING_MIN_SIZE[def.id];
                      const sizeLocked = !!minSize && !cityMeetsSize(city, minSize);
                      const locked = prereqLocked || sizeLocked;
                      const affine = cat === affinity;
                      const cost = Math.round(def.goldPerLevel * (affine ? 0.85 : 1));
                      const afford = city.gold >= cost;
                      const usable = afford && !locked;
                      return (
                        <button
                          key={def.id}
                          onClick={() => !locked && tryStartBuilding(selectedPlot, def.id)}
                          onMouseEnter={() => setGhostBuilding(def.id)}
                          onMouseLeave={() => setGhostBuilding((g) => (g === def.id ? null : g))}
                          disabled={!usable}
                          title={def.descriptionZh}
                          style={{
                            padding: '0.4rem 0.5rem',
                            background: 'rgba(212, 168, 74, 0.08)',
                            border: `1px solid ${locked ? '#5a4a3a' : (vis?.color ?? '#5a4530')}`,
                            color: usable ? (vis?.color ?? '#c0a878') : '#6a5a44',
                            opacity: usable ? 1 : 0.5,
                            fontFamily: 'inherit', fontSize: '0.75rem',
                            cursor: usable ? 'pointer' : 'not-allowed', textAlign: 'left',
                          }}
                        >
                          <div>
                            {vis?.glyph} {vis?.nameZh ?? def.id}
                            {affine && <span style={{ color: '#e0c060', marginLeft: 4 }}>{t('◆地利', '◆Terrain')}</span>}
                            <span style={{ float: 'right', opacity: 0.8 }}>{cost}g · {def.seasonsPerLevel}季</span>
                          </div>
                          {prereqLocked ? (
                            <div style={{ fontSize: '0.7rem', color: '#b8442e', marginTop: 1 }}>
                              需先建「{BUILDING_DEFS_BY_ID[prereq!]?.name.zh ?? prereq}」
                            </div>
                          ) : sizeLocked ? (
                            <div style={{ fontSize: '0.7rem', color: '#b8442e', marginTop: 1 }}>
                              需「{CITY_SIZES_BY_ID[minSize!]?.name.zh ?? minSize}」級以上城市
                            </div>
                          ) : (() => {
                            const after = groupPct((catCountCity[cat] ?? 0) + 1);
                            return (
                              <div style={{ fontSize: '0.7rem', color: '#7f9f6f', marginTop: 1 }}>
                                {t(`${BUILDING_CATEGORY_LABEL[cat].zh}群`, `${BUILDING_CATEGORY_LABEL[cat].en} cluster`)}{after > 0 ? t(` → 同類 +${after}%`, ` → same-type +${after}%`) : ''}
                                {affine ? ' · 地利 +10%/造價 −15%' : ''}
                              </div>
                            );
                          })()}
                          <div style={{ fontSize: '0.66rem', color: '#8a7050', marginTop: 2 }}>{def.descriptionZh}</div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
              {buildMsg && (
                <div style={{ color: '#b8442e', marginTop: '0.4rem', fontSize: '0.72rem' }}>{buildMsg}</div>
              )}
            </div>
          );
        })()}

        {/* Hint when nothing selected */}
        {selectedSlot === null && selectedPlot === null && isPlayer && (
          <div style={{
            position: 'absolute', bottom: 14, left: 14,
            background: 'rgba(20, 14, 8, 0.8)',
            border: '1px solid rgba(255,255,255,0.1)', borderRadius: 'var(--tkm-radius-lg)',
            padding: '0.3rem 0.6rem',
            color: '#8a7050', fontFamily: 'var(--tkm-font-body)',
            fontSize: '0.7rem', letterSpacing: '0.05rem',
          }}>
            {t('點金色八角位 → 城外防禦 · 點地基(金框) → 城内營建', 'Gold octagons → outer defences · gold-framed plots → city works')}
          </div>
        )}

        {/* Landmark inspect card — appears when a 地标 is tapped */}
        {encounterOpen && encounterInfo && (() => {
          const K = encounterInfo.kind;
          const info = K === 'merchant'
            ? { title: '行商獻寶', body: '西域行商停駐坊前:「上好貨色 — 戰馬四十、精鐵四十、藥材二十,作價三百金,概不還價。」', yes: '買下(−300金)', color: '#e0c060' }
            : K === 'knight'
              ? { title: '遊俠叫陣', body: '一名遊俠倚劍於牌坊之下,揚言欲會城中第一好漢,點到為止。', yes: '遣將赴會(武將得歷練)', color: '#e0846a' }
              : K === 'soothsayer'
                ? { title: '相士設壇', body: '相士自稱能觀星禳厄:「百金設壇,可安一城人心。」', yes: '設壇(−100金,民忠+4)', color: '#8fa8d8' }
                : { title: '說書開講', body: '說書人拍響醒木,滿街百姓圍攏 — 講的是本朝英雄的段子。', yes: '賞他一場(民忠+3)', color: '#9ac06a' };
          return (
            <div style={{
              position: 'absolute', top: 16, left: '50%', transform: 'translateX(-50%)',
              width: 'min(420px, 80vw)', zIndex: 30,
              background: 'rgba(20, 14, 8, 0.96)',
              border: `1px solid ${info.color}`, borderRadius: 'var(--tkm-radius-sm)',
              padding: '0.6rem 0.9rem', fontFamily: 'var(--tkm-font-body)',
              boxShadow: '0 4px 18px rgba(0,0,0,0.5)',
            }}>
              <div style={{ color: info.color, fontSize: '1rem', letterSpacing: '0.07rem' }}>✨ {info.title}</div>
              <div style={{ color: '#c0a878', fontSize: '0.78rem', lineHeight: 1.6, margin: '4px 0 8px' }}>{info.body}</div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  onClick={() => {
                    const r = resolveStreetEncounter(cityId, K, true);
                    if (!r.ok && r.reason) setBuildMsg(r.reason);
                    setEncounterOpen(false);
                  }}
                  style={{ flex: 1, padding: '0.35rem', background: '#2a2410', border: `1px solid ${info.color}`, color: '#f0e0b0', cursor: 'pointer', fontFamily: 'inherit', fontSize: '0.78rem' }}
                >{info.yes}</button>
                <button
                  onClick={() => { resolveStreetEncounter(cityId, K, false); setEncounterOpen(false); }}
                  style={{ flex: 1, padding: '0.35rem', background: '#1a1410', border: '1px solid #4a3a28', color: '#8a7050', cursor: 'pointer', fontFamily: 'inherit', fontSize: '0.78rem' }}
                >{t('婉拒(此季不再遇)', "Decline (won't recur this season)")}</button>
              </div>
            </div>
          );
        })()}
        {inspect && (
          <div style={{
            position: 'absolute', top: 16, left: '50%', transform: 'translateX(-50%)',
            width: 'min(420px, 80vw)',
            background: 'rgba(20, 14, 8, 0.94)',
            border: `1px solid ${inspect.color}`, borderRadius: 'var(--tkm-radius-sm)',
            padding: '0.6rem 0.9rem',
            fontFamily: 'var(--tkm-font-body)',
            boxShadow: '0 4px 18px rgba(0,0,0,0.5)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: inspect.color, fontSize: '1rem', letterSpacing: '0.07rem' }}>{inspect.title}</span>
              <button
                onClick={() => setInspect(null)}
                aria-label={t('關閉詳情', 'Close details')}
                title={t('關閉詳情', 'Close details')}
                style={{
                background: 'transparent', border: 'none', color: '#8a7050', cursor: 'pointer', fontSize: '0.9rem',
              }}>×</button>
            </div>
            <div style={{ color: '#c0a878', fontSize: '0.78rem', lineHeight: 1.6, marginTop: 4 }}>{inspect.body}</div>
            {/* 理政 — actionable commands tied to this building, with the
                building's live stat shown right where you act on it. */}
            {inspect.commands && isPlayer && (() => {
              const sizeId = citySize(city).id;
              // The metric this landmark governs, for the at-a-glance readout.
              const cmds = inspect.commands;
              // 文教 buildings only hold 興学 — show the talent it accelerates
              // (在城武將) rather than an irrelevant 城防 line.
              const learningOnly = cmds.length === 1 && cmds[0] === 'promote-learning';
              const metric = cmds.includes('develop-agriculture') ? { zh: '農業', v: city.agriculture, max: econCap as number | null }
                : cmds.includes('develop-commerce') ? { zh: '商業', v: city.commerce, max: econCap as number | null }
                : cmds.includes('drill-troops') ? { zh: '練度', v: city.drill ?? 0, max: 100 as number | null }
                : learningOnly ? { zh: '在城武將', v: stationedCount, max: null as number | null }
                : { zh: '城防', v: city.defense, max: cap as number | null };
              return (
                <div style={{ marginTop: 8, borderTop: '1px solid #3a2d20', paddingTop: 6 }}>
                  <div style={{ fontSize: '0.74rem', color: '#e8d9b0', marginBottom: 6 }}>
                    {metric.zh} <strong style={{ color: inspect.color }}>{metric.v}{learningOnly ? ' 員' : ''}</strong>
                    {metric.max != null && <span style={{ color: '#8a7050' }}> / {metric.max}</span>}
                    {!cmds.includes('develop-agriculture') && !cmds.includes('develop-commerce') && !learningOnly && (
                      <span style={{ marginLeft: 10, color: '#8a7050' }}>{t('兵', 'Troops')} {city.troops.toLocaleString()} · {t('民忠', 'Loyalty')} {city.loyalty}</span>
                    )}
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                    {cmds.map((ct) => {
                      const def = COMMAND_DEFS[ct];
                      const tierOk = meetsMinSize(sizeId, def.minSize);
                      if (!tierOk) return null;
                      const canAfford = city.gold >= def.goldCost;
                      const pv = previewByCmd[ct] ?? null;
                      return (
                        <button
                          key={ct}
                          onClick={() => { playSfx('open-modal'); setPickerCmd(ct); setInspect(null); }}
                          disabled={!canAfford}
                          title={canAfford ? def.description : t('金錢不足', 'Not enough gold')}
                          style={{
                            background: canAfford ? '#2a1f14' : 'transparent',
                            border: `1px solid ${canAfford ? inspect.color : '#3a2d20'}`,
                            color: canAfford ? '#f0d98a' : '#5a4a35',
                            padding: '0.3rem 0.6rem', cursor: canAfford ? 'pointer' : 'not-allowed',
                            fontFamily: 'inherit', fontSize: '0.76rem',
                          }}
                        >{pickName(def.label, lang)} <span style={{ color: '#8a7050' }}>{def.goldCost > 0 ? `${def.goldCost}g` : '免'}</span>
                          {pv && pv.delta > 0 && canAfford && (
                            <span style={{ marginLeft: 5, color: '#8fbf7a' }}>≈+{pv.delta.toLocaleString()}</span>
                          )}</button>
                      );
                    })}
                  </div>
                  {/* 府衙 · 度支 + 治所/遷都 — the seat of government surfaces this
                      city's own seasonal ledger and the capital controls in place. */}
                  {cmds.includes('improve-loyalty') && (
                    <div style={{ marginTop: 8, borderTop: '1px solid #3a2d20', paddingTop: 6, fontSize: '0.72rem', color: '#c0a878' }}>
                      <div style={{ marginBottom: 5 }}>
                        <span style={{ color: '#8a7858' }}>{t('本城度支', 'City budget')}</span>{'  '}
                        {t('季金', 'Gold/season')} <strong style={{ color: '#e8c860' }}>+{cityEcon.goldIncome.toLocaleString()}</strong>
                        <span style={{ marginLeft: 8 }}>{t('季糧', 'Food/season')} <strong style={{ color: (cityEcon.foodIncome - cityEcon.foodUpkeep) >= 0 ? '#9ac06a' : '#d4774a' }}>{(cityEcon.foodIncome - cityEcon.foodUpkeep) >= 0 ? '+' : ''}{(cityEcon.foodIncome - cityEcon.foodUpkeep).toLocaleString()}</strong></span>
                        <span style={{ marginLeft: 8 }}>{t('人口', 'Population')} <strong style={{ color: cityEcon.populationDelta >= 0 ? '#88b7e8' : '#d4774a' }}>{cityEcon.populationDelta >= 0 ? '+' : ''}{cityEcon.populationDelta.toLocaleString()}</strong>{t('/季', '/season')}</span>
                      </div>
                      {isCapital ? (
                        <div style={{ color: '#e8c860' }}>{t('★ 本城為治所 — 政令所出,每季 +3 民忠、禁軍宿衛。', '★ Seat of government — decrees issue from here: +3 loyalty a season, guarded by the standing guard.')}</div>
                      ) : (
                        <button
                          onClick={() => {
                            const r = relocateCapital(cityId);
                            playSfx(r.ok ? 'gong' : 'pluck');
                            setAssignMsg(r.message);
                            window.setTimeout(() => setAssignMsg(null), 3600);
                            setInspect(null);
                          }}
                          style={{ background: '#2a1f14', border: '1px solid #e0c060', color: '#f0d98a', padding: '0.28rem 0.6rem', cursor: 'pointer', fontFamily: 'inherit', fontSize: '0.74rem' }}
                        >{t('遷都至此', 'Move capital here')} <span style={{ color: '#8a7050' }}>{capitalMoveUsed ? '800g' : t('首遷免費', 'first move free')}</span></button>
                      )}
                    </div>
                  )}
                  {/* 市集 · 市易 — inline grain market on the commerce landmark. */}
                  {cmds.includes('develop-commerce') && (
                    <MarketTradeRow
                      city={city}
                      season={date.season as Season}
                      cityId={cityId}
                      tradeFood={tradeFood}
                      onTraded={(m) => { setAssignMsg(m); window.setTimeout(() => setAssignMsg(null), 3000); }}
                    />
                  )}
                </div>
              );
            })()}
          </div>
        )}

        {/* 府衙理政 — the multi-select officer picker, opened from a building. */}
        {pickerCmd && isPlayer && (
          <OfficerPicker cityId={cityId} commandType={pickerCmd} onClose={() => setPickerCmd(null)} />
        )}

        {/* Live readout — the scene mirrors these numbers */}
        <div style={{
          position: 'absolute', bottom: 14, right: 14,
          background: 'rgba(20, 14, 8, 0.82)',
          border: '1px solid rgba(255,255,255,0.1)', borderRadius: 'var(--tkm-radius)',
          padding: '0.34rem 0.6rem',
          color: '#b8a274', fontFamily: 'var(--tkm-font-body)',
          fontSize: '0.66rem', lineHeight: 1.55, textAlign: 'right',
        }}>
          <div style={{ color: '#8a7858', fontSize: '0.7rem', letterSpacing: '0.05rem', marginBottom: 2 }}>{t('城景 · 實況', 'City · Live')}</div>
          <div>{t('市集', 'Market')} <span style={{ color: '#d4a84a' }}>{t('商業', 'Commerce')} {city.commerce}/{econCap}</span></div>
          <div>{t('屯田', 'Farmland')} <span style={{ color: '#9ac06a' }}>{t('農業', 'Agriculture')} {city.agriculture}/{econCap}</span></div>
          <div>{t('行人', 'Populace')} <span style={{ color: '#88b7e8' }}>{t('人口', 'Population')} {city.population.toLocaleString()}</span></div>
          <div>{t('張燈', 'Lanterns')} <span style={{ color: '#e0884a' }}>{t('民忠', 'Loyalty')} {city.loyalty}/{size.loyaltyCap}</span></div>
        </div>
      </div>
    </div>
  );
}


/* ─── 四季飄物 — falling snow in winter, drifting gold leaves in autumn,
 *  blossom petals on the spring breeze. One instanced field, dressed by
 *  the season; summer stays clear. */
function SeasonalDrift({ season }: { season: 'spring' | 'summer' | 'autumn' | 'winter' }) {
  const cfg = season === 'winter'
    ? { count: 900, color: '#ffffff', size: 0.05, fall: 1.1, sway: 0.4, opacity: 0.9 }
    : season === 'autumn'
      ? { count: 260, color: '#d4972f', size: 0.055, fall: 0.55, sway: 1.1, opacity: 0.85 }
      : season === 'spring'
        ? { count: 180, color: '#f2c1d8', size: 0.045, fall: 0.4, sway: 1.3, opacity: 0.8 }
        : null;
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const seeds = useMemo(() => {
    const n = cfg?.count ?? 0;
    return Array.from({ length: n }, (_, i) => ({
      x: (((i * 73) % 200) / 200 - 0.5) * 46,
      z: (((i * 137 + 41) % 200) / 200 - 0.5) * 36,
      y: ((i * 29) % 100) / 100 * 16,
      speed: 0.7 + ((i * 31) % 10) / 10 * 0.7,
      drift: ((i * 17) % 63) / 10,
    }));
  }, [cfg?.count]);
  useFrame((state, delta) => {
    if (!meshRef.current || !cfg) return;
    const t = state.clock.elapsedTime;
    for (let i = 0; i < seeds.length; i++) {
      const sd = seeds[i];
      sd.y -= sd.speed * cfg.fall * delta;
      if (sd.y < 0) sd.y = 16;
      dummy.position.set(
        sd.x + Math.sin(t * 0.8 + sd.drift) * cfg.sway,
        sd.y,
        sd.z + Math.cos(t * 0.6 + sd.drift) * cfg.sway * 0.7,
      );
      dummy.rotation.set(t + sd.drift, t * 0.7, 0);
      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);
    }
    meshRef.current.instanceMatrix.needsUpdate = true;
  });
  if (!cfg) return null;
  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, cfg.count]} key={season}>
      {season === 'winter'
        ? <sphereGeometry args={[cfg.size, 4, 4]} />
        : <planeGeometry args={[cfg.size * 2, cfg.size * 1.4]} />}
      <meshBasicMaterial color={cfg.color} transparent opacity={cfg.opacity} side={THREE.DoubleSide} depthWrite={false} />
    </instancedMesh>
  );
}

/* ─── 天時粒子 — weather laid over the city: slanting rain, drifting drought
 *  dust, or wind-blown grit. One instanced field, dressed by the weather kind;
 *  clear/snow defer to SeasonalDrift. */
function WeatherFX({ kind, width, height }: { kind: WeatherKind; width: number; height: number }) {
  // Low-tier devices get roughly half the motes (the per-frame instance loop is
  // the cost here, not the draw call — one instanced mesh either way).
  const cfg = kind === 'rain'
    ? { count: RENDER_HI ? 1100 : 480, color: '#9fb4c4', sizeX: 0.022, sizeY: 0.5, fall: 9, swayX: 0.6, swayZ: 0, opacity: 0.5, top: 16 }
    : kind === 'drought'
      ? { count: RENDER_HI ? 220 : 110, color: '#cdb27a', sizeX: 0.05, sizeY: 0.05, fall: 0.25, swayX: 2.4, swayZ: 1.6, opacity: 0.5, top: 6 }
      : kind === 'wind'
        ? { count: RENDER_HI ? 320 : 150, color: '#c4b388', sizeX: 0.07, sizeY: 0.03, fall: 0.6, swayX: 3.6, swayZ: 0.8, opacity: 0.42, top: 7 }
        : null;
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const spanX = width * HEX_COL_STEP, spanZ = height * HEX_ROW_STEP;
  const seeds = useMemo(() => {
    const n = cfg?.count ?? 0;
    return Array.from({ length: n }, (_, i) => ({
      x: ((i * 73) % 200) / 200 * spanX,
      z: ((i * 137 + 41) % 200) / 200 * spanZ,
      y: ((i * 29) % 100) / 100 * (cfg?.top ?? 12),
      speed: 0.7 + ((i * 31) % 10) / 10 * 0.7,
      drift: ((i * 17) % 63) / 10,
    }));
  }, [cfg?.count, cfg?.top, spanX, spanZ]);
  useFrame((state, delta) => {
    if (!meshRef.current || !cfg) return;
    const t = state.clock.elapsedTime;
    for (let i = 0; i < seeds.length; i++) {
      const sd = seeds[i];
      sd.y -= sd.speed * cfg.fall * delta;
      if (sd.y < 0) sd.y = cfg.top;
      // Rain slants steadily; dust/wind swirl on a sine drift.
      const sx = kind === 'rain' ? cfg.swayX : Math.sin(t * 0.9 + sd.drift) * cfg.swayX;
      const sz = Math.cos(t * 0.7 + sd.drift) * cfg.swayZ;
      dummy.position.set(sd.x + sx, sd.y, sd.z + sz);
      if (kind === 'rain') dummy.rotation.set(0, 0, 0.18);
      else dummy.rotation.set(t + sd.drift, t * 0.6, 0);
      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);
    }
    meshRef.current.instanceMatrix.needsUpdate = true;
  });
  if (!cfg) return null;
  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, cfg.count]} key={kind}>
      <planeGeometry args={[cfg.sizeX, cfg.sizeY]} />
      <meshBasicMaterial color={cfg.color} transparent opacity={cfg.opacity} side={THREE.DoubleSide} depthWrite={false} />
    </instancedMesh>
  );
}
