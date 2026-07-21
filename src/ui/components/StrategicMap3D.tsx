import { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { Html, Line, OrbitControls } from '@react-three/drei';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import { RENDER_HI } from '../renderQuality';
import { setMapFocusHandler, requestMapFocus } from './mapFocusBus';
import { hasEscapeLayers } from '../hooks/useEscapeKey';
import { WORLD_SCALE, hexAt as geoHexAt, hexCenter as geoHexCenter } from '../../game/data/geography';
import { marchDurationFor } from '../../game/data/cities';
import { cityPixel, cityPos } from '../../game/data/cityGeo';
import * as THREE from 'three';
import { useGameStore } from '../../game/state/store';
import type { HexCoord, Season } from '../../game/types';
import { isHostilePermitted } from '../../game/types';
// The battle diorama reuses the real battle scene (embedded mode) + its hex
// coordinate helper, so the fight on the world map IS the fight.
import { BattleScene, BattleCinematics, hexWorld as battleHexWorld, FX_DURATION, SIGNATURE_FLAVOR } from '../screens/TacticalBattleScreen3D';
import { battleWindow } from '../../game/systems/battlefieldTerrain';
import { tacticFxSpec, FX_IMPACT, type StratagemFxInstance, type StratagemFxKind, type TacticFxSpec } from '../../game/data/stratagemFx';
import { categoryOfTactic } from '../../game/data/officerAttributes';
// In-place battle commanding — the SAME pure battle ops the fullscreen uses.
import { unitAt, canMove, canAttack, moveUnit, attackUnits, endTurn, hexDistance, forecastAttack, matchupLabel, battleStratagemSituation } from '../../game/systems/tactical';
import { applyStratagem } from '../../game/systems/tacticalSchemes';
import { canDuel } from '../../game/systems/duel';
import { duelWound } from '../../game/systems/afflictions';
import { personalTacticsForUnit } from '../../game/systems/personalTactics';
import { Duel3DStage } from './duel/Duel3DStage';
import { MarchPicker } from './MarchPicker';
import { MusterModal } from './MusterModal';
import { Modal } from './Modal';
import { OfficerPicker } from './OfficerPicker';
import { playSfx, playFxSfx, startMapAmbience, setMapAmbienceMode, stopMapAmbience } from '../../game/systems/sound';
import { computeFog } from '../../game/systems/fogOfWar';
import { STRATAGEMS } from '../../game/data';
import type { Officer, StratagemId } from '../../game/types';
import { LocatorMap } from './LocatorMap';
import { ObjectivePanel } from './ObjectivePanel';
import { computeDayEncounters, marchPositionAtDay } from '../../game/systems/dayEncounters';
import { PortPanel } from './PortPanel';
import { FortPanel } from './FortPanel';
import { TribePanel } from './TribePanel';
import { SitePanel } from './SitePanel';
import { ScenicPanel } from './ScenicPanel';
import { BuildStockadePicker } from './BuildStockadePicker';
import { useT, useLanguage, pickName } from '../i18n';
import { IS_MOBILE, PIXEL_TO_WORLD, MAP_W, MAP_D, EMPTY_HEX_PAINT, EMPTY_TERRITORY_OWNERSHIP, pxToWorld, isLandPx, sampleTerrainHeight, cityElevation, SEASON_ZH, SEASON_EN, type OverlayMode } from './map3d/shared';
import { computeBeaconAlerts, QueuedBattles3D, DayEncounterMarks3D, FieldBattleMarks3D, FieldClashMelee3D, IgnitionDust3D, BeaconAlerts3D, SiegeRings3D, BurningCities3D, DepartureFlourish3D, ConquestFlourish3D, LossFlourish3D, EspionageAgents3D } from './map3d/WorldMarks3D';
import { Ocean, Lakes3D, RiverRibbons, SnowBlanket, Forest3D, Farmland3D, Villages3D, GeoLabels3D, TradeRouteLines3D, RainParticles, SnowParticles } from './map3d/NatureLayers3D';
import { MarchingArmies } from './map3d/Armies3D';
import { City3D } from './map3d/Cities3D';
import { HexWorldTerrain, HEXW_R } from './map3d/HexWorld3D';
import { IntentLayer, DiplomacyLines3D } from './map3d/Intent3D';
import { SupplyLines3D, SupplyCorridor3D } from './map3d/Supply3D';
import { Forts3D, Ports3D } from './map3d/Strongholds3D';
import { SkyDome, DriftingClouds, CloudShadows, CitySmoke3D, Birds3D, EventMarks3D, TradeShips3D, DuskCityLights, Caravans3D, EMPTY_THREATS, FOG_OVERLAY, EMPTY_REVEALS } from './map3d/AtmosphereTrade3D';
import { Tribes3D, WildSites3D, ScenicSites3D } from './map3d/WildSites3D';
import { TerritoryGroundLayer, MapTerrain } from './map3d/Terrain3D';
import { Roads, Convoys, Envoys, CityDefenseRing, BattleIgnitionCard, overlayForCity, GrainCaravans } from './map3d/Traffic3D';
import { GreatWall3D, ProvinceBorders3D, ProvinceLabels3D, FactionLabels3D, MarchPreviewLine, Bridges3D, PostStations3D, Landmarks3D, UniqueLandmarks3D, MarchRangeRings, SeaLabels, HeadingTracker } from './map3d/GeoDressing3D';
import { BattleFocusFly, EventFocusFly, ReplayRecorder, ReplayPanel } from './map3d/Flights3D';
export { warmStrategicAssets } from './map3d/Terrain3D';
export { warmHexWorldTiles } from './map3d/HexWorld3D';
// Preserve this module's public surface — computeBeaconAlerts was exported from here.
export { computeBeaconAlerts };

import { MAP_FOV_DEG, MAP_MAX_DIST, ZoomLODCtx, ZoomLODTracker, MiniNavRig, MapCamApi, type CamApi } from './map3d/MapCameraRig';
import { SEASON_PRESETS, TOD_PRESETS, WEATHER_PRESETS } from './map3d/mapPresets';
import { phaseToTOD } from './map3d/mapPresets';
import { CityQuickRing, CitySearchBox, OVERLAY_OPTIONS, WEATHER_ZH, WEATHER_EN, ArmyOrdersHint, MapHelpPanel } from './map3d/MapHudWidgets';
// Preserve the public surface — phaseToTOD/TimeOfDay lived here before the split.
export { phaseToTOD, type TimeOfDay } from './map3d/mapPresets';


/* ─── Top-level scene ─────────────────────────────────────── */

function MapScene({ overlayMode, onPortClick, onFortClick, onTribeClick, onSiteClick, onScenicClick, onQuickAction, mapStyle, dioSelectedId, dioMode, dioCast, dioArcs, dioFx, dioHover, onDioHover, onDioramaTile, onFocusWorld, onDragLock }: {
  overlayMode: OverlayMode;
  mapStyle: 'classic' | 'hex';
  onPortClick: (portId: string) => void;
  onFortClick: (fortId: string) => void;
  onTribeClick: (tribeId: string) => void;
  onSiteClick: (siteId: string) => void;
  onScenicClick: (siteId: string) => void;
  /** 快捷輪盤 — open the march/recruit picker for a city (DOM modals live
   *  in the outer shell, outside the Canvas). */
  onQuickAction: (kind: 'march' | 'recruit' | 'muster' | 'govern', cityId: string) => void;
  /** 原地指揮 — in-place battle commanding state, owned by the outer shell. */
  dioSelectedId: string | null;
  dioMode: 'move' | 'attack';
  dioCast: { id: StratagemId; tacticId?: string } | null;
  dioArcs: Array<{ id: number; from: HexCoord; to: HexCoord; kind: 'melee' | 'ranged'; spawnedAt: number }>;
  dioFx: StratagemFxInstance[];
  dioHover: HexCoord | null;
  onDioHover: (c: HexCoord | null) => void;
  onDioramaTile: (c: HexCoord) => void;
  /** 雙擊飛鏡 — fly+zoom the camera to a double-clicked ground point. */
  onFocusWorld?: (wx: number, wz: number) => void;
  /** 拖拽行軍 — lock/unlock the orbit controls while a drag is live. */
  onDragLock?: (locked: boolean) => void;
}) {
  const cities = useGameStore((s) => s.cities);
  const forces = useGameStore((s) => s.forces);
  const officers = useGameStore((s) => s.officers);
  const territoryOwnership = useGameStore((s) => s.territoryOwnership ?? EMPTY_TERRITORY_OWNERSHIP);
  const hexPaint = useGameStore((s) => s.hexPaint ?? EMPTY_HEX_PAINT);
  const worldScars = useGameStore((s) => s.worldScars);
  const spottedAmbushIds = useGameStore((s) => s.spottedAmbushIds);
  const selectedCityId = useGameStore((s) => s.selectedCityId);
  const selectCity = useGameStore((s) => s.selectCity);
  const openCityMap = useGameStore((s) => s.openCityMap);
  const pendingCommands = useGameStore((s) => s.pendingCommands);
  const selectedArmyId3D = useGameStore((s) => s.selectedArmyId);
  const selectArmy = useGameStore((s) => s.selectArmy);
  const redirectArmy = useGameStore((s) => s.redirectArmy);
  const moveArmyToCell = useGameStore((s) => s.moveArmyToCell);
  const mergeArmyInto = useGameStore((s) => s.mergeArmyInto);
  const startFieldBattle = useGameStore((s) => s.startFieldBattle);
  const armiesState = useGameStore((s) => s.armies);
  const convoysState = useGameStore((s) => s.convoys);
  const expeditionsState = useGameStore((s) => s.expeditions);
  const playerForceId = useGameStore((s) => s.playerForceId);
  const lang = useLanguage();
  const t = useT();
  const handleArmyClick = (officerId: string) => {
    // A completed drag also emits a click on release — swallow it.
    if (performance.now() - dragEndedAtRef.current < 300) return;
    const clicked = armiesState[officerId];
    if (!clicked) return;
    // No selection yet → select own column.
    if (!selectedArmyId3D) {
      if (clicked.forceId === playerForceId) selectArmy(officerId);
      return;
    }
    if (officerId === selectedArmyId3D) { selectArmy(null); return; }
    // Friendly column → rendezvous and merge; enemy ROUT → hound it down
    // (掩殺 on contact); other enemy → ride out and engage.
    if (clicked.forceId === playerForceId) {
      if (mergeArmyInto(selectedArmyId3D, officerId)) selectArmy(null);
      else selectArmy(officerId);
    } else if (clicked.routed) {
      if (useGameStore.getState().pursueRout(selectedArmyId3D, officerId).ok) selectArmy(null);
    } else {
      if (startFieldBattle(selectedArmyId3D, officerId)) selectArmy(null);
    }
  };
  // 拖拽行軍 — press-hold an own column ~0.35s (hold still: >9px slop =
  // camera pan and the hold cancels), then drag; release on land reroutes
  // it there (same moveArmyToCell semantics as select+tap).
  const [dragMarch, setDragMarch] = useState<{
    id: string; px: number; py: number;
    /** 遭遇預告 — first predicted contact on the CURRENT drop target. */
    forecast?: { day: number; foeZh: string; foeEn: string } | null;
  } | null>(null);
  const dragCellRef = useRef<string>('');
  const dragMarchRef = useRef<typeof dragMarch>(null);
  dragMarchRef.current = dragMarch;
  const dragPendingRef = useRef<{ timer: ReturnType<typeof setTimeout>; sx: number; sy: number } | null>(null);
  const dragEndedAtRef = useRef(0);
  const cancelPendingDrag = () => {
    if (dragPendingRef.current) { clearTimeout(dragPendingRef.current.timer); dragPendingRef.current = null; }
  };
  const endDrag = (commit: boolean) => {
    const d = dragMarchRef.current;
    dragMarchRef.current = null;   // double-fire guard (plane up + window up)
    if (d) {
      dragEndedAtRef.current = performance.now();
      if (commit && isLandPx(d.px, d.py) && useGameStore.getState().moveArmyToCell(d.id, d.px, d.py)) {
        useGameStore.getState().selectArmy(null);
      }
    }
    setDragMarch(null);
    onDragLock?.(false);
    document.body.style.cursor = '';
  };
  const handleArmyPressStart = (officerId: string, e: { clientX: number; clientY: number }) => {
    const live = useGameStore.getState();
    const a = live.armies[officerId];
    if (!a || a.forceId !== live.playerForceId) return;
    cancelPendingDrag();
    const timer = setTimeout(() => {
      dragPendingRef.current = null;
      setDragMarch({ id: officerId, px: a.x, py: a.y });
      onDragLock?.(true);
      document.body.style.cursor = 'grabbing';
    }, 350);
    dragPendingRef.current = { timer, sx: e.clientX, sy: e.clientY };
  };
  useEffect(() => {
    const move = (ev: PointerEvent) => {
      const pend = dragPendingRef.current;
      if (pend && Math.hypot(ev.clientX - pend.sx, ev.clientY - pend.sy) > 9) cancelPendingDrag();
    };
    const up = () => { cancelPendingDrag(); if (dragMarchRef.current) endDrag(true); };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
    window.addEventListener('pointercancel', up);
    return () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      window.removeEventListener('pointercancel', up);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const fieldBattleMarks = useGameStore((s) => s.fieldBattleMarks);
  const portsForMarch = useGameStore((s) => s.ports);
  // 戰場立體微縮 — the live battle rendered in place on the world map.
  const tacticalBattle = useGameStore((s) => s.tacticalBattle);
  const battleViewMinimizedScene = useGameStore((s) => s.battleViewMinimized);
  const setBattleViewMinimized = useGameStore((s) => s.setBattleViewMinimized);
  // Mobile perf gate: only render the diorama when it's actually being watched
  // (minimized view) — desktop also gets the fly-in bloom behind the screen.
  const showDiorama = !!tacticalBattle?.geoAnchor && (!IS_MOBILE || battleViewMinimizedScene);
  const battleSitePx = tacticalBattle?.geoAnchor
    ? { x: tacticalBattle.geoAnchor.x, y: tacticalBattle.geoAnchor.y }
    : null;
  const weather = useGameStore((s) => s.weather);
  const marchPreview = useGameStore((s) => s.marchPreview);
  const weatherPreset = WEATHER_PRESETS[weather.kind];
  const season = useGameStore((s) => s.date.season) as Season;
  // 米市商旅 (§1.16) — last season's caravans, drawn under the 米價 overlay.
  const grainFlows = useGameStore((s) => s.lastGrainFlows);
  const seasonPreset = SEASON_PRESETS[season];
  // 晝夜隨旬 — the month rolls 上旬→day, 中旬→dusk, 下旬→a moonlit night, so
  // time visibly passes as each third of the month resolves.
  const tod = phaseToTOD(useGameStore((s) => s.date.phase));
  const todP = TOD_PRESETS[tod];
  // 行程測距 — with a city selected, hovering another shows the march time.
  const [hoverCityId, setHoverCityId] = useState<string | null>(null);

  // Bounds for particle effects
  const particleBounds = useMemo(() => ({ x: MAP_W, z: MAP_D }), []);

  const NEUTRAL = '#5a4530';

  // Identify capital cities by force.capitalCityId
  const capitalCityIds = useMemo(() => {
    const set = new Set<string>();
    for (const f of Object.values(forces)) {
      if (f.capitalCityId) set.add(f.capitalCityId);
    }
    return set;
  }, [forces]);

  // 城建程度 — sum of building levels per city; drives the suburb sprawl that
  // makes development visible on the map (a built-up city outgrows its wall).
  const buildingsState = useGameStore((s) => s.buildings);
  const devByCity = useMemo(() => {
    const m: Record<string, number> = {};
    for (const b of buildingsState) m[b.cityId] = (m[b.cityId] ?? 0) + Math.max(1, b.level);
    return m;
  }, [buildingsState]);

  // Maxes for heatmap normalization
  const maxes = useMemo(() => {
    const vs = Object.values(cities);
    return {
      gold:   Math.max(1, ...vs.map((c) => c.gold)),
      food:   Math.max(1, ...vs.map((c) => c.food)),
      troops: Math.max(1, ...vs.map((c) => c.troops)),
    };
  }, [cities]);

  // 威脅熱度 — per player city: hostile columns already marching at it
  // (full weight, scarier the closer) + hostile garrisons next door (they
  // could). Coloured by threat-to-garrison ratio: green can hold, red
  // cannot. Allies and pact partners don't count — they may not attack.
  const diplomacyScene = useGameStore((s) => s.diplomacy);
  const threatOverlays = useMemo(() => {
    if (overlayMode !== 'threat' || !playerForceId) return EMPTY_THREATS;
    const hostileForce = (fid: string | null | undefined) =>
      !!fid && fid !== playerForceId && isHostilePermitted(diplomacyScene, fid, playerForceId);
    const out: Record<string, { color: string; label: string }> = {};
    for (const city of Object.values(cities)) {
      if (city.ownerForceId !== playerForceId) continue;
      let inbound = 0;
      for (const a of Object.values(armiesState)) {
        if (!hostileForce(a.forceId)) continue;
        if (a.targetCityId === city.id && !a.holding) inbound += a.troops * (0.7 + 0.3 * a.progress);
      }
      for (const adjId of city.adjacentCityIds ?? []) {
        const nb = cities[adjId];
        if (nb && hostileForce(nb.ownerForceId)) inbound += nb.troops * 0.45;
      }
      const ratio = Math.min(1, inbound / Math.max(1, city.troops));
      const col = new THREE.Color('#3f9a4d').lerp(new THREE.Color('#cc2a1e'), ratio);
      out[city.id] = {
        color: `#${col.getHexString()}`,
        label: inbound >= 1000 ? `${Math.round(inbound / 1000)}k` : inbound > 0 ? `${Math.round(inbound)}` : '安',
      };
    }
    return out;
  }, [overlayMode, cities, armiesState, diplomacyScene, playerForceId]);

  // 戰爭迷霧 — optional intel limit: what your cities and columns can see.
  // View-layer only (the AI plays the same); beacons stay live regardless.
  const fogOfWarOn = useGameStore((s) => s.fogOfWar);
  const espReveals = useGameStore((s) => s.espionageReveals ?? EMPTY_REVEALS);
  const fog = useMemo(
    () => (fogOfWarOn && playerForceId
      ? computeFog(cities, armiesState, playerForceId, Object.keys(espReveals), officers)
      : null),
    [fogOfWarOn, cities, armiesState, playerForceId, espReveals, officers],
  );
  // Hostile columns out of sight simply don't render — filter the command
  // map MarchingArmies feeds on (the army layer mirrors it 1:1 by officer).
  const visibleCommands = useMemo(() => {
    if (!fog) return pendingCommands;
    const out: typeof pendingCommands = {};
    for (const [k, cmd] of Object.entries(pendingCommands)) {
      const a = armiesState[cmd.officerId ?? k];
      if (a && a.forceId !== playerForceId && !fog.isVisiblePx(a.x, a.y)) continue;
      out[k] = cmd;
    }
    return out;
  }, [fog, pendingCommands, armiesState, playerForceId]);

  return (
    <>
      {/* Distance fog — restored; blends the far horizon into the sky dome. */}
      <fog attach="fog" args={[todP.fog ?? seasonPreset.fogColor, 150 * WORLD_SCALE, 560 * WORLD_SCALE]} />

      {/* 天穹 — gradient sky + sun/moon (+ stars at night), horizon matched to fog. */}
      <SkyDome
        top={todP.skyTop}
        horizon={todP.horizon ?? seasonPreset.fogColor}
        sunPos={todP.sunPos}
        celestialColor={todP.celestialColor}
        moon={todP.celestial === 'moon'}
        stars={todP.stars}
      />

      {/* Per-season lighting, dimmed and recoloured by time of day */}
      <ambientLight intensity={seasonPreset.ambient * todP.ambientMul} color={todP.ambientColor ?? seasonPreset.ambientColor} />
      <directionalLight
        position={todP.sunPos}
        intensity={seasonPreset.sun.intensity * todP.sunMul}
        color={todP.sunColor ?? seasonPreset.sun.color}
        castShadow
        // 2048 halves shadow VRAM/fill on weak GPUs; at map scale the
        // difference is invisible.
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-left={-MAP_W}
        shadow-camera-right={MAP_W}
        shadow-camera-top={MAP_D}
        shadow-camera-bottom={-MAP_D}
        shadow-bias={-0.0005}
      />
      <directionalLight position={[-4, 5, -10]} intensity={0.45} color={seasonPreset.fillColor} />
      <hemisphereLight args={[seasonPreset.hemiSky, seasonPreset.hemiGround, seasonPreset.hemiIntensity]} />

      {/* Weather particles (rain / snow) */}
      {weatherPreset.particles === 'rain' && <RainParticles bounds={particleBounds} />}
      {weatherPreset.particles === 'snow' && <SnowParticles bounds={particleBounds} />}

      {/* 雙擊空地飛鏡 — double-clicking bare ground (when not placing a march)
          flies + zooms the camera to that spot. Cities keep their own click
          semantics, so this only fires on open terrain. */}
      <group onDoubleClick={(e) => {
        if (selectedArmyId3D) return;   // march-placement mode — don't hijack
        e.stopPropagation();
        onFocusWorld?.(e.point.x, e.point.z);
      }}>
      {mapStyle === 'hex' ? (
        // ⬡ 棋盤世界 — hex-prism quilt; rivers/lakes are blue hexes, the sea
        // is the living Ocean below. Same ground-click contract as the scroll.
        <HexWorldTerrain
          season={season}
          cities={cities}
          forces={forces}
          territoryOwnership={territoryOwnership}
          hexPaint={hexPaint}
          worldScars={worldScars}
          fogCityIds={fog ? fog.visibleCityIds : null}
          onGroundClick={(px, py) => {
            if (selectedArmyId3D && isLandPx(px, py) && moveArmyToCell(selectedArmyId3D, px, py)) {
              selectArmy(null);
            }
          }}
        />
      ) : (
        <Suspense fallback={null}>
          <MapTerrain onGroundClick={(px, py) => {
            // With an army selected, clicking open land marches it to that
            // cell and digs in — coords are geo-pixels, the same space the
            // whole simulation runs in (the old 2D path fed painted-map
            // coords here, a cross-space bug retired with it).
            if (selectedArmyId3D && isLandPx(px, py) && moveArmyToCell(selectedArmyId3D, px, py)) {
              selectArmy(null);
            }
          }} />
          <TerritoryGroundLayer cities={cities} forces={forces} territoryOwnership={territoryOwnership} />
        </Suspense>
      )}
      </group>
      <Ocean night={tod === 'night'} />
      {mapStyle === 'classic' && <Lakes3D />}
      {/* 河流流光 — the smooth shimmering ribbon rides BOTH maps; on the hex
          quilt it flows as living water down the blue channel of river tiles. */}
      <RiverRibbons frozen={season === 'winter'} />
      {mapStyle === 'classic' && season === 'winter' && <SnowBlanket />}
      {/* Forests plant at the shared height function, so the same trees stand
          perfectly on the hex quilt too. */}
      <Forest3D season={season} />
      <Farmland3D cities={cities} />
      <Villages3D />
      <GreatWall3D />
      <DriftingClouds />
      {/* 雲影掠地 — the clouds above cast drifting shade on the lowlands. */}
      {!IS_MOBILE && <CloudShadows />}
      {tod === 'day' && <Birds3D />}
      <CitySmoke3D cities={cities} />
      <Caravans3D cities={cities} />
      <TradeShips3D ports={portsForMarch} cities={cities} />
      {todP.lights && <DuskCityLights cities={cities} />}
      {/* Province borders are flat ground decals — they'd sink into the
          raised hex prisms, so the quilt view goes without them. */}
      <ProvinceBorders3D cities={cities} />
      {overlayMode === 'province' && <ProvinceLabels3D />}
      {/* 天下大勢 — lord names over their domains when zoomed out (RTK-XIV). */}
      <FactionLabels3D cities={cities} forces={forces} officers={officers} />
      <SeaLabels />
      {marchPreview && (
        <MarchPreviewLine fromId={marchPreview.fromId} toId={marchPreview.toId} cities={cities} winter={season === 'winter' || season === 'autumn'} />
      )}

      {/* In hex mode the road network is paved into the quilt itself. */}
      {mapStyle === 'classic' && <Roads cities={cities} />}
      <Bridges3D cities={cities} />
      <PostStations3D cities={cities} />
      <Landmarks3D cities={cities} />
      <UniqueLandmarks3D cities={cities} />
      <MarchingArmies cities={cities} pendingCommands={visibleCommands} forces={forces} officers={officers} ports={portsForMarch} selectedArmyId={selectedArmyId3D} onArmyClick={handleArmyClick} onArmyPressStart={handleArmyPressStart} hideNearPx={battleSitePx} playerForceId={playerForceId} spottedAmbushIds={spottedAmbushIds} />
      {/* 糧道可視 — selected long-range column shows its supply ribbon. */}
      {selectedArmyId3D && <SupplyCorridor3D armyId={selectedArmyId3D} />}
      {/* 拖拽行軍 — live drag: capture plane + ghost line + landing ring/ETA. */}
      {dragMarch && (() => {
        const a = armiesState[dragMarch.id];
        if (!a) return null;
        const [ax, az] = pxToWorld(a.x, a.y);
        const [txw, tzw] = pxToWorld(dragMarch.px, dragMarch.py);
        const land = isLandPx(dragMarch.px, dragMarch.py);
        const cmd = pendingCommands[dragMarch.id];
        const srcCity = cmd?.type === 'march' ? cities[cmd.cityId] : null;
        let eta = 1;
        if (srcCity) {
          const sp = cityPos(srcCity);
          const dist = Math.hypot(dragMarch.px - sp.x, dragMarch.py - sp.y);
          eta = dist < 100 ? 1 : dist < 195 ? 2 : dist < 275 ? 3 : 4;
        }
        const ay = sampleTerrainHeight(ax, az) + 0.35;
        const ty = sampleTerrainHeight(txw, tzw) + 0.15;
        const tint = land ? '#ffe08a' : '#c0504a';
        return (
          <group>
            <mesh
              rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.12, 0]}
              onPointerMove={(e) => {
                const px = (e.point.x + MAP_W / 2) / PIXEL_TO_WORLD;
                const py = (e.point.z + MAP_D / 2) / PIXEL_TO_WORLD;
                // 遭遇預告 — re-sweep only when the drop CELL changes (the
                // day-sweep walks every march's route; too dear per move).
                const cell = geoHexAt(px, py);
                const cellKey = `${cell.col},${cell.row}`;
                if (cellKey !== dragCellRef.current) {
                  dragCellRef.current = cellKey;
                  const live = useGameStore.getState();
                  const myCmd = live.pendingCommands[dragMarch.id];
                  let forecast: { day: number; foeZh: string; foeEn: string } | null = null;
                  if (myCmd?.type === 'march') {
                    const myArmy = live.armies[dragMarch.id];
                    const srcC = live.cities[myCmd.cityId];
                    const sp2 = srcC ? cityPos(srcC) : null;
                    const dist = sp2 ? Math.hypot(px - sp2.x, py - sp2.y) : 0;
                    const total = dist < 100 ? 1 : dist < 195 ? 2 : dist < 275 ? 3 : 4;
                    const remaining = Math.max(1, Math.ceil((1 - (myArmy?.progress ?? 0)) * total));
                    const trial = { ...myCmd, targetX: px, targetY: py, holding: false, totalSeasons: total, seasonsRemaining: remaining };
                    const others = Object.values(live.pendingCommands)
                      .filter((c): c is typeof myCmd => c.type === 'march' && c.officerId !== myCmd.officerId)
                      // 設伏不入卦 — a hidden enemy ambush must not leak through the
                      // forecast; you find out when you blunder into it (unless
                      // your scouts already flushed it — then it forecasts).
                      .filter((c) => !(c.holding && c.ambush && live.officers[c.officerId]?.forceId !== live.playerForceId
                        && !(live.spottedAmbushIds ?? []).includes(c.officerId)));
                    const contacts = computeDayEncounters([trial, ...others], live.officers, live.cities, live.diplomacy);
                    const mine = contacts.find((c) => c.a.officerId === myCmd.officerId || c.b.officerId === myCmd.officerId);
                    if (mine) {
                      const foeId = mine.a.officerId === myCmd.officerId ? mine.b.officerId : mine.a.officerId;
                      const foe = live.officers[foeId];
                      forecast = { day: Math.max(1, mine.day), foeZh: foe?.name.zh ?? '敵軍', foeEn: foe?.name.en ?? 'enemy' };
                    }
                  }
                  setDragMarch((d) => (d ? { ...d, px, py, forecast } : d));
                  return;
                }
                setDragMarch((d) => (d ? { ...d, px, py } : d));
              }}
              onPointerUp={(e) => { e.stopPropagation(); endDrag(true); }}
            >
              <planeGeometry args={[MAP_W * 2.2, MAP_D * 2.2]} />
              <meshBasicMaterial transparent opacity={0} depthWrite={false} />
            </mesh>
            <Line points={[[ax, ay, az], [txw, ty + 0.25, tzw]]} color={tint} lineWidth={2} dashed dashSize={0.4} gapSize={0.25} />
            <mesh position={[txw, ty, tzw]} rotation={[-Math.PI / 2, 0, 0]}>
              <ringGeometry args={[0.5, 0.72, 32]} />
              <meshBasicMaterial color={tint} transparent opacity={0.9} depthWrite={false} />
            </mesh>
            <Html position={[txw, ty + 0.9, tzw]} center distanceFactor={10} zIndexRange={[46, 36]} style={{ pointerEvents: 'none' }}>
              <div style={{ background: 'rgba(18,12,6,0.92)', border: `1px solid ${dragMarch.forecast ? '#e0552a' : tint}`, borderRadius: 'var(--tkm-radius-xs)', padding: '1px 7px', fontFamily: 'var(--tkm-font-body)', fontSize: '11px', color: land ? '#ffe9a8' : '#f0b0a0', whiteSpace: 'nowrap' }}>
                {land ? `${t('進駐此地', 'March here')} · ${eta}${t('旬', ' turn(s)')}` : t('不可入水', 'Water — no landing')}
                {land && dragMarch.forecast && (
                  <div style={{ color: '#ff9c7a' }}>
                    ⚠ {t(`第${dragMarch.forecast.day}日遇 ${dragMarch.forecast.foeZh}`, `Day ${dragMarch.forecast.day}: meets ${dragMarch.forecast.foeEn}`)}
                  </div>
                )}
              </div>
            </Html>
          </group>
        );
      })()}
      <Convoys cities={cities} convoys={convoysState} forces={forces} />
      <Envoys cities={cities} expeditions={expeditionsState} forces={forces} />
      {overlayMode === 'grain' && <GrainCaravans flows={grainFlows} />}
      {overlayMode === 'supply' && <SupplyLines3D />}
      {/* 糧道總覽 — the supply overlay also lights EVERY long-range column's
          corridor at once (cut ones flag red), not just the selected army:
          the whole logistics picture in one keypress. */}
      {overlayMode === 'supply' && Object.values(armiesState)
        .filter((a) => a.forceId === playerForceId && a.id !== selectedArmyId3D)
        .map((a) => <SupplyCorridor3D key={`sup-${a.id}`} armyId={a.id} />)}
      {overlayMode === 'diplomacy' && <DiplomacyLines3D cities={cities} forces={forces} />}
      {overlayMode === 'intent' && <IntentLayer cities={cities} forces={forces} armies={armiesState} playerForceId={playerForceId} fog={fog} />}
      <FieldBattleMarks3D marks={fieldBattleMarks} />
      <FieldClashMelee3D marks={fieldBattleMarks} />
      <IgnitionDust3D />
      <QueuedBattles3D />
      <DayEncounterMarks3D />
      <BeaconAlerts3D />
      {/* 長圍 — invested cities wear a pulsing amber noose. */}
      <SiegeRings3D />
      <BurningCities3D />
      <EventMarks3D cities={cities} hidePx={battleSitePx} visibleCityIds={fog?.visibleCityIds ?? null} onPick={(id) => selectCity(id)} />
      <Ports3D onPortClick={onPortClick} />
      <Forts3D onFortClick={onFortClick} hideNearPx={battleSitePx} />
      <Tribes3D onTribeClick={onTribeClick} />
      <WildSites3D onSiteClick={onSiteClick} />
      <ScenicSites3D onScenicClick={onScenicClick} />
      <TradeRouteLines3D cities={cities} />
      <GeoLabels3D />
      <EspionageAgents3D cities={cities} />
      <DepartureFlourish3D />
      <ConquestFlourish3D />
      <LossFlourish3D />

      {/* 戰場微縮 — the LIVE battle, embedded on the very ground it's fought
          over (same scene component, same state; rotated to its true bearing,
          anchored on its geoAnchor column). Tap to enter the fullscreen view. */}
      {showDiorama && tacticalBattle?.geoAnchor && (() => {
        const ga = tacticalBattle.geoAnchor;
        // P3 圖上開戰 — the battle renders 1:1 ON the world lattice: the same
        // battleWindow() that cut the board out of the map now puts it back,
        // cell-for-cell (flip mirrors east-approach boards; no rotation).
        const win = battleWindow(ga, tacticalBattle.width, tacticalBattle.height);
        const apx = geoHexCenter(win.anchor.col, win.anchor.row);
        const [bwx, bwz] = pxToWorld(apx.x, apx.y);
        const by = sampleTerrainHeight(bwx, bwz) + 0.12;
        const S = HEXW_R; // canonical cell size — board hex = world hex
        const [acx, acz] = battleHexWorld(win.anchorCol, win.anchorRow);
        const [bcx, bcz] = battleHexWorld(
          Math.floor(tacticalBattle.width / 2),
          Math.floor(tacticalBattle.height / 2),
        );
        const pSide = tacticalBattle.attackerForceId === playerForceId ? 'attacker' as const
          : tacticalBattle.defenderForceId === playerForceId ? 'defender' as const : null;
        return (
          <group position={[bwx, by, bwz]} scale={[win.flip * S, S, S]}>
            <group position={[-acx, 0, -acz]}>
              {/* Dark plinth so the board reads cleanly over sloped terrain */}
              <mesh position={[bcx, -0.7, bcz]} receiveShadow>
                <boxGeometry args={[tacticalBattle.width * 1.5 + 3, 1.3, tacticalBattle.height * Math.sqrt(3) + 3]} />
                <meshStandardMaterial color="#241c12" roughness={0.95} />
              </mesh>
              <BattleScene
                embedded
                battle={tacticalBattle}
                playerSide={pSide}
                actionMode={dioCast && dioSelectedId
                  ? { kind: 'stratagem', id: dioCast.id, tacticId: dioCast.tacticId }
                  : dioSelectedId ? { kind: dioMode } : { kind: 'none' }}
                selectedId={dioSelectedId}
                hovered={dioHover}
                setHovered={onDioHover}
                onTileClick={onDioramaTile}
                attackArcs={dioArcs}
                stratagemFx={dioFx}
                officers={officers}
              />
            </group>
          </group>
        );
      })()}
      {showDiorama && tacticalBattle?.geoAnchor && (() => {
        const [bwx, bwz] = pxToWorld(tacticalBattle.geoAnchor.x, tacticalBattle.geoAnchor.y);
        const by = sampleTerrainHeight(bwx, bwz);
        return (
          <Html position={[bwx, by + 1.15, bwz]} center distanceFactor={10} zIndexRange={[60, 50]}>
            <button
              onClick={() => setBattleViewMinimized(false)}
              style={{
                background: 'rgba(26, 16, 10, 0.92)', color: '#f0d98a',
                border: '1px solid #d4a84a', borderRadius: 'var(--tkm-radius-xs)',
                padding: '3px 10px', cursor: 'pointer',
                fontFamily: 'var(--tkm-font-body)', fontSize: '13px',
                letterSpacing: '1px', whiteSpace: 'nowrap',
                boxShadow: '0 0 10px rgba(212,168,74,0.45)',
              }}
            >
              {t(`⚔ 戰鬥進行中 · 第${tacticalBattle.turn}回 ▸ 進入`, `⚔ Battle in progress · T${tacticalBattle.turn} ▸ Enter`)}
            </button>
          </Html>
        );
      })()}

      {Object.values(cities).map((city) => {
        const force = forces[city.ownerForceId ?? ''];
        const color = force?.color ?? NEUTRAL;
        const [px, py] = cityPixel(city.id, city.coords.x, city.coords.y);
        // The battle diorama replaces the local scenery — a besieged city's
        // walls are ON the board, so the giant token underneath would clash.
        if (battleSitePx && Math.hypot(px - battleSitePx.x, py - battleSitePx.y) < 50) return null;
        const [wx, wz] = pxToWorld(px, py);
        const terrainY = cityElevation(wx, wz);
        return (
          <group
            key={city.id}
            onPointerOver={(e) => { e.stopPropagation(); setHoverCityId(city.id); }}
            onPointerOut={() => setHoverCityId((cur) => (cur === city.id ? null : cur))}
          >
            <City3D
              city={city}
              forceColor={color}
              isCapital={capitalCityIds.has(city.id)}
              isSelected={selectedCityId === city.id}
              terrainY={terrainY}
              development={devByCity[city.id] ?? 0}
              isOwn={!!playerForceId && city.ownerForceId === playerForceId}
              overlay={fog && city.ownerForceId !== playerForceId && !fog.visibleCityIds.has(city.id)
                ? (overlayMode === 'none' ? null : FOG_OVERLAY)
                : overlayMode === 'threat' ? (threatOverlays[city.id] ?? null) : overlayForCity(city, overlayMode, maxes, season)}
              onClick={() => {
                // RTS-style: with an army selected, clicking a city re-routes
                // the column there (the 2D map used to own this interaction).
                if (selectedArmyId3D && redirectArmy(selectedArmyId3D, city.id)) {
                  selectArmy(null);
                  return;
                }
                if (selectedCityId === city.id) openCityMap();
                else selectCity(city.id);
              }}
            />
            <CityDefenseRing city={city} wx={wx} wz={wz} terrainY={terrainY} />
          </group>
        );
      })}

      {/* 城市快捷輪盤 — quick actions fanned around the selected city. */}
      {selectedCityId && cities[selectedCityId] && (() => {
        const c = cities[selectedCityId]!;
        const [px, py] = cityPixel(c.id, c.coords.x, c.coords.y);
        if (battleSitePx && Math.hypot(px - battleSitePx.x, py - battleSitePx.y) < 50) return null;
        const [wx, wz] = pxToWorld(px, py);
        const y = cityElevation(wx, wz);
        return (
          <Html position={[wx, y + 0.55, wz]} center distanceFactor={9} zIndexRange={[44, 34]}>
            <CityQuickRing
              key={c.id}
              own={c.ownerForceId === playerForceId}
              onEnter={() => openCityMap()}
              onMarch={() => onQuickAction('march', c.id)}
              onRecruit={() => onQuickAction('recruit', c.id)}
              onMuster={() => onQuickAction('muster', c.id)}
              onGovern={() => onQuickAction('govern', c.id)}
            />
          </Html>
        );
      })()}

      {/* 可達範圍 — with a column selected, concentric rings mark how far
          1/2/3 旬 of marching reach (the same geo thresholds the move order
          uses, centred on the column's source city like the order math). */}
      {selectedArmyId3D && armiesState[selectedArmyId3D] && cities[armiesState[selectedArmyId3D]!.fromCityId] && (() => {
        const src = cities[armiesState[selectedArmyId3D]!.fromCityId]!;
        const sp = cityPos(src);
        const [wx, wz] = pxToWorld(sp.x, sp.y);
        const rings = [
          { rpx: 100, zh: t('1旬', '1 wk') },
          { rpx: 195, zh: t('2旬', '2 wk') },
          { rpx: 275, zh: t('3旬', '3 wk') },
        ];
        return (
          <group>
            {rings.map((r, i) => (
              <mesh key={i} position={[wx, 0.1, wz]} rotation={[-Math.PI / 2, 0, 0]} renderOrder={6}>
                <ringGeometry args={[r.rpx * PIXEL_TO_WORLD - 0.045, r.rpx * PIXEL_TO_WORLD + 0.045, 96]} />
                <meshBasicMaterial color="#f0d98a" transparent opacity={0.42 - i * 0.1} depthWrite={false} depthTest={false} side={THREE.DoubleSide} />
              </mesh>
            ))}
            {rings.map((r, i) => (
              <Html key={`l${i}`} position={[wx + r.rpx * PIXEL_TO_WORLD * 0.7071, 0.25, wz - r.rpx * PIXEL_TO_WORLD * 0.7071]} center distanceFactor={11} zIndexRange={[26, 16]} style={{ pointerEvents: 'none' }}>
                <div style={{
                  background: 'rgba(20,14,8,0.82)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 'var(--tkm-radius)',
                  padding: '0 5px', fontFamily: 'var(--tkm-font-body)', fontSize: 10, color: '#f0d98a',
                  whiteSpace: 'nowrap',
                }}>{r.zh}</div>
              </Html>
            ))}
          </group>
        );
      })()}

      {/* 行軍時距環 — a selected column shows its march-time bands. */}
      {selectedArmyId3D && armiesState[selectedArmyId3D]
        && cities[armiesState[selectedArmyId3D]!.fromCityId] && (() => {
        const src = cities[armiesState[selectedArmyId3D]!.fromCityId]!;
        const [cx, cy] = cityPixel(src.id, src.coords.x, src.coords.y);
        return <MarchRangeRings cx={cx} cy={cy} />;
      })()}

      {/* 改道測距 — column selected + hovering a city: how long the redirect
          would take from the column's source (the order's own math). */}
      {selectedArmyId3D && hoverCityId && armiesState[selectedArmyId3D]
        && cities[armiesState[selectedArmyId3D]!.fromCityId] && cities[hoverCityId] && (() => {
        const src = cities[armiesState[selectedArmyId3D]!.fromCityId]!;
        const to = cities[hoverCityId]!;
        if (to.id === src.id) return null;
        const ticks = marchDurationFor(src, to, season);
        const [px, py] = cityPixel(to.id, to.coords.x, to.coords.y);
        const [wx, wz] = pxToWorld(px, py);
        const y = cityElevation(wx, wz);
        // 遭遇預告 — the same day-sweep the drag ghost runs: would THIS
        // redirect walk into a hostile column, and on which day?
        const live = useGameStore.getState();
        const myCmd = live.pendingCommands[selectedArmyId3D];
        let fc: { day: number; foe: string } | null = null;
        if (myCmd?.type === 'march') {
          const myArmy = live.armies[selectedArmyId3D];
          const remaining = Math.max(1, Math.ceil((1 - (myArmy?.progress ?? 0)) * ticks));
          const trial = { ...myCmd, targetCityId: to.id, targetX: undefined, targetY: undefined, holding: false, totalSeasons: ticks, seasonsRemaining: remaining };
          const others = Object.values(live.pendingCommands)
            .filter((c): c is typeof myCmd => c.type === 'march' && c.officerId !== myCmd.officerId)
            .filter((c) => !(c.holding && c.ambush && live.officers[c.officerId]?.forceId !== live.playerForceId
              && !(live.spottedAmbushIds ?? []).includes(c.officerId)));
          const mine = computeDayEncounters([trial, ...others], live.officers, live.cities, live.diplomacy)
            .find((c) => c.a.officerId === myCmd.officerId || c.b.officerId === myCmd.officerId);
          if (mine) {
            const foeId = mine.a.officerId === myCmd.officerId ? mine.b.officerId : mine.a.officerId;
            const foe = live.officers[foeId];
            fc = { day: Math.max(1, mine.day), foe: foe ? pickName(foe.name, lang) : '?' };
          }
        }
        return (
          <Html position={[wx, y + 1.35, wz]} center distanceFactor={9} zIndexRange={[42, 32]} style={{ pointerEvents: 'none' }}>
            <div style={{
              background: 'rgba(20,14,8,0.9)', border: `1px solid ${fc ? '#e0552a' : '#f0d98a'}`, borderRadius: 'var(--tkm-radius-xs)',
              padding: '2px 8px', fontFamily: 'var(--tkm-font-body)', fontSize: '11px',
              color: '#f0d98a', whiteSpace: 'nowrap', letterSpacing: '1px',
            }}>
              {t('改道 → ', 'Reroute → ')}{pickName(to.name, lang)}{t(` · 約 ${ticks} 旬`, ` · ~${ticks} wk`)}
              {fc && (
                <div style={{ color: '#ff9c7a' }}>⚠ {t(`第${fc.day}日遇 ${fc.foe}`, `Day ${fc.day}: meets ${fc.foe}`)}</div>
              )}
            </div>
          </Html>
        );
      })()}

      {/* 行程測距 — selected → hovered march time, in the same 旬 the end-turn
          button counts in. */}
      {!selectedArmyId3D && selectedCityId && hoverCityId && hoverCityId !== selectedCityId
        && cities[selectedCityId] && cities[hoverCityId] && (() => {
        const from = cities[selectedCityId]!;
        const to = cities[hoverCityId]!;
        const ticks = marchDurationFor(from, to, season);
        const [px, py] = cityPixel(to.id, to.coords.x, to.coords.y);
        const [wx, wz] = pxToWorld(px, py);
        const y = cityElevation(wx, wz);
        return (
          <Html position={[wx, y + 1.35, wz]} center distanceFactor={9} zIndexRange={[42, 32]} style={{ pointerEvents: 'none' }}>
            <div style={{
              background: 'rgba(20,14,8,0.9)', border: '1px solid #d4a84a', borderRadius: 'var(--tkm-radius-xs)',
              padding: '2px 8px', fontFamily: 'var(--tkm-font-body)', fontSize: '11px',
              color: '#f0d98a', whiteSpace: 'nowrap', letterSpacing: '1px',
            }}>
              {pickName(from.name, lang)} → {pickName(to.name, lang)}{t(` · 行軍約 ${ticks} 旬`, ` · march ~${ticks} wk`)}
            </div>
          </Html>
        );
      })()}

      {/* 懸停快覽 — hovering a city (desktop) cards its owner + troops/food,
          unless a march/redirect distance preview is already on it. Fogged
          enemy cities show name only. */}
      {!IS_MOBILE && hoverCityId && cities[hoverCityId]
        && !(selectedArmyId3D && armiesState[selectedArmyId3D])
        && !(selectedCityId && hoverCityId !== selectedCityId) && (() => {
        const c = cities[hoverCityId]!;
        const owner = c.ownerForceId ? forces[c.ownerForceId] : null;
        const fogged = !!fog && c.ownerForceId !== playerForceId && !fog.visibleCityIds.has(c.id);
        const [px, py] = cityPixel(c.id, c.coords.x, c.coords.y);
        const [wx, wz] = pxToWorld(px, py);
        const y = cityElevation(wx, wz);
        const fmt = (n: number) => Math.round(n).toLocaleString();
        return (
          <Html position={[wx, y + 1.75, wz]} center distanceFactor={9} zIndexRange={[43, 33]} style={{ pointerEvents: 'none' }}>
            <div style={{
              background: 'rgba(18,12,6,0.92)', border: '1px solid #6a5230', borderRadius: 'var(--tkm-radius-sm)',
              padding: '3px 9px', fontFamily: 'var(--tkm-font-body)', fontSize: '11px',
              color: '#e7d6ad', whiteSpace: 'nowrap', lineHeight: 1.5, boxShadow: '0 2px 10px rgba(0,0,0,0.5)',
            }}>
              <div style={{ fontWeight: 'bold', letterSpacing: '1px' }}>
                {pickName(c.name, lang)}
                <span style={{ color: owner?.color ?? '#8a7a58', marginLeft: 6, fontWeight: 'normal' }}>
                  {owner ? pickName(owner.name, lang) : t('中立', 'Neutral')}
                </span>
              </div>
              {fogged
                ? <div style={{ color: '#9a8a66' }}>{t('情報不足', 'No intel')}</div>
                : <div>{t('兵 ', 'Troops ')}{fmt(c.troops)} · {t('糧 ', 'Food ')}{fmt(c.food)}</div>}
            </div>
          </Html>
        );
      })()}
    </>
  );
}

/* ─── 城市快捷輪盤 — radial quick actions on the selected city ──────────
   Own city: 進城 / 出陣 / 徵兵 fan out around the token — the three things
   you actually do every turn, one tap instead of a trip through the city
   screen. Hostile city: a single 全軍集結 button (armed by a first tap so
   a stray click can't commit the whole realm to war). */

export function StrategicMap3D() {
  const [overlayMode, setOverlayMode] = useState<OverlayMode>('none');
  const [selectedPortId, setSelectedPortId] = useState<string | null>(null);
  const [selectedFortId, setSelectedFortId] = useState<string | null>(null);
  const [selectedTribeId, setSelectedTribeId] = useState<string | null>(null);
  const [selectedSiteId, setSelectedSiteId] = useState<string | null>(null);
  const [selectedScenicId, setSelectedScenicId] = useState<string | null>(null);
  const [showStockadeBuild, setShowStockadeBuild] = useState(false);
  // Orbit pivot — held as STATE (stable ref) so re-renders don't snap the
  // target back; BattleFocusFly animates it to a clash site, then locks it in.
  const controlsRef = useRef<{ target: THREE.Vector3; update: () => void; enabled: boolean } | null>(null);
  const [orbitTarget, setOrbitTarget] = useState<[number, number, number]>([0, 0, 0]);
  // While a battle diorama is on the map, let the camera dive much closer.
  const battleActive = useGameStore((s) => !!s.tacticalBattle);
  // 標籤分級 — quantized camera distance, provided to City3D labels.
  const [zoomLod, setZoomLod] = useState<'near' | 'far'>('near');
  const tod = phaseToTOD(useGameStore((s) => s.date.phase));

  // 畫面復原 — WebGL context-loss guard. On a long session iOS WKWebView can
  // drop the GL context under GPU-memory pressure; three.js calls
  // preventDefault() (so the browser *may* restore it) and the continuous
  // render loop repaints once it does. But on a hard out-of-memory loss the
  // browser may never fire 'webglcontextrestored', leaving a permanently black
  // map. If no restore arrives within a short grace window we bump this epoch
  // to fully remount the <Canvas> with a brand-new GL context — the cached
  // terrain/normal/water textures simply re-upload into the fresh renderer.
  const [glEpoch, setGlEpoch] = useState(0);
  const glRestoreTimer = useRef<number | null>(null);
  useEffect(() => () => {
    if (glRestoreTimer.current != null) window.clearTimeout(glRestoreTimer.current);
  }, []);

  // 鏡頭按鈕橋接 — an in-Canvas rig (MapCamApi) publishes imperative zoom /
  // recenter / flyTo helpers here, so the DOM corner buttons (which live
  // outside the Canvas) and double-click can drive the camera without
  // re-implementing OrbitControls.
  const camApiRef = useRef<CamApi | null>(null);
  // 前往閒置武將 — the HUD's idle-officer button (outside the Canvas) asks the
  // map to fly to a city through this bus; we smooth-fly to a steady city view.
  useEffect(() => {
    setMapFocusHandler((cityId) => {
      const c = useGameStore.getState().cities[cityId];
      if (!c) return;
      const [px, py] = cityPixel(c.id, c.coords.x, c.coords.y);
      const [wx, wz] = pxToWorld(px, py);
      camApiRef.current?.flyTo(wx, wz, MAP_D * 0.45);
    });
    return () => setMapFocusHandler(null);
  }, []);
  // 跟拍 — while the day flow plays with follow enabled, glide the camera
  // after the player's lead marching column (largest troops). One flyTo per
  // day tick keeps the ride smooth without fighting manual panning between
  // ticks; the encounter auto-pause then lands with the camera on scene.
  const dfFollowOn = useGameStore((st) => (st.dayFlow ? st.dayFlowFollow : false));
  const dfDayForCam = useGameStore((st) => st.dayFlow?.day ?? -1);
  useEffect(() => {
    if (!dfFollowOn || dfDayForCam < 0) return;
    const live = useGameStore.getState();
    const pf = live.playerForceId;
    if (!pf) return;
    const marches = Object.values(live.pendingCommands).filter(
      (c): c is Extract<typeof c, { type: 'march' }> =>
        c.type === 'march' && !c.holding && live.officers[c.officerId]?.forceId === pf,
    );
    if (marches.length === 0) return;
    const lead = marches.reduce((a, b) => ((b.troops ?? 0) > (a.troops ?? 0) ? b : a));
    const pos = marchPositionAtDay(lead, live.cities, dfDayForCam);
    if (!pos) return;
    const [wx, wz] = pxToWorld(pos.x, pos.y);
    camApiRef.current?.flyTo(wx, wz);
  }, [dfFollowOn, dfDayForCam]);
  // 回都 — select the player's capital and fly to it (Home key + the 🏛 button).
  const jumpToCapital = () => {
    const st = useGameStore.getState();
    const cap = st.playerForceId ? st.forces[st.playerForceId]?.capitalCityId : null;
    if (!cap || !st.cities[cap]) return;
    st.selectCity(cap);
    requestMapFocus(cap);
  };
  // 羅盤朝向 — camera azimuth (deg), fed by an in-Canvas tracker; drives the
  // compass rose so 北 always points north even after you twist the view.
  const [heading, setHeading] = useState(0);

  // 開局取景 — once the map mounts, ease the camera from the default whole-map
  // overview onto YOUR realm (the bounding circle of your cities), so you open
  // looking at your own situation instead of the dead centre of the map.
  const framedRef = useRef(false);
  useEffect(() => {
    if (framedRef.current) return;
    const s = useGameStore.getState();
    const pid = s.playerForceId;
    if (!pid) return;
    const own = Object.values(s.cities).filter((c) => c.ownerForceId === pid);
    if (own.length === 0) return;
    const pts = own.map((c) => cityPixel(c.id, c.coords.x, c.coords.y));
    const ccx = pts.reduce((a, p) => a + p[0], 0) / pts.length;
    const ccy = pts.reduce((a, p) => a + p[1], 0) / pts.length;
    const maxR = pts.reduce((m, p) => Math.max(m, Math.hypot(p[0] - ccx, p[1] - ccy)), 0);
    const [wx, wz] = pxToWorld(ccx, ccy);
    const radiusWorld = (maxR + 120) * PIXEL_TO_WORLD;   // pad so cities sit off the very edge
    // Cap well below MAP_MAX_DIST — a realm spanning half of China (漢室
    // 39 城) would otherwise open at the fog wall and read as a blank wash.
    const fitDist = THREE.MathUtils.clamp(
      (radiusWorld / Math.sin((MAP_FOV_DEG / 2) * Math.PI / 180)) * 1.1, 45, 130);
    framedRef.current = true;
    let tries = 0;
    const tryFrame = () => {
      if (camApiRef.current) { camApiRef.current.flyTo(wx, wz, fitDist); return; }
      if (tries++ < 40) requestAnimationFrame(tryFrame);   // wait for the GL scene to mount
    };
    const id = window.setTimeout(() => requestAnimationFrame(tryFrame), 220);
    return () => window.clearTimeout(id);
  }, []);
  // 鍵盤 / 邊緣平移 — held-direction state (desktop only). MapCamApi reads the
  // combined {x,z} each frame; DOM listeners below keep the parts in sync.
  const panInputRef = useRef<{ x: number; z: number }>({ x: 0, z: 0 });
  const heldKeysRef = useRef<Set<string>>(new Set());
  const edgePanRef = useRef<{ x: number; z: number }>({ x: 0, z: 0 });
  // Combine held keys + edge state into the {x,z} MapCamApi reads each frame.
  // Stored in a ref so both the keyboard and the edge-scroll effects share it.
  const recomputePanRef = useRef<() => void>(() => {});
  recomputePanRef.current = () => {
    const k = heldKeysRef.current, eg = edgePanRef.current;
    let x = eg.x, z = eg.z;
    if (k.has('left')) x -= 1;
    if (k.has('right')) x += 1;
    if (k.has('up')) z += 1;
    if (k.has('down')) z -= 1;
    panInputRef.current = { x: Math.max(-1, Math.min(1, x)), z: Math.max(-1, Math.min(1, z)) };
  };
  useEffect(() => {
    if (IS_MOBILE) return;   // touch users pan with a finger; no keys / edges
    const recompute = () => recomputePanRef.current();
    const dirOf = (key: string): string | null => {
      switch (key) {
        case 'w': case 'W': case 'ArrowUp': return 'up';
        case 's': case 'S': case 'ArrowDown': return 'down';
        case 'a': case 'A': case 'ArrowLeft': return 'left';
        case 'd': case 'D': case 'ArrowRight': return 'right';
        default: return null;
      }
    };
    const onDown = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement | null;
      if (el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable)) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const dir = dirOf(e.key);
      if (!dir) return;
      if (e.key.startsWith('Arrow')) e.preventDefault();   // stop the page scrolling
      heldKeysRef.current.add(dir);
      recompute();
    };
    const onUp = (e: KeyboardEvent) => {
      const dir = dirOf(e.key);
      if (!dir) return;
      heldKeysRef.current.delete(dir);
      recompute();
    };
    // Focus loss can swallow a keyup — clear everything so a key never sticks.
    const clearAll = () => { heldKeysRef.current.clear(); edgePanRef.current = { x: 0, z: 0 }; recompute(); };
    window.addEventListener('keydown', onDown);
    window.addEventListener('keyup', onUp);
    window.addEventListener('blur', clearAll);
    return () => {
      window.removeEventListener('keydown', onDown);
      window.removeEventListener('keyup', onUp);
      window.removeEventListener('blur', clearAll);
    };
  }, []);

  // 環境音 — wind under everything; birds by day, crickets at dusk/night, war
  // drums while a battle burns. Follows the sound toggle live.
  const soundOn = useGameStore((s) => s.soundEnabled);
  useEffect(() => {
    if (!soundOn) { stopMapAmbience(); return; }
    startMapAmbience(battleActive ? 'war' : tod === 'day' ? 'day' : 'dusk');
    return () => stopMapAmbience();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [soundOn]);
  useEffect(() => {
    setMapAmbienceMode(battleActive ? 'war' : tod === 'day' ? 'day' : 'dusk');
  }, [battleActive, tod]);

  // 迷你導航 — camera view window for the corner minimap + click-to-jump.
  const [navView, setNavView] = useState<{ cx: number; cy: number; span: number } | null>(null);
  const [navJump, setNavJump] = useState<{ px: number; py: number; seq: number } | null>(null);
  const selectCityOuter = useGameStore((s) => s.selectCity);
  const fogOfWar = useGameStore((s) => s.fogOfWar);
  const setFogOfWar = useGameStore((s) => s.setFogOfWar);
  // 手機收納 — objective card and the map-tools tray fold away by default.
  const [objOpen, setObjOpen] = useState(false);
  const [toolsOpen, setToolsOpen] = useState(false);
  // 圖層托盤外點即收 — same manner as the HUD dropdowns.
  const toolsTrayRef = useRef<HTMLDivElement | null>(null);
  const toolsTriggerRef = useRef<HTMLButtonElement | null>(null);
  useEffect(() => {
    if (!toolsOpen) return;
    const onDown = (e: MouseEvent) => {
      const target = e.target as Node;
      if (toolsTrayRef.current?.contains(target) || toolsTriggerRef.current?.contains(target)) return;
      setToolsOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [toolsOpen]);
  // 戰役回放面板開關。
  const [showReplay, setShowReplay] = useState(false);
  const [showMapHelp, setShowMapHelp] = useState(false);

  // 鍵盤快捷鍵 — 1..9 switch overlays, Tab cycles own cities (camera in
  // tow), Esc backs out of selections. Typing in any input is exempt.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement | null;
      if (el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable)) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      // 讓位彈窗 — while any modal/window owns the screen, none of these map
      // hotkeys (overlay switch / Tab city-cycle / Home / Esc-deselect) should
      // fire behind it and silently change the map underneath the dialog.
      if (hasEscapeLayers()) return;
      if (e.key === '0') {
        // 0 toggles the strategic-intent (兵鋒) overlay — it's the 10th mode,
        // past the 1–9 number row.
        setOverlayMode((cur) => (cur === 'intent' ? 'none' : 'intent'));
      } else if (e.key >= '1' && e.key <= '9') {
        const opt = OVERLAY_OPTIONS.filter((o) => o.id !== 'none')[Number(e.key) - 1];
        if (opt) setOverlayMode((cur) => (cur === opt.id ? 'none' : opt.id));
      } else if (e.key === 'Tab') {
        e.preventDefault();
        const s = useGameStore.getState();
        const own = Object.values(s.cities)
          .filter((c) => c.ownerForceId === s.playerForceId)
          .sort((a, b) => a.name.zh.localeCompare(b.name.zh));
        if (own.length === 0) return;
        const idx = own.findIndex((c) => c.id === s.selectedCityId);
        const next = own[(idx + 1) % own.length];
        s.selectCity(next.id);
        const [px, py] = cityPixel(next.id, next.coords.x, next.coords.y);
        setNavJump({ px, py, seq: Date.now() });
      } else if (e.key === 'Escape') {
        const s = useGameStore.getState();
        if (s.selectedArmyId) s.selectArmy(null);
        else if (s.selectedCityId) s.selectCity(null);
        setQuickPick(null);
      } else if (e.key === 'Home' || e.key === 'h' || e.key === 'H') {
        jumpToCapital();   // 回都
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);
  // 天下大勢 snapshot — grab the WebGL canvas as a PNG.
  const mapRootRef = useRef<HTMLDivElement>(null);
  const snapYear = useGameStore((s) => s.date.year);
  const exportSnapshot = () => {
    const notify = useGameStore.getState().notify;
    const canvas = mapRootRef.current?.querySelector('canvas') as HTMLCanvasElement | null;
    if (!canvas) { notify('無法擷取畫面 — 地圖尚未就緒', "Couldn't capture — map not ready", 'warn'); return; }
    try {
      const url = canvas.toDataURL('image/png');
      if (IS_MOBILE) {
        // 手機 — a.download is a no-op in iOS Safari; open the PNG so the
        // player can long-press → save. Either way, confirm something happened.
        window.open(url, '_blank');
        notify('已產生天下大勢圖 — 長按可儲存', 'Realm snapshot opened — long-press to save');
      } else {
        const a = document.createElement('a');
        a.href = url;
        a.download = `天下大勢-${snapYear}年.png`;
        a.click();
        notify(`已存為 天下大勢-${snapYear}年.png`, `Saved 天下大勢-${snapYear}年.png`);
      }
    } catch {
      notify('擷取失敗', 'Snapshot failed', 'warn');
    }
  };
  // 烽火示警 — hostile columns marching on player cities (chip top-left).
  const beaconCities = useGameStore((s) => s.cities);
  const beaconArmies = useGameStore((s) => s.armies);
  const beaconSelectCity = useGameStore((s) => s.selectCity);
  const beaconPlayerForceId = useGameStore((s) => s.playerForceId);
  const beaconAlerts = useMemo(
    () => computeBeaconAlerts(beaconCities, beaconArmies, beaconPlayerForceId),
    [beaconCities, beaconArmies, beaconPlayerForceId],
  );
  // ⬡ 棋盤世界 experiment — hex-tile world terrain; the painted scroll map
  // stays the default and is always one tap away (backup).
  const [mapStyle, setMapStyle] = useState<'classic' | 'hex'>(
    // P1 統一格網 — the hex board is the primary form (ROTK-XIV style);
    // the painted scroll stays as the opt-in 鑑賞 mode.
    () => (localStorage.getItem('tkm-map-style') === 'classic' ? 'classic' : 'hex'),
  );
  const toggleMapStyle = () => {
    const next = mapStyle === 'hex' ? 'classic' : 'hex';
    setMapStyle(next);
    localStorage.setItem('tkm-map-style', next);
  };

  // ── 原地指揮 (stage 3) — command the minimized battle right on the map ──
  // Selection is keyed by battle id so a stale pick can't leak into the next
  // fight (unit ids repeat across battles); validity is derived, no effects.
  const worldBattle = useGameStore((s) => s.tacticalBattle);
  const worldBattleMinimized = useGameStore((s) => s.battleViewMinimized);
  const setBattleViewMinimized = useGameStore((s) => s.setBattleViewMinimized);
  const startBattleUpdate = useGameStore((s) => s.startTacticalBattle);
  const officersAll = useGameStore((s) => s.officers);
  const playerForceId = useGameStore((s) => s.playerForceId);
  const [dioPick, setDioPick] = useState<{ bid: string; uid: string } | null>(null);
  const [dioMode, setDioMode] = useState<'move' | 'attack'>('move');
  const [dioHover, setDioHoverRaw] = useState<HexCoord | null>(null);
  const setDioHover = (c: HexCoord | null) => {
    setDioHoverRaw((prev) => (prev?.col === c?.col && prev?.row === c?.row ? prev : c));
  };
  // 計謀 — an armed stratagem waiting for its target hex; FX ride the diorama.
  // tacticId set = a personal/signature tactic riding an underlying stratagem.
  const [dioCast, setDioCast] = useState<{ id: StratagemId; tacticId?: string } | null>(null);
  const [dioFx, setDioFx] = useState<StratagemFxInstance[]>([]);
  // 戰鬥運鏡 — same impact kick as the tactical screen, on the big-map battle.
  const [cine, setCine] = useState<{ key: number; weight: number; color: string } | null>(null);
  const cineCount = useRef(0);
  const mapCanvasWrapRef = useRef<HTMLDivElement>(null);
  // 邊緣滾屏 — nudging the mouse into the canvas edge band pans the map
  // (desktop only). Corner UI lives outside this wrapper, so hovering a button
  // never triggers a scroll.
  useEffect(() => {
    if (IS_MOBILE) return;
    const el = mapCanvasWrapRef.current;
    if (!el) return;
    const M = 42;   // edge band thickness in px
    const onMove = (e: PointerEvent) => {
      if (e.pointerType === 'touch') return;
      const r = el.getBoundingClientRect();
      let x = 0, z = 0;
      if (e.clientX <= r.left + M) x = -1; else if (e.clientX >= r.right - M) x = 1;
      if (e.clientY <= r.top + M) z = 1; else if (e.clientY >= r.bottom - M) z = -1;
      edgePanRef.current = { x, z };
      recomputePanRef.current();
    };
    const onLeave = () => { edgePanRef.current = { x: 0, z: 0 }; recomputePanRef.current(); };
    el.addEventListener('pointermove', onMove);
    el.addEventListener('pointerleave', onLeave);
    return () => {
      el.removeEventListener('pointermove', onMove);
      el.removeEventListener('pointerleave', onLeave);
    };
  }, []);
  const punchFx = (kind: StratagemFxKind, color: string) => {
    const weight = FX_IMPACT[kind];
    if (weight > 0) setCine({ key: ++cineCount.current, weight, color });
  };
  useEffect(() => {
    if (!cine || cine.weight <= 0) return;
    const el = mapCanvasWrapRef.current;
    if (!el || typeof el.animate !== 'function') return;
    const a = cine.weight >= 2 ? 10 : 4.5;
    el.animate(
      [
        { transform: 'translate(0,0) scale(1)' },
        { transform: `translate(${a}px,${-a * 0.7}px) scale(1.03)` },
        { transform: `translate(${-a}px,${a * 0.6}px) scale(1.03)` },
        { transform: `translate(${a * 0.6}px,${a * 0.5}px) scale(1.02)` },
        { transform: 'translate(0,0) scale(1)' },
      ],
      { duration: cine.weight >= 2 ? 420 : 250, easing: 'ease-out' },
    );
  }, [cine?.key]);  // eslint-disable-line react-hooks/exhaustive-deps
  const dioFxIdRef = useRef(0);
  /** Spawn one cast FX on the diorama: particle + sound + 運鏡, auto-expired. */
  const spawnCastFx = (coord: HexCoord, spec: TacticFxSpec) => {
    const fxId = ++dioFxIdRef.current;
    const now = Date.now();
    setDioFx((arr) => [...arr, { id: fxId, coord, spec, spawnedAt: now }]);
    playFxSfx(spec.kind);
    punchFx(spec.kind, spec.color);
    const lifeMs = (FX_DURATION[spec.kind] ?? 1.5) * 1000 + 200;
    setTimeout(() => setDioFx((arr) => arr.filter((f) => f.id !== fxId)), lifeMs);
  };
  // 大地圖 AI 施放戰法 → 在縮圖戰場播同樣的特效/音效/運鏡。BattleAIDriver 無頭
  // 推進、不直接入 dioFx,故經 store 的 battleFxBatch 轉一手。
  const battleFxBatch = useGameStore((s) => s.battleFxBatch);
  const lastFxBatchKey = useRef(0);
  useEffect(() => {
    if (!battleFxBatch || battleFxBatch.key === lastFxBatchKey.current) return;
    lastFxBatchKey.current = battleFxBatch.key;
    if (!worldBattle || !worldBattleMinimized) return;  // only while watching the diorama
    for (const ev of battleFxBatch.events) {
      const spec = tacticFxSpec(ev.tacticId, ev.stratagemId, categoryOfTactic);
      if (spec) spawnCastFx(ev.coord, spec);
    }
  }, [battleFxBatch?.key]);  // eslint-disable-line react-hooks/exhaustive-deps
  // 單挑 — armed duel waiting for an adjacent enemy commander; the bout itself
  // runs in the same DuelGameModal the fullscreen uses.
  const [dioDuelArm, setDioDuelArm] = useState(false);
  const [worldDuel, setWorldDuel] = useState<{ me: Officer; foe: Officer; meFatigue: number; foeFatigue: number; reinforcements: Officer[] } | null>(null);
  const [captureChoice, setCaptureChoice] = useState<{ id: string; name: { zh: string; en: string } } | null>(null);
  // 快捷輪盤 — which DOM picker (march/recruit) the ring asked for.
  const [quickPick, setQuickPick] = useState<{ kind: 'march' | 'recruit' | 'muster'; cityId: string } | null>(null);
  const [dioArcs, setDioArcs] = useState<Array<{ id: number; from: HexCoord; to: HexCoord; kind: 'melee' | 'ranged'; spawnedAt: number }>>([]);
  // 原地指揮提示 — a transient in-map notice replacing the jarring OS alert()
  // the on-map duel/command flow used to fire (several were zh-only).
  const [dioNotice, setDioNotice] = useState<string | null>(null);
  const dioNoticeTimer = useRef(0);
  const notifyDio = (msg: string) => {
    setDioNotice(msg);
    window.clearTimeout(dioNoticeTimer.current);
    dioNoticeTimer.current = window.setTimeout(() => setDioNotice(null), 2600);
  };
  useEffect(() => () => window.clearTimeout(dioNoticeTimer.current), []);
  const dioSelectedId = worldBattle && dioPick && dioPick.bid === worldBattle.id
    && worldBattle.units.some((u) => u.id === dioPick.uid) ? dioPick.uid : null;
  const worldPlayerSide: 'attacker' | 'defender' | null = worldBattle
    ? (worldBattle.attackerForceId === playerForceId ? 'attacker'
      : worldBattle.defenderForceId === playerForceId ? 'defender' : null)
    : null;
  const worldMyTurn = !!worldBattle && !!worldPlayerSide
    && worldBattle.activeSide === worldPlayerSide && !worldBattle.winner;

  // Same select/move/attack semantics as the fullscreen onTileClick — the
  // deep actions (stratagems, duels, formations) live one ⤢ tap away.
  const handleDioramaTile = (c: HexCoord) => {
    const b = useGameStore.getState().tacticalBattle;
    if (!b) return;
    if (!useGameStore.getState().battleViewMinimized) {
      // Pre-reveal (fly-in) click — just open the fullscreen view.
      setBattleViewMinimized(false);
      return;
    }
    const pSide = b.attackerForceId === playerForceId ? 'attacker'
      : b.defenderForceId === playerForceId ? 'defender' : null;
    if (!pSide || b.activeSide !== pSide || b.winner) return;
    const u = unitAt(b, c);
    // An armed stratagem treats ANY click as its target (incl. friendlies —
    // rally-style buffs), exactly like the fullscreen flow.
    if (dioCast) {
      const sel0 = dioSelectedId ? b.units.find((x) => x.id === dioSelectedId) : null;
      if (!sel0) { setDioCast(null); return; }
      const r = applyStratagem(b, sel0.id, dioCast.id, c, useGameStore.getState().officers, dioCast.tacticId);
      if (r.ok) {
        const spec = tacticFxSpec(dioCast.tacticId, dioCast.id, categoryOfTactic);
        if (spec) {
          const isSelf = ['defend', 'precognition', 'dragon-veil'].includes(dioCast.id);
          spawnCastFx(isSelf ? sel0.coord : c, spec);
        }
        // N6 — signature flavor line for famous personal tactics.
        const flavor = dioCast.tacticId ? SIGNATURE_FLAVOR[dioCast.tacticId] : undefined;
        const next = flavor
          ? { ...r.battle, log: [...(r.battle.log ?? []), { turn: r.battle.turn, text: flavor.en, kind: 'event' as const }] }
          : r.battle;
        startBattleUpdate(next);
      } else if (r.reason) {
        notifyDio(r.reason);
      }
      setDioCast(null);
      return;
    }
    // An armed duel needs an ADJACENT enemy commander — same gates as the
    // fullscreen flow (canDuel both sides, costs the unit's AP).
    if (dioDuelArm && u && u.side !== pSide) {
      const sel0 = dioSelectedId ? b.units.find((x) => x.id === dioSelectedId) : null;
      if (!sel0) { setDioDuelArm(false); return; }
      if (hexDistance(sel0.coord, u.coord) !== 1) { notifyDio(t('須與敵將相鄰方可單挑', 'Must stand adjacent to the enemy commander to duel')); return; }
      const officers = useGameStore.getState().officers;
      const me = officers[sel0.officerId];
      const foe = officers[u.officerId];
      if (!me || !foe) return;
      const meCheck = canDuel(me);
      const foeCheck = canDuel(foe);
      if (!meCheck.ok) { notifyDio(`${t('我將無法單挑', 'Your commander cannot duel')}: ${meCheck.reason}`); return; }
      if (!foeCheck.ok) { notifyDio(`${t('敵將無法應戰', 'Enemy commander cannot duel')}: ${foeCheck.reason}`); return; }
      startBattleUpdate({ ...b, units: b.units.map((unit) => unit.id === sel0.id ? { ...unit, ap: 0 } : unit) });
      // 三英戰呂布 — allies pressing the same foe may leap in mid-bout.
      const reinforcements = b.units
        .filter((ru) => ru.side === sel0.side && ru.troops > 0 && ru.ap > 0 && ru.officerId !== sel0.officerId
          && hexDistance(ru.coord, u.coord) === 1 && officers[ru.officerId] && canDuel(officers[ru.officerId]!).ok)
        .map((ru) => officers[ru.officerId]!).slice(0, 2);
      // 車輪戰 — fatigue from earlier bouts carries into this one.
      setWorldDuel({ me, foe, meFatigue: sel0.duelFatigue ?? 0, foeFatigue: u.duelFatigue ?? 0, reinforcements });
      setDioDuelArm(false);
      return;
    }
    if (u && u.side === pSide) {
      setDioPick({ bid: b.id, uid: u.id });
      setDioMode('move');
      setDioCast(null);
      setDioDuelArm(false);
      return;
    }
    const sel = dioSelectedId ? b.units.find((x) => x.id === dioSelectedId) : null;
    if (!sel) return;
    if (u && u.side !== pSide && canAttack(b, sel, u)) {
      const kind: 'melee' | 'ranged' = sel.unitType === 'archers' || sel.unitType === 'siege' ? 'ranged' : 'melee';
      const aid = Date.now();
      playSfx(kind === 'ranged' ? 'arrow' : 'sword');
      setDioArcs((a) => [...a, { id: aid, from: sel.coord, to: u.coord, kind, spawnedAt: aid }]);
      setTimeout(() => setDioArcs((a) => a.filter((x) => x.id !== aid)), 600);
      startBattleUpdate(attackUnits(b, sel.id, u.id, useGameStore.getState().officers, Math.random));
      return;
    }
    if (!u && dioMode === 'move' && canMove(b, sel, c)) {
      startBattleUpdate(moveUnit(b, sel.id, c));
    }
  };
  const weather = useGameStore((s) => s.weather);
  const season = useGameStore((s) => s.date.season) as Season;
  const t = useT();
  const lang = useLanguage();

  return (
    <div ref={mapRootRef} style={{
      position: 'absolute', inset: 0,
      background: tod === 'night'
        ? 'linear-gradient(180deg, #060a1c 0%, #1a2440 100%)'
        : tod === 'dusk'
        ? 'linear-gradient(180deg, #6a5a78 0%, #d89060 100%)'
        : 'linear-gradient(180deg, #88a0c0 0%, #c8b890 100%)',
    }}>
      {/* Objective tracker — top-left. Phones fold it into a chip; the
          full card is a tap away instead of owning a third of the screen. */}
      {/* z:20 keeps the objective + 烽火 beacon column above the in-transit
          ArmiesPanel (z:15) — a lit beacon (enemy marching on you) must never
          be hidden behind the columns list during an invasion. */}
      <div style={{ position: 'absolute', top: 12, left: 12, zIndex: 20, pointerEvents: 'none', display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'flex-start' }}>
        {IS_MOBILE && !objOpen ? (
          <button
            onClick={() => setObjOpen(true)}
            style={{
              pointerEvents: 'auto', background: 'rgba(20, 14, 8, 0.88)', color: '#d4a84a',
              border: '1px solid rgba(255,255,255,0.1)', borderRadius: 'var(--tkm-radius-lg)', padding: '0.3rem 0.55rem', cursor: 'pointer',
              fontFamily: 'var(--tkm-font-body)', fontSize: '0.75rem',
            }}
          >🎯 {t('目標', 'Goal')}</button>
        ) : (
          <div style={{ position: 'relative' }}>
            {IS_MOBILE && (
              <button
                onClick={() => setObjOpen(false)}
                aria-label={t('收起目標', 'Collapse objective')}
                title={t('收起目標', 'Collapse objective')}
                style={{
                  pointerEvents: 'auto', position: 'absolute', top: 0, right: 0, zIndex: 1,
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  minWidth: 34, minHeight: 34,
                  background: 'transparent', color: '#8a7050', border: 'none',
                  fontSize: '0.95rem', cursor: 'pointer',
                }}
              >✕</button>
            )}
            <ObjectivePanel />
          </div>
        )}
        {/* 烽火示警 — stacked under the objective card so neither covers the other. */}
        {beaconAlerts.threatened.size > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, fontFamily: 'var(--tkm-font-body)' }}>
            {[...beaconAlerts.threatened].slice(0, 4).map((id) => (
              <button
                key={id}
                onClick={() => beaconSelectCity(id)}
                style={{
                  pointerEvents: 'auto',
                  background: 'rgba(40, 14, 8, 0.92)', border: '1px solid #e0552a',
                  color: '#f0b0a0', borderRadius: 'var(--tkm-radius-xs)', padding: '3px 9px',
                  cursor: 'pointer', fontFamily: 'inherit', fontSize: '0.75rem',
                  letterSpacing: '0.08rem', textAlign: 'left',
                  boxShadow: '0 0 10px rgba(224,85,42,0.35)',
                }}
              >
                🔥 {t('烽火示警', 'Beacons lit')} · {beaconCities[id] ? pickName(beaconCities[id].name, lang) : id}{t('告急', ' under threat')}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* 開戰字卡 — flashes 「X軍 ⚔ Y軍」 + drums when any battle ignites. */}
      <BattleIgnitionCard />

      {/* Season + weather chip */}
      <div style={{
        position: 'absolute', top: 12, left: '50%', transform: 'translateX(-50%)', zIndex: 10,
        display: 'flex', gap: 6,
        flexWrap: 'wrap', justifyContent: 'center', maxWidth: '96vw',
        pointerEvents: 'none',
      }}>
        <span style={{
          background: 'rgba(20, 14, 8, 0.85)', color: '#d4a84a',
          border: '1px solid rgba(255,255,255,0.1)', borderRadius: 'var(--tkm-radius-lg)', padding: '0.3rem 0.7rem',
          fontFamily: 'var(--tkm-font-body)', fontSize: '0.85rem',
        }}>{lang === 'en' ? SEASON_EN[season] : SEASON_ZH[season]}</span>
        <span style={{
          background: 'rgba(20, 14, 8, 0.85)', color: '#a8c4e0',
          border: '1px solid rgba(255,255,255,0.1)', borderRadius: 'var(--tkm-radius-lg)', padding: '0.3rem 0.7rem',
          fontFamily: 'var(--tkm-font-body)', fontSize: '0.85rem',
        }}>{(lang === 'en' ? WEATHER_EN : WEATHER_ZH)[weather.kind]}{weather.windPower >= 2 ? ` ${weather.windPower}` : ''}</span>
      </div>

      {/* Controls hint — desktop only; corrected for the map-app controls
          (left-drag now PANS, right-drag rotates), with a ? that opens the full
          cheat-sheet so every gesture/shortcut is discoverable. */}
      {!IS_MOBILE && (
        <div style={{
          // top:52 — clear the ⛶ 沉浸 toggle that owns the very top-right corner.
          position: 'absolute', top: 52, right: 12, zIndex: 10,
          display: 'flex', alignItems: 'center', gap: 6,
          background: 'rgba(20, 14, 8, 0.85)', color: '#a89070',
          border: '1px solid rgba(255,255,255,0.1)', borderRadius: 'var(--tkm-radius-lg)',
          padding: '0.3rem 0.6rem',
          fontFamily: 'var(--tkm-font-body)', fontSize: '0.72rem',
        }}>
          <span style={{ pointerEvents: 'none' }}>{t('左拖平移 · 右拖旋轉 · 滾輪縮放 · 雙擊飛近', 'left-drag pan · right-drag rotate · scroll zoom · double-click fly')}</span>
          <button onClick={() => setShowMapHelp(true)} title={t('操作說明', 'Controls')} style={{
            width: 18, height: 18, borderRadius: '50%', flexShrink: 0,
            background: 'transparent', color: '#d4a84a', border: '1px solid #6a5230',
            cursor: 'pointer', fontSize: 11, lineHeight: 1, padding: 0, fontWeight: 'bold',
          }}>?</button>
        </div>
      )}

      {/* 尋城 — search-and-fly. Desktop: input under the controls hint.
          Phones: a 🔍 button that expands on tap, below the hint chip so
          nothing sits over the season/weather strip. */}
      <div style={{ position: 'absolute', top: IS_MOBILE ? 52 : 90, right: 12, zIndex: 11 }}>
        <CitySearchBox compact={IS_MOBILE} onJump={(cityId, px, py) => {
          setNavJump({ px, py, seq: Date.now() });
          selectCityOuter(cityId);
        }} />
      </div>

      {/* Map layers & tools — bottom-left, folded on every device behind one
          ◧ 圖層 trigger (the old always-open 15-button row read as clutter).
          The tray opens above it: overlay chips grouped 資源/政情/軍情, then
          view toggles and tools. 1-9/0 hotkeys still switch overlays directly;
          the trigger echoes the active overlay so a hidden tray never lies. */}
      <button
        ref={toolsTriggerRef}
        onClick={() => setToolsOpen((v) => !v)}
        style={{
          position: 'absolute', bottom: 12, left: 12, zIndex: 11,
          background: toolsOpen ? '#d4a84a' : 'rgba(20, 14, 8, 0.92)',
          color: toolsOpen ? '#1a1410' : overlayMode !== 'none' ? '#f0d98a' : '#c0a878',
          border: '1px solid ' + (toolsOpen || overlayMode !== 'none' ? '#d4a84a' : '#5a4530'),
          borderRadius: 'var(--tkm-radius-lg)',
          padding: '0.35rem 0.7rem', cursor: 'pointer',
          fontFamily: 'var(--tkm-font-body)', fontSize: '0.78rem',
          boxShadow: '0 2px 8px rgba(0,0,0,0.55)',
          display: 'flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap',
        }}
        title={t('圖層與地圖工具 — 疊圖亦可按 1–9/0 直切', 'Map layers & tools — overlays also on hotkeys 1–9/0')}
      >
        ◧ {t('圖層', 'Layers')}
        {overlayMode !== 'none' && (() => {
          const act = OVERLAY_OPTIONS.find((o) => o.id === overlayMode);
          return act ? <span style={{ fontFamily: 'ui-monospace, monospace', fontWeight: 'bold' }}>· {t(act.zh, act.en)}</span> : null;
        })()}
        {fogOfWar && <span title={t('戰爭迷霧開啟', 'Fog of war on')}>🌫</span>}
      </button>
      {toolsOpen && (
      <div ref={toolsTrayRef} style={{
        position: 'absolute', bottom: 52, left: 12, zIndex: 10,
        width: 300, maxWidth: 'calc(100vw - 24px)',
        background: 'rgba(20, 14, 8, 0.94)',
        border: '1px solid rgba(255,255,255,0.1)', borderRadius: 'var(--tkm-radius-lg)',
        padding: '0.5rem 0.6rem',
        boxShadow: '0 0 12px rgba(0,0,0,0.6)',
        display: 'flex', flexDirection: 'column', gap: 7,
      }}>
        {([
          [t('資源疊圖', 'Resource overlays'), ['gold', 'food', 'troops', 'loyalty'] as OverlayMode[]],
          [t('政情疊圖', 'Realm overlays'), ['province', 'specialty', 'diplomacy'] as OverlayMode[]],
          [t('軍情疊圖', 'War overlays'), ['supply', 'threat', 'intent'] as OverlayMode[]],
        ] as Array<[string, OverlayMode[]]>).map(([head, ids]) => (
          <div key={head}>
            <div style={{ fontSize: '0.62rem', letterSpacing: '0.12rem', color: '#8a7658', marginBottom: 3 }}>{head}</div>
            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
              {ids.map((id) => {
                const opt = OVERLAY_OPTIONS.find((o) => o.id === id)!;
                // 1-9 follow OVERLAY_OPTIONS order (sans 'none'); 兵鋒 rides on 0.
                const numbered = OVERLAY_OPTIONS.filter((o) => o.id !== 'none');
                const hotkey = id === 'intent' ? '0' : String(numbered.findIndex((o) => o.id === id) + 1);
                return (
                  <button
                    key={id}
                    onClick={() => setOverlayMode((cur) => (cur === id ? 'none' : id))}
                    title={t(`快捷鍵 ${hotkey}`, `Hotkey ${hotkey}`)}
                    style={{
                      background: overlayMode === id ? '#d4a84a' : 'transparent',
                      color: overlayMode === id ? '#1a1410' : '#a89070',
                      border: '1px solid ' + (overlayMode === id ? '#d4a84a' : '#5a4530'),
                      padding: '0.28rem 0.5rem',
                      cursor: 'pointer',
                      fontFamily: 'ui-monospace, monospace',
                      fontSize: '0.72rem',
                      fontWeight: 'bold',
                      letterSpacing: '0.05rem',
                    }}
                  >
                    {t(opt.zh, opt.en)}
                    <span style={{ opacity: 0.5, fontSize: '0.6rem', marginLeft: 3 }}>{hotkey}</span>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
        <div>
          <div style={{ fontSize: '0.62rem', letterSpacing: '0.12rem', color: '#8a7658', marginBottom: 3 }}>{t('顯示', 'View')}</div>
          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
            <button
              onClick={toggleMapStyle}
              style={{
                background: mapStyle === 'hex' ? 'rgba(212, 168, 74, 0.18)' : '#1a2415',
                color: mapStyle === 'hex' ? '#d4a84a' : '#9ab87a',
                border: `1px solid ${mapStyle === 'hex' ? '#d4a84a' : '#4a5a3a'}`,
                padding: '0.3rem 0.55rem', cursor: 'pointer',
                fontFamily: 'var(--tkm-font-body)', fontSize: '0.76rem',
              }}
              title={t('切換地圖風格 — 棋盤六角地塊 / 畫卷地圖(實驗)', 'Toggle map style — hex-tile board / painted scroll (experimental)')}
            >{mapStyle === 'hex' ? t('🗺 畫卷地圖', 'Scroll Map') : t('⬡ 棋盤地圖', 'Hex Map')}</button>
            <button
              onClick={() => setFogOfWar(!fogOfWar)}
              style={{
                background: fogOfWar ? 'rgba(120, 130, 150, 0.22)' : '#241c12',
                color: fogOfWar ? '#b8c4d8' : '#a89070',
                border: `1px solid ${fogOfWar ? '#8a96ac' : '#5a4530'}`,
                padding: '0.3rem 0.55rem', cursor: 'pointer',
                fontFamily: 'var(--tkm-font-body)', fontSize: '0.76rem',
              }}
              title={t('戰爭迷霧 — 只看得見自己城池與行軍縱隊周邊的敵情;烽火台照常預警', 'Fog of war — intel limited to what your cities and columns can see; beacons still warn')}
            >🌫 {fogOfWar ? t('迷霧:開', 'Fog ON') : t('迷霧:關', 'Fog OFF')}</button>
          </div>
        </div>
        <div>
          <div style={{ fontSize: '0.62rem', letterSpacing: '0.12rem', color: '#8a7658', marginBottom: 3 }}>{t('工具', 'Tools')}</div>
          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
            <button
              onClick={() => setShowStockadeBuild(true)}
              style={{
                background: '#3a2818', color: '#c8a878',
                border: '1px solid rgba(255,255,255,0.14)', borderRadius: 'var(--tkm-radius-lg)',
                padding: '0.3rem 0.55rem', cursor: 'pointer',
                fontFamily: 'var(--tkm-font-body)', fontSize: '0.76rem',
              }}
              title={t('築壘寨 / 箭樓 / 投石臺 — 施設可轟擊路過敵軍', 'Build stockade / arrow tower / catapult — facilities shell passing enemies')}
            >⚒ {t('築堡施設', 'Build')}</button>
            <button
              onClick={exportSnapshot}
              style={{
                background: '#241c12', color: '#c0a878',
                border: '1px solid rgba(255,255,255,0.1)', borderRadius: 'var(--tkm-radius-lg)', padding: '0.3rem 0.55rem',
                cursor: 'pointer', fontFamily: 'var(--tkm-font-body)', fontSize: '0.76rem',
              }}
              title={t('把當前天下大勢存成 PNG', 'Save the current realm view as a PNG')}
            >📷 {t('大勢', 'Snap')}</button>
            <button
              onClick={() => setShowReplay(true)}
              style={{
                background: '#241c12', color: '#c0a878',
                border: '1px solid rgba(255,255,255,0.1)', borderRadius: 'var(--tkm-radius-lg)', padding: '0.3rem 0.55rem',
                cursor: 'pointer', fontFamily: 'var(--tkm-font-body)', fontSize: '0.76rem',
              }}
              title={t('戰役回放 — 快進重現整局天下消長', "Campaign timelapse — fast-forward the whole campaign's territory changes")}
            >🎞 {t('回放', 'Replay')}</button>
            {/* 操作說明 — the controls/shortcut cheat-sheet. Desktop also opens it
                from the ? on the hint chip; this makes it reachable on phones. */}
            <button
              onClick={() => { setToolsOpen(false); setShowMapHelp(true); }}
              style={{
                background: '#241c12', color: '#c0a878',
                border: '1px solid rgba(255,255,255,0.1)', borderRadius: 'var(--tkm-radius-lg)', padding: '0.3rem 0.55rem',
                cursor: 'pointer', fontFamily: 'var(--tkm-font-body)', fontSize: '0.76rem',
              }}
              title={t('操作說明 — 手勢與快捷鍵一覽', 'Controls — gestures & shortcuts')}
            >❓ {t('操作', 'Help')}</button>
          </div>
        </div>
      </div>
      )}
      {/* 戰役回放:無頭記錄器(每季存一幀)+ 開啟後的面板。 */}
      <ReplayRecorder />
      {showReplay && <ReplayPanel onClose={() => setShowReplay(false)} />}
      {showMapHelp && <MapHelpPanel onClose={() => setShowMapHelp(false)} />}
      {/* 原地指揮提示 — transient notice for the on-map command/duel flow. */}
      {dioNotice && (
        <div style={{
          position: 'absolute', bottom: 96, left: '50%', transform: 'translateX(-50%)',
          zIndex: 16, maxWidth: '80%', textAlign: 'center', pointerEvents: 'none',
          background: 'rgba(46,26,20,0.95)', border: '1px solid #c07a4a', color: '#f0c4a4',
          borderRadius: 'var(--tkm-radius)', padding: '0.45rem 0.85rem',
          fontFamily: 'var(--tkm-font-body)', fontSize: '0.82rem', boxShadow: '0 4px 16px rgba(0,0,0,0.5)',
        }}>{dioNotice}</div>
      )}

      <div ref={mapCanvasWrapRef} style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
      {/* 戰鬥運鏡 — impact flash for big-map casts, remounted per cast */}
      {cine && cine.weight > 0 && (
        <div
          key={cine.key}
          className="tkm-fx-flash"
          style={{
            ['--fx-color']: cine.color,
            ['--fx-peak']: cine.weight >= 2 ? 0.38 : 0.22,
            ['--fx-dur']: cine.weight >= 2 ? '0.42s' : '0.3s',
          } as React.CSSProperties}
        />
      )}
      <Canvas
        // Remounts with a fresh GL context if the old one is lost and never
        // restored (see glEpoch / onCreated below).
        key={glEpoch}
        // Shadow maps are the single biggest GPU cost on this scene — high tier only.
        shadows={RENDER_HI}
        dpr={RENDER_HI ? [1, 2] : [1, 1.5]}
        camera={{ position: [0, MAP_D * 0.9, MAP_D * 0.7], fov: 45, near: 0.5, far: 400 * WORLD_SCALE }}
        // preserveDrawingBuffer lets the 📷 button read the frame back.
        gl={{ antialias: RENDER_HI, preserveDrawingBuffer: true }}
        onCreated={({ gl }) => {
          // Recover from WebGL context loss instead of going black forever.
          const canvas = gl.domElement;
          const onLost = (e: Event) => {
            e.preventDefault();                 // ask the browser to attempt a restore
            if (glRestoreTimer.current != null) return;
            // Grace period: a transient loss (tab switch, brief pressure) is
            // restored by the browser + three.js on its own. If it isn't, the
            // context is dead for good — hard-remount with a fresh one.
            glRestoreTimer.current = window.setTimeout(() => {
              glRestoreTimer.current = null;
              console.warn('[StrategicMap3D] WebGL context not restored — remounting canvas');
              setGlEpoch((n) => n + 1);
            }, 1800);
          };
          const onRestored = () => {
            if (glRestoreTimer.current != null) {
              window.clearTimeout(glRestoreTimer.current);
              glRestoreTimer.current = null;
            }
          };
          canvas.addEventListener('webglcontextlost', onLost as EventListener, false);
          canvas.addEventListener('webglcontextrestored', onRestored as EventListener, false);
        }}
      >
        <BattleCinematics trigger={cine} />
        <Suspense fallback={null}>
          <ZoomLODTracker onChange={setZoomLod} />
          <ZoomLODCtx.Provider value={zoomLod}>
          <MapScene
            overlayMode={overlayMode}
            mapStyle={mapStyle}
            onPortClick={setSelectedPortId}
            onFortClick={setSelectedFortId}
            onTribeClick={setSelectedTribeId}
            onSiteClick={setSelectedSiteId}
            onScenicClick={setSelectedScenicId}
            onQuickAction={(kind, cityId) => {
              if (kind === 'govern') {
                // 一鍵施政 — govern just this city: idle officers take their
                // best-fit internal order. No picker; a toast reports the result.
                const st = useGameStore.getState();
                const r = st.autoAssignIdle(cityId);
                if (r.assigned === 0) st.notify('此城無閒置武將可施政', 'No idle officers to govern here', 'warn');
                playSfx('coin');
                return;
              }
              setQuickPick({ kind, cityId });
            }}
            dioSelectedId={worldBattleMinimized ? dioSelectedId : null}
            dioMode={dioMode}
            dioCast={worldBattleMinimized ? dioCast : null}
            dioArcs={dioArcs}
            dioFx={dioFx}
            dioHover={worldBattleMinimized ? dioHover : null}
            onDioHover={setDioHover}
            onDioramaTile={handleDioramaTile}
            onFocusWorld={(wx, wz) => camApiRef.current?.flyTo(wx, wz)}
            onDragLock={(locked) => {
              const c = controlsRef.current as { enabled?: boolean } | null;
              if (c) c.enabled = !locked;
            }}
          />
          </ZoomLODCtx.Provider>
          <OrbitControls
            ref={controlsRef as React.Ref<never>}
            target={orbitTarget}
            maxPolarAngle={Math.PI / 2.1}
            minDistance={battleActive ? 0.9 : 3}
            maxDistance={MAP_MAX_DIST}
            enableDamping
            dampingFactor={0.1}
            // 地圖 App 式操作 — drag the ground with one finger / left mouse,
            // pinch (or scroll) to zoom toward where you're looking, twist with
            // two fingers / right-drag to rotate. screenSpacePanning=false keeps
            // a pan gliding across the terrain instead of drifting skyward when
            // the camera is tilted; zoomToCursor homes the zoom on the cursor.
            screenSpacePanning={false}
            zoomToCursor
            touches={{ ONE: THREE.TOUCH.PAN, TWO: THREE.TOUCH.DOLLY_ROTATE }}
            mouseButtons={{ LEFT: THREE.MOUSE.PAN, MIDDLE: THREE.MOUSE.DOLLY, RIGHT: THREE.MOUSE.ROTATE }}
          />
          <MapCamApi apiRef={camApiRef} controlsRef={controlsRef} panInputRef={panInputRef} />
          <HeadingTracker controlsRef={controlsRef} onHeading={setHeading} />
          {/* Fly to a battle the moment it ignites — before its screen mounts. */}
          <BattleFocusFly controlsRef={controlsRef} onSettled={setOrbitTarget} />
          {/* Cinematic arc when a city changes hands (capture / loss). */}
          <EventFocusFly controlsRef={controlsRef} onSettled={setOrbitTarget} />
          <MiniNavRig controlsRef={controlsRef} onView={setNavView} jump={navJump} />
          {/* Gentle bloom — beacons, fires and water shimmer get a halo; on a
              moonlit lower-phase NIGHT it opens up so the city lamps, beacon
              chains and ember fields truly glow (萬家燈火). High tier only. */}
          {RENDER_HI && (
            <EffectComposer>
              <Bloom
                luminanceThreshold={tod === 'night' ? 0.5 : 0.85}
                intensity={tod === 'night' ? 0.9 : 0.35}
                mipmapBlur
              />
            </EffectComposer>
          )}
        </Suspense>
      </Canvas>
      </div>

      {/* 鏡頭控制 — zoom in/out + recenter on the right edge, clear of the
          bottom-right minimap and top-right buttons. Big round tap targets for
          touch; they drive the OrbitControls camera via MapCamApi. */}
      <div style={{
        position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
        zIndex: 11, display: 'flex', flexDirection: 'column', gap: 8,
      }}>
        {([
          { key: 'in', label: '＋', title: t('放大', 'Zoom in'), onClick: () => camApiRef.current?.zoomBy(0.78) },
          { key: 'out', label: '－', title: t('縮小', 'Zoom out'), onClick: () => camApiRef.current?.zoomBy(1.28) },
          { key: 'home', label: '⌖', title: t('復位 — 回到全局俯視', 'Recenter — overview'), onClick: () => { camApiRef.current?.recenter(); setOrbitTarget([0, 0, 0]); } },
          { key: 'capital', label: '🏯', title: t('回都城 (Home)', 'Capital (Home)'), onClick: jumpToCapital },
        ] as const).map((b) => (
          <button
            key={b.key}
            title={b.title}
            aria-label={b.title}
            onClick={b.onClick}
            style={{
              width: 40, height: 40, borderRadius: '50%',
              background: 'rgba(20, 14, 8, 0.92)', color: '#c0a878',
              border: '1px solid #5a4530', cursor: 'pointer',
              fontSize: b.key === 'in' || b.key === 'out' ? 22 : 17, lineHeight: 1, padding: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 2px 8px rgba(0,0,0,0.55)',
            }}
          >{b.label}</button>
        ))}
      </div>

      {/* 羅盤 — a parchment compass rose on the left edge; the whole rose turns
          with the camera so the red 北 spike always points to true north. Pure
          decoration (pointer-events off) that also doubles as a heading read. */}
      <div style={{
        position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)',
        zIndex: 9, pointerEvents: 'none', opacity: 0.5,
      }}>
        <svg width="54" height="54" viewBox="0 0 100 100"
          style={{ transform: `rotate(${heading}deg)`, transition: 'transform 0.12s linear' }}>
          <circle cx="50" cy="50" r="47" fill="rgba(20,14,8,0.4)" stroke="#caa86a" strokeWidth="1.5" />
          <circle cx="50" cy="50" r="39" fill="none" stroke="#caa86a" strokeWidth="0.6" opacity="0.4" />
          <polygon points="50,14 55,50 50,86 45,50" fill="#caa86a" opacity="0.5" />
          <polygon points="14,50 50,45 86,50 50,55" fill="#caa86a" opacity="0.3" />
          <polygon points="50,8 54,50 46,50" fill="#d9434a" opacity="0.78" />
          <text x="50" y="27" textAnchor="middle" fontSize="12" fontWeight="bold" fill="#f0dca8" fontFamily="serif">北</text>
        </svg>
      </div>

      {/* 快捷輪盤的 DOM 端 — the pickers the ring opens (ordinary modals,
          they live outside the Canvas). */}
      {quickPick?.kind === 'march' && (
        <MarchPicker cityId={quickPick.cityId} onClose={() => setQuickPick(null)} />
      )}
      {quickPick?.kind === 'recruit' && (
        <OfficerPicker cityId={quickPick.cityId} commandType="recruit-troops" onClose={() => setQuickPick(null)} />
      )}
      {quickPick?.kind === 'muster' && (
        <MusterModal targetCityId={quickPick.cityId} onClose={() => setQuickPick(null)} />
      )}

      {/* 原地指揮 — command the minimized battle right on the map: select,
          move, attack, end turn. Deep actions (stratagems/duels) are one ⤢
          tap away in the fullscreen view. */}
      {worldBattle && worldBattleMinimized && (() => {
        const sel = dioSelectedId ? worldBattle.units.find((u) => u.id === dioSelectedId) : null;
        const off = sel ? officersAll[sel.officerId] : null;
        const hovUnit = dioHover ? unitAt(worldBattle, dioHover) : null;
        const hovOff = hovUnit ? officersAll[hovUnit.officerId] : null;
        const hovIsOwn = hovUnit && worldPlayerSide && hovUnit.side === worldPlayerSide;
        const modeBtn = (mode: 'move' | 'attack', zh: string, en: string) => (
          <button
            onClick={() => setDioMode(mode)}
            style={{
              background: dioMode === mode ? 'rgba(212,168,74,0.22)' : 'transparent',
              border: `1px solid ${dioMode === mode ? '#d4a84a' : '#5a4530'}`,
              color: dioMode === mode ? '#f0d98a' : '#c0a878',
              padding: '0.15rem 0.55rem', cursor: 'pointer',
              fontFamily: 'inherit', fontSize: '0.75rem',
            }}
          >{t(zh, en)}</button>
        );
        return (
          <div style={{
            position: 'absolute', bottom: 14, left: '50%', transform: 'translateX(-50%)',
            zIndex: 13, display: 'flex', alignItems: 'center', gap: IS_MOBILE ? '0.35rem' : '0.55rem',
            background: 'rgba(20, 14, 8, 0.94)', border: '1px solid #b8584a', borderRadius: 'var(--tkm-radius-sm)',
            padding: IS_MOBILE ? '0.3rem 0.5rem' : '0.4rem 0.8rem', fontFamily: 'var(--tkm-font-body)',
            boxShadow: '0 2px 14px rgba(0,0,0,0.6)',
            // Phones: wrap the chips instead of overflowing off-screen.
            flexWrap: 'wrap', justifyContent: 'center', maxWidth: '94vw',
          }}>
            <span style={{ color: '#e0a0a0', fontSize: '0.78rem', letterSpacing: '0.1rem' }}>
              ⚔ {t(`第${worldBattle.turn}回`, `T${worldBattle.turn}`)} · {worldBattle.winner
                ? t('勝負已分', 'Decided')
                : worldMyTurn ? t('我方回合', 'YOUR TURN') : t('敵方回合', 'enemy turn')}
            </span>
            {sel && off ? (
              <>
                <span style={{ color: '#f0d98a', fontSize: '0.8rem' }}>
                  {pickName(off.name, lang)} · AP {sel.ap}/{sel.maxAp} · {sel.troops.toLocaleString()}{t('兵', '')}
                </span>
                {modeBtn('move', '移動', 'Move')}
                {modeBtn('attack', '攻擊', 'Attack')}
                {/* 單挑 — adjacent enemy commander, same gates as fullscreen. */}
                <button
                  onClick={() => { setDioDuelArm(!dioDuelArm); setDioCast(null); }}
                  title={t('單挑 — 點相鄰敵將開打(耗盡AP)', 'Duel — tap an adjacent enemy commander (costs all AP)')}
                  style={{
                    background: dioDuelArm ? 'rgba(214,126,126,0.22)' : 'transparent',
                    border: `1px solid ${dioDuelArm ? '#d67e7e' : '#5a3a3a'}`,
                    color: dioDuelArm ? '#f0bcbc' : '#c88888',
                    padding: '0.15rem 0.45rem', cursor: 'pointer',
                    fontFamily: 'inherit', fontSize: '0.72rem',
                  }}
                >{t('單挑', 'Duel')}</button>
                {/* 個人戰術 — signature moves riding underlying stratagems. */}
                {personalTacticsForUnit(off, sel).slice(0, 3).map((pt) => {
                  const armed = dioCast?.id === pt.underlying && dioCast?.tacticId === pt.tacticId;
                  return (
                    <button
                      key={pt.id}
                      onClick={() => { setDioCast(armed ? null : { id: pt.underlying, tacticId: pt.tacticId }); setDioDuelArm(false); }}
                      title={pt.nameEn}
                      style={{
                        background: armed ? 'rgba(193,154,240,0.22)' : 'transparent',
                        border: `1px solid ${armed ? '#c19af0' : '#4a3a5a'}`,
                        color: armed ? '#ddc8f5' : '#a88fc8',
                        padding: '0.15rem 0.45rem', cursor: 'pointer',
                        fontFamily: 'inherit', fontSize: '0.72rem',
                      }}
                    >{lang === 'en' ? pt.nameEn : pt.nameZh}</button>
                  );
                })}
                {/* 計謀 — same availability rules as the fullscreen panel. */}
                {STRATAGEMS.filter((s) => {
                  if (s.signatureOf && !s.signatureOf.includes(off.id)) return false;
                  if (s.minIntelligence && off.stats.intelligence < s.minIntelligence) return false;
                  if (s.minWar && off.stats.war < s.minWar) return false;
                  if (s.requiresUnitType && !s.requiresUnitType.includes(sel.unitType)) return false;
                  return true;
                }).slice(0, 4).map((s) => {
                  const armed = dioCast?.id === s.id && !dioCast?.tacticId;
                  return (
                    <button
                      key={s.id}
                      onClick={() => { setDioCast(armed ? null : { id: s.id }); setDioDuelArm(false); }}
                      title={s.descriptionZh ?? s.description}
                      style={{
                        background: armed ? 'rgba(136,183,232,0.22)' : 'transparent',
                        border: `1px solid ${armed ? '#88b7e8' : '#3a4a5a'}`,
                        color: armed ? '#bcd8f0' : '#88a7c8',
                        padding: '0.15rem 0.45rem', cursor: 'pointer',
                        fontFamily: 'inherit', fontSize: '0.72rem',
                      }}
                    >{pickName(s.name, lang)}</button>
                  );
                })}
                {(dioCast || dioDuelArm) && (
                  <span style={{ color: dioDuelArm ? '#d67e7e' : '#88b7e8', fontSize: '0.7rem' }}>
                    {dioDuelArm ? t('點相鄰敵將', 'tap adjacent foe') : t('點目標格施放', 'tap a target hex')}
                  </span>
                )}
                {/* 戰法情境預覽 — current weather/terrain effect on the armed cast. */}
                {dioCast && (() => {
                  const s = battleStratagemSituation(worldBattle, sel.coord, sel.coord, dioCast.id);
                  if (!s.note) return null;
                  return (
                    <span style={{ color: s.mult >= 1 ? '#9ad6a8' : '#e8a07a', fontSize: '0.7rem' }}>
                      {s.mult >= 1 ? '⊕' : '⊖'} {t(s.note.zh, s.note.en)}
                    </span>
                  );
                })()}
              </>
            ) : (
              <span style={{ color: '#8a7050', fontSize: '0.74rem' }}>
                {t('點選棋盤上我方部隊下令', 'Tap one of your units on the board')}
              </span>
            )}
            {hovUnit && hovOff && hovUnit.id !== dioSelectedId && (
              <span style={{
                color: hovIsOwn ? '#9ec9f0' : '#f0a0a0', fontSize: '0.74rem',
                borderLeft: '1px solid #4a3520', paddingLeft: '0.55rem',
              }}>
                {hovIsOwn ? '' : t('敵 ', 'Enemy ')}{pickName(hovOff.name, lang)} · {hovUnit.troops.toLocaleString()}{t('兵', '')} · AP {hovUnit.ap}/{hovUnit.maxAp}
              </span>
            )}
            {/* 戰鬥預判 — same forecast as the fullscreen screen, on the diorama. */}
            {sel && !hovIsOwn && hovUnit && hovUnit.troops > 0 && worldPlayerSide && sel.side === worldPlayerSide
              && canAttack(worldBattle, sel, hovUnit) && (() => {
              const f = forecastAttack(worldBattle, sel, hovUnit, officersAll);
              const ml = matchupLabel(sel.unitType, hovUnit.unitType);
              const bad = matchupLabel(hovUnit.unitType, sel.unitType);
              const col = f.willKill ? '#7ed68a' : f.matchup === 'strong' ? '#d4e88a' : f.matchup === 'weak' ? '#e8a07a' : '#d4a84a';
              return (
                <span style={{
                  color: col, fontSize: '0.74rem', borderLeft: '1px solid #4a3520', paddingLeft: '0.55rem',
                }}>
                  ⚔ {f.dmgMin.toLocaleString()}–{f.dmgMax.toLocaleString()}
                  {f.willKill ? ` · ${t('可殲滅', 'LETHAL')}` : f.counterMax > 0 ? ` · ${t('反', 'ca')}${f.counterMax.toLocaleString()}` : ''}
                  {ml ? ` · ↑${lang === 'en' ? ml.en : ml.zh}` : bad ? ` · ↓${t('被', 'vs ')}${lang === 'en' ? bad.en : bad.zh}` : ''}
                </span>
              );
            })()}
            <button
              onClick={() => {
                const b = useGameStore.getState().tacticalBattle;
                if (!b || !worldMyTurn) return;
                startBattleUpdate(endTurn(b, useGameStore.getState().officers));
                setDioPick(null);
              }}
              disabled={!worldMyTurn}
              style={{
                background: worldMyTurn ? '#5a4530' : '#241c12', color: worldMyTurn ? '#f0e0b0' : '#6a5238',
                border: '1px solid #d4a84a', padding: '0.15rem 0.6rem',
                cursor: worldMyTurn ? 'pointer' : 'not-allowed',
                fontFamily: 'inherit', fontSize: '0.75rem',
              }}
            >{t('結束回合', 'End Turn')}</button>
            <button
              onClick={() => setBattleViewMinimized(false)}
              style={{
                background: '#16261a', color: '#9ed68a', border: '1px solid #5a8a3a',
                padding: '0.15rem 0.6rem', cursor: 'pointer',
                fontFamily: 'inherit', fontSize: '0.75rem',
              }}
            >⤢ {t('全屏戰場', 'Fullscreen')}</button>
          </div>
        );
      })()}

      {/* 迷你導航 — the realm at a glance; click to jump the camera there. */}
      {navView && (
        <div style={{ position: 'absolute', right: 12, bottom: 12, zIndex: 11 }}>
          <LocatorMap
            window={{ cx: navView.cx, cy: navView.cy, spanX: navView.span * 1.6, spanY: navView.span, rotation: 0, kind: 'world' }}
            width={IS_MOBILE ? 108 : 138}
            onPickPx={(px, py) => setNavJump({ px, py, seq: Date.now() })}
          />
        </div>
      )}

      {/* 單挑 from the world map — same modal & writeback as the fullscreen. */}
      {worldDuel && (
        <Duel3DStage
          attacker={worldDuel.me}
          defender={worldDuel.foe}
          meFatigue={worldDuel.meFatigue}
          foeFatigue={worldDuel.foeFatigue}
          reinforcements={worldDuel.reinforcements}
          staged
          onRound={() => {
            // 戰場原地對決 — the two diorama units lunge at each other each round.
            const bt = useGameStore.getState().tacticalBattle;
            const ua = bt?.units.find((u) => u.officerId === worldDuel.me.id);
            const ub = bt?.units.find((u) => u.officerId === worldDuel.foe.id);
            if (!ua || !ub) return;
            const now = Date.now();
            setDioArcs((a) => [...a,
              { id: now, from: ua.coord, to: ub.coord, kind: 'melee' as const, spawnedAt: now },
              { id: now + 1, from: ub.coord, to: ua.coord, kind: 'melee' as const, spawnedAt: now },
            ]);
            setTimeout(() => setDioArcs((a) => a.filter((x) => x.id !== now && x.id !== now + 1)), 600);
          }}
          onComplete={(outcome) => {
            const { foe } = worldDuel;
            const b = useGameStore.getState().tacticalBattle;
            const me = (outcome.attackerId && useGameStore.getState().officers[outcome.attackerId]) || worldDuel.me;
            setWorldDuel(null);
            if (!b) return;
            const killedId = outcome.killedId === 'defender' ? foe.id
              : outcome.killedId === 'attacker' ? me.id : null;
            // 怯戰 — a foe who 請降 / 落荒而逃 is out of the fight too: removed from
            // the field with no kill (yield → capturable below; flee → simply gone).
            const foeBroke = outcome.fate && outcome.winner === 'attacker' ? outcome.fate : null;
            const removedId = killedId ?? (foeBroke ? foe.id : null);
            let next = b;
            if (removedId) {
              const fallen = next.units.find((u) => u.officerId === removedId);
              const prevCas = next.casualties ?? { attacker: [], defender: [] };
              next = {
                ...next,
                units: next.units.filter((u) => u.officerId !== removedId),
                casualties: fallen
                  ? { ...prevCas, [fallen.side]: [...prevCas[fallen.side], removedId] }
                  : prevCas,
              };
            }
            const duelWinner = outcome.winner === 'attacker' ? me : foe;
            const duelLoser = outcome.winner === 'attacker' ? foe : me;
            next = {
              ...next,
              log: [...(next.log ?? []), {
                turn: next.turn,
                text: outcome.winner === 'draw'
                  ? `${me.name.zh} 與 ${foe.name.zh} 大戰不分勝負 — 俱各帶傷。`
                  : foeBroke === 'yield' ? `${foe.name.zh} 力盡棄械,陣前請降!`
                  : foeBroke === 'flee' ? `${foe.name.zh} 膽寒,撥馬落荒而逃!`
                  : `${duelWinner.name.zh} 於陣前力克 ${duelLoser.name.zh}!`,
                textEn: outcome.winner === 'draw'
                  ? `${me.name.en} and ${foe.name.en} fought to a draw — both wounded.`
                  : foeBroke === 'yield' ? `${foe.name.en} throws down his arms and yields on the field!`
                  : foeBroke === 'flee' ? `${foe.name.en} loses his nerve and flees the field!`
                  : `${duelWinner.name.en} bested ${duelLoser.name.en} in single combat!`,
                kind: 'event' as const,
              }],
            };
            // 負傷 — the bested fighter's own unit is mauled (~18%); a draw
            // mauls both (~10%). Feeds the post-battle wound roll.
            if (outcome.winner !== 'draw') {
              const loserId = outcome.winner === 'attacker' ? foe.id : me.id;
              if (loserId !== removedId) {
                next = { ...next, units: next.units.map((u) => u.officerId === loserId ? { ...u, troops: Math.round(u.troops * 0.82) } : u) };
              }
            } else {
              next = { ...next, units: next.units.map((u) => (u.officerId === me.id || u.officerId === foe.id) ? { ...u, troops: Math.round(u.troops * 0.9) } : u) };
            }
            // 車輪戰 — both surviving fighters open any next bout more winded.
            next = { ...next, units: next.units.map((u) => (u.officerId === me.id || u.officerId === foe.id) ? { ...u, duelFatigue: (u.duelFatigue ?? 0) + 24 } : u) };
            startBattleUpdate(next);
            // 慘勝負傷 (§6.13) — a hard-won bout bloodies the victor too (養傷 downtime).
            if (outcome.hardWon && outcome.winner !== 'draw') {
              const victorId = outcome.winner === 'attacker' ? me.id : foe.id;
              if (victorId !== killedId) useGameStore.getState().afflictOfficer(victorId, duelWound(false));
            }
            // 生擒/招降 — a felled or surrendered foe may be taken; a fled one is gone.
            if ((killedId && killedId === foe.id) || foeBroke === 'yield') setCaptureChoice({ id: foe.id, name: foe.name });
          }}
        />
      )}

      {/* 斬/擒 — choose the defeated foe's fate. A forced choice: no Esc/backdrop
          so the player must decide, but now via the shared Modal + bilingual. */}
      {captureChoice && (
        <Modal
          onClose={() => {}}
          hideClose
          closeOnEsc={false}
          closeOnBackdrop={false}
          width="min(420px, 92vw)"
          zIndex={1450}
          ariaLabel={t('處置敗將', "The captive's fate")}
        >
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '1.4rem', color: '#f2dd9a', marginBottom: '0.3rem' }}>
              {t(`${captureChoice.name.zh} 已敗於你劍下!`, `${captureChoice.name.en} falls before you!`)}
            </div>
            <div style={{ fontSize: '0.85rem', color: '#aab6c0', marginBottom: '1.2rem' }}>{t('斬之以絕後患,還是生擒以圖招攬?', 'Cut them down — or take them alive to win over?')}</div>
            <div style={{ display: 'flex', gap: '0.8rem', justifyContent: 'center' }}>
              <button
                onClick={() => { const b = useGameStore.getState().tacticalBattle; if (b) startBattleUpdate({ ...b, forcedKills: [...(b.forcedKills ?? []), captureChoice.id] }); setCaptureChoice(null); }}
                style={{ flex: 1, padding: '0.6rem', background: 'linear-gradient(180deg,#7a2a20,#4a1810)', border: '1px solid #e0846a', color: '#ffe0d0', cursor: 'pointer', fontFamily: 'inherit', fontSize: '1.05rem', letterSpacing: '0.1rem' }}
              >🗡 {t('斬', 'Slay')}</button>
              <button
                onClick={() => { const b = useGameStore.getState().tacticalBattle; if (b) startBattleUpdate({ ...b, forcedCaptures: [...(b.forcedCaptures ?? []), captureChoice.id] }); setCaptureChoice(null); }}
                style={{ flex: 1, padding: '0.6rem', background: 'linear-gradient(180deg,#2a4a2a,#16301a)', border: '1px solid #86f29a', color: '#d0ffd8', cursor: 'pointer', fontFamily: 'inherit', fontSize: '1.05rem', letterSpacing: '0.1rem' }}
              >🪢 {t('生擒', 'Capture')}</button>
            </div>
          </div>
        </Modal>
      )}

      {/* 軍令提示 — with a column selected, spell out what a tap does. The
          orders existed but were invisible; this makes them discoverable. */}
      <ArmyOrdersHint />

      {selectedPortId && (
        <PortPanel
          portId={selectedPortId}
          onClose={() => setSelectedPortId(null)}
        />
      )}
      {selectedFortId && (
        <FortPanel
          fortId={selectedFortId}
          onClose={() => setSelectedFortId(null)}
        />
      )}
      {selectedTribeId && (
        <TribePanel
          tribeId={selectedTribeId}
          onClose={() => setSelectedTribeId(null)}
        />
      )}
      {selectedSiteId && (
        <SitePanel
          siteId={selectedSiteId}
          onClose={() => setSelectedSiteId(null)}
        />
      )}
      {selectedScenicId && (
        <ScenicPanel
          siteId={selectedScenicId}
          onClose={() => setSelectedScenicId(null)}
        />
      )}
      {showStockadeBuild && (
        <BuildStockadePicker onClose={() => setShowStockadeBuild(false)} />
      )}
    </div>
  );
}
