import { useEffect, useMemo, useRef, useState } from 'react';
import { useGameStore } from '../../game/state/store';
import { PROVINCES } from '../../game/data';
import type {
  City,
  Command,
  EntityId,
  Force,
  GameDate,
  Officer,
} from '../../game/types';
import type { Weather } from '../../game/systems/weather';
import { drawTerritoryOverlay, getTerritoryCanvas } from './territoryOverlay';
import { generateTerritories, positionAlongRoute, terrainRoute, marchDestCoords } from '../../game/data/territories';
import { snapToHexCenter, hexCorners, isLand } from '../../game/data/geography';
import { deriveWeaponType, type WeaponType } from '../../game/data/weaponTypes';

/** Single-glyph unit tag for the 2D march pennant. */
const UNIT_TAG_2D: Record<WeaponType, string> = {
  cavalry: '騎', bow: '弓', crossbow: '弩', spear: '槍', halberd: '戟',
  sabre: '刀', sword: '劍', fan: '師', siege: '械', none: '步',
};

const MAP_WIDTH = 1000;
const MAP_HEIGHT = 720;
const CITY_RADIUS = 9;
/** Stable fallback so the zustand selector doesn't return a new {} per
 *  render (which would loop-detect under useSyncExternalStore). */
const EMPTY_TERRITORY_OWNERSHIP: Record<EntityId, EntityId | null> = {};
const NEUTRAL_COLOR = '#5a4530';
const MIN_SCALE = 0.6;
const MAX_SCALE = 3.0;

interface Viewport {
  x: number;
  y: number;
  scale: number;
}

const DEFAULT_VIEWPORT: Viewport = { x: 0, y: 0, scale: 1 };

// Corner minimap dimensions (preserve the 1000×720 aspect).
const MINI_W = 172;
const MINI_H = Math.round((MINI_W * 720) / 1000); // 124

/** Draw the whole-nation minimap: territory colours, city dots, and the
 *  current viewport rectangle. */
function drawMinimap(
  mctx: CanvasRenderingContext2D,
  cities: Record<EntityId, City>,
  forces: Record<EntityId, Force>,
  territoryOwnership: Record<EntityId, EntityId | null>,
  viewport: Viewport,
) {
  mctx.clearRect(0, 0, MINI_W, MINI_H);
  mctx.fillStyle = '#0c0a07';
  mctx.fillRect(0, 0, MINI_W, MINI_H);
  // Territory hex colours, scaled down.
  mctx.globalAlpha = 0.92;
  mctx.drawImage(getTerritoryCanvas(cities, forces, territoryOwnership), 0, 0, MINI_W, MINI_H);
  mctx.globalAlpha = 1;
  // City dots by owner.
  const sx = MINI_W / MAP_WIDTH;
  const sy = MINI_H / MAP_HEIGHT;
  for (const c of Object.values(cities)) {
    const f = c.ownerForceId ? forces[c.ownerForceId] : null;
    mctx.fillStyle = f?.color ?? '#6a5536';
    mctx.beginPath();
    mctx.arc(c.coords.x * sx, c.coords.y * sy, 1.3, 0, Math.PI * 2);
    mctx.fill();
  }
  // Current viewport rectangle (the slice of world the main canvas shows).
  const wl = -viewport.x / viewport.scale;
  const wt = -viewport.y / viewport.scale;
  const ww = MAP_WIDTH / viewport.scale;
  const wh = MAP_HEIGHT / viewport.scale;
  mctx.strokeStyle = '#fff4d0';
  mctx.lineWidth = 1.2;
  mctx.strokeRect(wl * sx, wt * sy, ww * sx, wh * sy);
}

type OverlayMode = 'none' | 'gold' | 'food' | 'troops' | 'loyalty' | 'province';

// Public-domain (1903) Three Kingdoms map by Francis Lister Hawks Pott,
// resized to 1000×720. Used as the base art layer; canvas only renders
// dynamic elements on top of it.
const BG_IMAGE_URL = '/map-bg.jpg';

export function StrategicMap() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const minimapRef = useRef<HTMLCanvasElement>(null);
  const bgImageRef = useRef<HTMLImageElement | null>(null);
  const [bgReady, setBgReady] = useState(false);
  const cities = useGameStore((s) => s.cities);
  const forces = useGameStore((s) => s.forces);
  const officers = useGameStore((s) => s.officers);
  const territoryOwnership = useGameStore((s) => s.territoryOwnership ?? EMPTY_TERRITORY_OWNERSHIP);
  const selectedCityId = useGameStore((s) => s.selectedCityId);
  const selectedArmyId = useGameStore((s) => s.selectedArmyId);
  const pendingCommands = useGameStore((s) => s.pendingCommands);
  const selectCity = useGameStore((s) => s.selectCity);
  const selectArmy = useGameStore((s) => s.selectArmy);
  const redirectArmy = useGameStore((s) => s.redirectArmy);
  const moveArmyToCell = useGameStore((s) => s.moveArmyToCell);

  const fogOfWar = useGameStore((s) => s.fogOfWar);
  const playerForceId = useGameStore((s) => s.playerForceId);
  const date = useGameStore((s) => s.date);
  const weather = useGameStore((s) => s.weather);
  const burningCities = useGameStore((s) => s.burningCities);
  const [hoverCityId, setHoverCityId] = useState<EntityId | null>(null);
  const [hoverPos, setHoverPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  // Hovered territory cell (when not over a city): tooltip state + a ref
  // the draw loop reads to outline the cell without re-subscribing.
  const [hoverForce, setHoverForce] = useState<{ name: string; color: string } | null>(null);
  const hoverHexRef = useRef<{ x: number; y: number; color: string } | null>(null);
  const [viewport, setViewport] = useState<Viewport>(DEFAULT_VIEWPORT);
  const [overlayMode, setOverlayMode] = useState<OverlayMode>('none');
  // Dev edit mode — drag-to-relocate cities, then export.
  const [editMode, setEditMode] = useState(false);
  const [coordOverrides, setCoordOverrides] = useState<Record<EntityId, { x: number; y: number }>>({});
  const editDragRef = useRef<{ cityId: EntityId; offsetX: number; offsetY: number } | null>(null);
  const dragStateRef = useRef<{
    active: boolean;
    moved: boolean;
    startX: number;
    startY: number;
    origX: number;
    origY: number;
  } | null>(null);

  // Load the background map image once.
  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      bgImageRef.current = img;
      setBgReady(true);
    };
    img.onerror = () => {
      // Fall back to procedural rendering if the image is missing.
      bgImageRef.current = null;
      setBgReady(true);
    };
    img.src = BG_IMAGE_URL;
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Cap DPR on phones — iPhone DPR 3 means 6.5M-pixel canvas which
    // tanks framerate. 1.5 looks plenty crisp at typical viewing distance.
    const isPhone = window.innerWidth <= 640;
    const rawDpr = window.devicePixelRatio || 1;
    const dpr = isPhone ? Math.min(rawDpr, 1.5) : rawDpr;
    canvas.width = MAP_WIDTH * dpr;
    canvas.height = MAP_HEIGHT * dpr;
    canvas.style.width = `${MAP_WIDTH}px`;
    canvas.style.height = `${MAP_HEIGHT}px`;

    const render = () => {
      if (!canvas || !ctx) return;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      // Clear before redraw so animated layers refresh cleanly.
      ctx.clearRect(0, 0, MAP_WIDTH, MAP_HEIGHT);
      ctx.save();
      ctx.translate(viewport.x, viewport.y);
      ctx.scale(viewport.scale, viewport.scale);

      // Apply edit-mode coord overrides to all cities before rendering.
      const effectiveCities: typeof cities = {};
      for (const c of Object.values(cities)) {
        const ov = coordOverrides[c.id];
        effectiveCities[c.id] = ov ? { ...c, coords: ov } : c;
      }
      drawMap(ctx, effectiveCities, forces, officers, territoryOwnership, selectedCityId, pendingCommands, date, bgImageRef.current, viewport.scale, selectedArmyId);
      // Hovered territory cell outline (drawn in world space, above the grid).
      const hh = hoverHexRef.current;
      if (hh) {
        const corners = hexCorners(hh.x, hh.y);
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(corners[0][0], corners[0][1]);
        for (let i = 1; i < 6; i++) ctx.lineTo(corners[i][0], corners[i][1]);
        ctx.closePath();
        ctx.globalAlpha = 0.22;
        ctx.fillStyle = hh.color;
        ctx.fill();
        ctx.globalAlpha = 0.95;
        ctx.lineWidth = 2;
        ctx.lineJoin = 'round';
        ctx.strokeStyle = '#fff4d0';
        ctx.shadowColor = hh.color;
        ctx.shadowBlur = 6;
        ctx.stroke();
        ctx.restore();
      }
      if (overlayMode !== 'none') {
        drawHeatmap(ctx, effectiveCities, overlayMode);
      }
      if (fogOfWar && playerForceId) {
        drawFog(ctx, effectiveCities, playerForceId);
      }
      // ── Burning-city fire glyphs (rendered above cities, below fog) ──
      drawBurningCities(ctx, effectiveCities, burningCities);
      // ── Weather tint overlay (rain/snow/strong-wind streaks) ──
      drawWeatherOverlay(ctx, weather);
      ctx.restore();

      drawOverlay(ctx, date);

      // Corner minimap (separate canvas).
      const mcanvas = minimapRef.current;
      const mctx = mcanvas?.getContext('2d');
      if (mctx) drawMinimap(mctx, cities, forces, territoryOwnership, viewport);
    };
    render();
    // Throttle: 60fps on desktop, ~25fps on phones (~40ms frame budget).
    // Keep particles drifting + selected-city pulse + march arrows animated.
    let raf = 0;
    let lastFrame = 0;
    const minFrameMs = isPhone ? 40 : 0;
    const tick = (now: number) => {
      if (now - lastFrame >= minFrameMs) {
        render();
        lastFrame = now;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [cities, forces, officers, territoryOwnership, selectedCityId, selectedArmyId, pendingCommands, viewport, overlayMode, fogOfWar, playerForceId, date, bgReady, coordOverrides, weather, burningCities]);

  // Territory list (stable per city set) for hover owner lookup.
  const territoriesForHover = useMemo(
    () => generateTerritories(Object.values(cities)),
    [cities],
  );
  // Effective owning force of the territory cell at a world point, or null.
  const territoryForceAt = (wx: number, wy: number): EntityId | null => {
    let best = -1;
    let bestD = Infinity;
    for (let i = 0; i < territoriesForHover.length; i++) {
      const t = territoriesForHover[i];
      const dx = wx - t.coords.x;
      const dy = wy - t.coords.y;
      const d = dx * dx + dy * dy;
      if (d < bestD) { bestD = d; best = i; }
    }
    if (best < 0) return null;
    const t = territoriesForHover[best];
    const override = territoryOwnership[t.id];
    if (override !== undefined && override !== null) return override;
    return cities[t.parentCityId]?.ownerForceId ?? null;
  };

  // Hit-test a marching army at a world point — returns its id (= officer
  // id) if the click lands on the unit marker, using the same position
  // formula the draw loop uses.
  const armyAtPoint = (wx: number, wy: number): EntityId | null => {
    for (const cmd of Object.values(pendingCommands)) {
      if (cmd.type !== 'march') continue;
      const from = cities[cmd.cityId];
      const dest = marchDestCoords(cmd, cities);
      if (!from || !dest) continue;
      const route = terrainRoute(from.coords.x, from.coords.y, dest.x, dest.y);
      const total = Math.max(1, cmd.totalSeasons ?? 1);
      const remaining = cmd.seasonsRemaining ?? 1;
      const t = Math.min(0.95, Math.max(0.05, (total - remaining + 0.5) / total));
      const raw = positionAlongRoute(route, t);
      const { x: ux, y: uy } = snapToHexCenter(raw.x, raw.y);
      if (Math.hypot(wx - ux, wy - uy) <= 14) return cmd.officerId;
    }
    return null;
  };

  // Convert canvas (CSS px) coords → world (map) coords.
  const toWorld = (cx: number, cy: number) => ({
    x: (cx - viewport.x) / viewport.scale,
    y: (cy - viewport.y) / viewport.scale,
  });

  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const cx = e.clientX - rect.left;
    const cy = e.clientY - rect.top;
    const factor = e.deltaY < 0 ? 1.1 : 1 / 1.1;
    setViewport((v) => {
      const nextScale = clamp(MIN_SCALE, MAX_SCALE, v.scale * factor);
      // Zoom around mouse position: keep world point under cursor fixed.
      const worldX = (cx - v.x) / v.scale;
      const worldY = (cy - v.y) / v.scale;
      return {
        scale: nextScale,
        x: cx - worldX * nextScale,
        y: cy - worldY * nextScale,
      };
    });
  };

  // Helper: build the same effective city map used at render time.
  const effectiveCity = (id: EntityId) => {
    const c = cities[id];
    const ov = coordOverrides[id];
    return c && ov ? { ...c, coords: ov } : c;
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (e.button !== 0) return;
    if (Date.now() < suppressMouseUntilRef.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const { x, y } = toWorld(e.clientX - rect.left, e.clientY - rect.top);

    // In edit mode, mouse-down on a city starts a city-drag instead of panning.
    if (editMode) {
      const effMap: Record<EntityId, City> = {};
      for (const c of Object.values(cities)) effMap[c.id] = effectiveCity(c.id)!;
      const hit = hitTestCity(x, y, effMap);
      if (hit) {
        const eff = effMap[hit];
        editDragRef.current = {
          cityId: hit,
          offsetX: x - eff.coords.x,
          offsetY: y - eff.coords.y,
        };
        return;
      }
    }
    dragStateRef.current = {
      active: true,
      moved: false,
      startX: e.clientX,
      startY: e.clientY,
      origX: viewport.x,
      origY: viewport.y,
    };
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const cx = e.clientX - rect.left;
    const cy = e.clientY - rect.top;

    // Edit-mode city drag
    const cityDrag = editDragRef.current;
    if (editMode && cityDrag) {
      const { x, y } = toWorld(cx, cy);
      const nx = Math.round(Math.max(0, Math.min(MAP_WIDTH, x - cityDrag.offsetX)));
      const ny = Math.round(Math.max(0, Math.min(MAP_HEIGHT, y - cityDrag.offsetY)));
      setCoordOverrides((m) => ({ ...m, [cityDrag.cityId]: { x: nx, y: ny } }));
      return;
    }

    const drag = dragStateRef.current;
    if (drag?.active) {
      const dx = e.clientX - drag.startX;
      const dy = e.clientY - drag.startY;
      if (Math.abs(dx) > 3 || Math.abs(dy) > 3) drag.moved = true;
      if (drag.moved) {
        setViewport((v) => ({ ...v, x: drag.origX + dx, y: drag.origY + dy }));
        if (hoverCityId) setHoverCityId(null);
      }
      return;
    }
    // Hover detection (not dragging)
    const { x, y } = toWorld(cx, cy);
    const effMap: Record<EntityId, City> = {};
    for (const c of Object.values(cities)) effMap[c.id] = effectiveCity(c.id)!;
    const hit = hitTestCity(x, y, effMap);
    if (hit !== hoverCityId) setHoverCityId(hit);
    if (hit) setHoverPos({ x: cx, y: cy });

    // Territory-cell hover (only when not over a city and on land).
    if (!hit && isLand(x, y, 2)) {
      const snapped = snapToHexCenter(x, y);
      const forceId = territoryForceAt(snapped.x, snapped.y);
      const force = forceId ? forces[forceId] : null;
      const color = force?.color ?? '#8a7050';
      hoverHexRef.current = { x: snapped.x, y: snapped.y, color };
      setHoverForce({ name: force ? force.name.zh : '無主', color });
      setHoverPos({ x: cx, y: cy });
    } else {
      hoverHexRef.current = null;
      if (hoverForce) setHoverForce(null);
    }
  };

  const handleMouseLeave = () => {
    setHoverCityId(null);
    hoverHexRef.current = null;
    setHoverForce(null);
  };

  const handleMouseUp = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (Date.now() < suppressMouseUntilRef.current) return;
    // Finish edit-mode drag (no other action)
    if (editMode && editDragRef.current) {
      const { cityId } = editDragRef.current;
      editDragRef.current = null;
      const ov = coordOverrides[cityId];
      if (ov) console.log(`[map-edit] ${cityId}: { x: ${ov.x}, y: ${ov.y} }`);
      return;
    }

    const drag = dragStateRef.current;
    dragStateRef.current = null;
    if (!drag) return;
    if (drag.moved) return; // suppress click after drag

    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const { x, y } = toWorld(e.clientX - rect.left, e.clientY - rect.top);
    // A marching unit under the cursor takes priority over the city beneath.
    const armyHit = armyAtPoint(x, y);
    if (armyHit) { selectArmy(armyHit); return; }
    const effMap: Record<EntityId, City> = {};
    for (const c of Object.values(cities)) effMap[c.id] = effectiveCity(c.id)!;
    const hit = hitTestCity(x, y, effMap);
    // If an army is selected (RTS-style: unit → click destination):
    //  • click a city → re-route there;
    //  • click open land → march to that cell and garrison it.
    if (selectedArmyId) {
      if (hit) {
        if (redirectArmy(selectedArmyId, hit)) { selectArmy(null); return; }
      } else if (isLand(x, y, 2)) {
        if (moveArmyToCell(selectedArmyId, x, y)) { selectArmy(null); return; }
      }
    }
    selectArmy(null);
    selectCity(hit);
  };

  const handleDoubleClick = () => setViewport(DEFAULT_VIEWPORT);

  // Click the minimap to recentre the main view on that world point.
  const handleMinimapClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const mc = minimapRef.current;
    if (!mc) return;
    const rect = mc.getBoundingClientRect();
    const worldX = ((e.clientX - rect.left) / rect.width) * MAP_WIDTH;
    const worldY = ((e.clientY - rect.top) / rect.height) * MAP_HEIGHT;
    setViewport((v) => {
      const px = MAP_WIDTH / 2 - worldX * v.scale;
      const py = MAP_HEIGHT / 2 - worldY * v.scale;
      const loX = MAP_WIDTH * (1 - v.scale);
      const loY = MAP_HEIGHT * (1 - v.scale);
      const clamp = (val: number, a: number, b: number) =>
        Math.max(Math.min(a, b), Math.min(Math.max(a, b), val));
      return { ...v, x: clamp(px, loX, 0), y: clamp(py, loY, 0) };
    });
  };

  // ── Touch / pinch zoom + tap-to-select ──
  const touchStateRef = useRef<{
    mode: 'pan' | 'pinch' | null;
    startX: number;
    startY: number;
    lastX: number;
    lastY: number;
    dist: number;
    startScale: number;
    moved: boolean;
  }>({ mode: null, startX: 0, startY: 0, lastX: 0, lastY: 0, dist: 0, startScale: 1, moved: false });

  // Suppress synthesized mouse events that iOS fires after a touch.
  // (touchend → synthesized mousedown/mouseup ~10ms later would otherwise
  // clobber the selection just set by handleTouchEnd.)
  const suppressMouseUntilRef = useRef<number>(0);

  const handleTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (e.touches.length === 1) {
      touchStateRef.current = {
        mode: 'pan',
        startX: e.touches[0].clientX,
        startY: e.touches[0].clientY,
        lastX: e.touches[0].clientX,
        lastY: e.touches[0].clientY,
        dist: 0,
        startScale: viewport.scale,
        moved: false,
      };
    } else if (e.touches.length === 2) {
      const [a, b] = [e.touches[0], e.touches[1]];
      const d = Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
      touchStateRef.current = {
        mode: 'pinch',
        startX: 0, startY: 0,
        lastX: (a.clientX + b.clientX) / 2,
        lastY: (a.clientY + b.clientY) / 2,
        dist: d,
        startScale: viewport.scale,
        moved: true,
      };
    }
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    const s = touchStateRef.current;
    if (!s.mode) return;
    e.preventDefault();
    if (s.mode === 'pan' && e.touches.length === 1) {
      const t = e.touches[0];
      const dx = t.clientX - s.lastX;
      const dy = t.clientY - s.lastY;
      if (Math.abs(t.clientX - s.startX) > 5 || Math.abs(t.clientY - s.startY) > 5) {
        s.moved = true;
      }
      s.lastX = t.clientX;
      s.lastY = t.clientY;
      if (s.moved) {
        setViewport((v) => ({ ...v, x: v.x + dx, y: v.y + dy }));
      }
    } else if (s.mode === 'pinch' && e.touches.length === 2) {
      const [a, b] = [e.touches[0], e.touches[1]];
      const d = Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
      const cx = (a.clientX + b.clientX) / 2;
      const cy = (a.clientY + b.clientY) / 2;
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const lx = cx - rect.left;
      const ly = cy - rect.top;
      const factor = d / s.dist;
      setViewport((v) => {
        const nextScale = clamp(MIN_SCALE, MAX_SCALE, s.startScale * factor);
        const worldX = (lx - v.x) / v.scale;
        const worldY = (ly - v.y) / v.scale;
        return {
          scale: nextScale,
          x: lx - worldX * nextScale,
          y: ly - worldY * nextScale,
        };
      });
    }
  };

  const handleTouchEnd = (e: React.TouchEvent<HTMLCanvasElement>) => {
    // Capture state BEFORE clearing the ref (s and ref share the same object).
    const wasMode = touchStateRef.current.mode;
    const didMove = touchStateRef.current.moved;
    touchStateRef.current.mode = null;
    touchStateRef.current.moved = false;
    // Block any synthesized mouse events for the next 500ms.
    suppressMouseUntilRef.current = Date.now() + 500;
    // Tap-to-select: only when single-touch and didn't drag.
    if (wasMode === 'pan' && !didMove) {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      // Use changedTouches because all touches have lifted on touchend
      const t = e.changedTouches[0];
      if (!t) return;
      const cssX = t.clientX - rect.left;
      const cssY = t.clientY - rect.top;
      // Canvas may be CSS-resized on mobile (width: 100%). Scale touch
      // coords back into the logical 1000×720 canvas space, then toWorld.
      const scaleX = MAP_WIDTH / rect.width;
      const scaleY = MAP_HEIGHT / rect.height;
      const cx = cssX * scaleX;
      const cy = cssY * scaleY;
      const { x: wx, y: wy } = toWorld(cx, cy);
      const armyHit = armyAtPoint(wx, wy);
      if (armyHit) { selectArmy(armyHit); return; }
      const effMap: Record<EntityId, City> = {};
      for (const c of Object.values(cities)) effMap[c.id] = effectiveCity(c.id)!;
      const hit = hitTestCity(wx, wy, effMap);
      if (selectedArmyId) {
        if (hit) {
          if (redirectArmy(selectedArmyId, hit)) { selectArmy(null); return; }
        } else if (isLand(wx, wy, 2)) {
          if (moveArmyToCell(selectedArmyId, wx, wy)) { selectArmy(null); return; }
        }
      }
      selectArmy(null);
      selectCity(hit);
    }
  };

  return (
    <div style={{ position: 'relative', width: MAP_WIDTH, height: MAP_HEIGHT, maxWidth: '100%' }}>
      {/* Corner minimap — whole-nation overview + click-to-jump. */}
      <canvas
        ref={minimapRef}
        width={MINI_W}
        height={MINI_H}
        onClick={handleMinimapClick}
        style={{
          position: 'absolute',
          left: 8,
          bottom: 8,
          width: MINI_W,
          height: MINI_H,
          border: '1px solid #6a5536',
          boxShadow: '0 0 10px rgba(0,0,0,0.7)',
          cursor: 'crosshair',
          zIndex: 20,
          background: '#0c0a07',
        }}
      />
      <canvas
        ref={canvasRef}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        onDoubleClick={handleDoubleClick}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchEnd}
        style={{
          display: 'block',
          touchAction: 'none',
          maxWidth: '100%',
          height: 'auto',
          cursor: hoverCityId ? 'pointer' : (dragStateRef.current?.moved ? 'grabbing' : 'grab'),
        }}
      />
      {/* Hover preview tooltip */}
      {hoverCityId && cities[hoverCityId] && (() => {
        const c = cities[hoverCityId];
        const f = c.ownerForceId ? forces[c.ownerForceId] : null;
        return (
          <div style={{
            position: 'absolute',
            left: Math.min(MAP_WIDTH - 200, hoverPos.x + 14),
            top: Math.min(MAP_HEIGHT - 130, hoverPos.y + 14),
            pointerEvents: 'none',
            background: 'linear-gradient(160deg, #2a1f15, #1a1410)',
            border: `1px solid ${f?.color ?? '#5a4530'}`,
            padding: '0.5rem 0.7rem',
            color: '#e8d9b0',
            fontFamily: '"Songti SC", serif',
            fontSize: '0.78rem',
            width: 185,
            zIndex: 50,
            boxShadow: '0 0 12px rgba(0,0,0,0.6)',
          }}>
            <div style={{ fontSize: '0.95rem', color: '#d4a84a', letterSpacing: '0.2rem' }}>
              {c.name.zh}{' '}
              <span style={{ fontSize: '0.7rem', color: '#8a7050', fontStyle: 'italic' }}>{c.name.en}</span>
            </div>
            <div style={{ fontSize: '0.7rem', color: '#c0a878', marginTop: '0.15rem' }}>
              {f ? (
                <>
                  <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: f.color, marginRight: 4 }} />
                  {f.name.zh}
                </>
              ) : (
                <span style={{ color: '#5a4530', fontStyle: 'italic' }}>Neutral</span>
              )}
            </div>
            <div style={{ fontFamily: 'ui-monospace, monospace', fontSize: '0.7rem', color: '#a89878', marginTop: '0.3rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.15rem 0.5rem' }}>
              <span>金 {c.gold.toLocaleString()}</span>
              <span>糧 {c.food.toLocaleString()}</span>
              <span>兵 {c.troops.toLocaleString()}</span>
              <span>守 {c.defense}</span>
            </div>
          </div>
        );
      })()}
      {/* Territory-cell hover chip (only when not over a city) */}
      {!hoverCityId && hoverForce && (
        <div style={{
          position: 'absolute',
          left: Math.min(MAP_WIDTH - 120, hoverPos.x + 14),
          top: Math.min(MAP_HEIGHT - 40, hoverPos.y + 14),
          pointerEvents: 'none',
          background: 'rgba(20, 14, 9, 0.9)',
          border: `1px solid ${hoverForce.color}`,
          padding: '0.2rem 0.5rem',
          color: '#e8d9b0',
          fontFamily: '"Songti SC", serif',
          fontSize: '0.78rem',
          whiteSpace: 'nowrap',
          zIndex: 50,
          boxShadow: '0 0 8px rgba(0,0,0,0.6)',
        }}>
          <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: hoverForce.color, marginRight: 5 }} />
          {hoverForce.name}
          <span style={{ color: '#8a7050', marginLeft: 5, fontSize: '0.66rem' }}>領地</span>
        </div>
      )}
      <div
        style={{
          position: 'absolute',
          right: 12,
          bottom: 12,
          display: 'flex',
          gap: 4,
          fontSize: '0.75rem',
          color: '#8a7050',
          fontFamily: 'ui-monospace, monospace',
          background: 'rgba(26, 20, 16, 0.85)',
          padding: '4px 8px',
          border: '1px solid #4a3520',
          letterSpacing: '0.1rem',
        }}
      >
        {Math.round(viewport.scale * 100)}% · wheel zoom · drag pan · dbl-click reset
      </div>

      {/* Overlay mode chip selector */}
      <div
        style={{
          position: 'absolute',
          left: 12,
          bottom: 12,
          display: 'flex',
          gap: 4,
          fontSize: '0.7rem',
          fontFamily: 'ui-monospace, monospace',
          background: 'rgba(26, 20, 16, 0.85)',
          padding: 4,
          border: '1px solid #4a3520',
        }}
      >
        {(['none', 'gold', 'food', 'troops', 'loyalty', 'province'] as OverlayMode[]).map((m) => (
          <button
            key={m}
            onClick={() => setOverlayMode(m)}
            style={{
              background: overlayMode === m ? '#3a2d20' : 'transparent',
              border: '1px solid ' + (overlayMode === m ? '#d4a84a' : '#4a3520'),
              color: overlayMode === m ? '#d4a84a' : '#8a7050',
              padding: '3px 8px',
              cursor: 'pointer',
              fontFamily: 'inherit',
              letterSpacing: '0.1rem',
              textTransform: 'uppercase',
            }}
          >
            {m === 'none' ? 'off' : m}
          </button>
        ))}
      </div>

      {/* Dev edit mode toggle (drag cities to relocate, export coords) */}
      <div
        style={{
          position: 'absolute',
          left: 12,
          top: 12,
          display: 'flex',
          gap: 4,
          fontSize: '0.65rem',
          fontFamily: 'ui-monospace, monospace',
          background: 'rgba(26, 20, 16, 0.85)',
          padding: 4,
          border: '1px solid #4a3520',
          alignItems: 'center',
        }}
      >
        <button
          onClick={() => setEditMode((v) => !v)}
          style={{
            background: editMode ? '#a8222c' : 'transparent',
            border: '1px solid ' + (editMode ? '#f4e0c0' : '#4a3520'),
            color: editMode ? '#f4e0c0' : '#8a7050',
            padding: '3px 8px',
            cursor: 'pointer',
            fontFamily: 'inherit',
            letterSpacing: '0.1rem',
          }}
        >
          {editMode ? 'EXIT EDIT' : 'EDIT COORDS'}
        </button>
        {editMode && (
          <>
            <span style={{ color: '#c0a878', letterSpacing: '0.05rem' }}>
              {Object.keys(coordOverrides).length} moved
            </span>
            <button
              onClick={() => {
                const lines = Object.entries(coordOverrides).map(
                  ([id, c]) => `  '${id}': { x: ${c.x}, y: ${c.y} },`,
                );
                const txt = `// Paste these into cities.ts coords:\n${lines.join('\n')}`;
                navigator.clipboard?.writeText(txt).catch(() => {});
                console.log(txt);
              }}
              disabled={Object.keys(coordOverrides).length === 0}
              style={{
                background: 'transparent',
                border: '1px solid #4a3520',
                color: '#d4a84a',
                padding: '3px 8px',
                cursor: 'pointer',
                fontFamily: 'inherit',
                letterSpacing: '0.1rem',
              }}
            >
              EXPORT (copy)
            </button>
            <button
              onClick={() => setCoordOverrides({})}
              disabled={Object.keys(coordOverrides).length === 0}
              style={{
                background: 'transparent',
                border: '1px solid #4a3520',
                color: '#8a7050',
                padding: '3px 8px',
                cursor: 'pointer',
                fontFamily: 'inherit',
                letterSpacing: '0.1rem',
              }}
            >
              RESET
            </button>
          </>
        )}
      </div>
    </div>
  );
}

/** Draw a per-city heatmap over the map at the given mode. */
/**
 * Draw fog over cities that are not owned by, or adjacent to, the player.
 */
function drawFog(
  ctx: CanvasRenderingContext2D,
  cities: Record<EntityId, City>,
  playerForceId: EntityId,
) {
  // Build the "visible" set: own cities + adjacent cities.
  const visible = new Set<EntityId>();
  for (const c of Object.values(cities)) {
    if (c.ownerForceId === playerForceId) {
      visible.add(c.id);
      for (const adj of c.adjacentCityIds) visible.add(adj);
    }
  }
  for (const c of Object.values(cities)) {
    if (visible.has(c.id)) continue;
    ctx.fillStyle = 'rgba(10, 14, 22, 0.78)';
    ctx.beginPath();
    ctx.arc(c.coords.x, c.coords.y, 30, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawHeatmap(
  ctx: CanvasRenderingContext2D,
  cities: Record<EntityId, City>,
  mode: 'gold' | 'food' | 'troops' | 'loyalty' | 'province',
) {
  if (mode === 'province') {
    // Province coloring — fetch province by city id lazily.
    // (Inline to avoid extra imports in this file.)
    const provinceColor: Record<string, string> = {
      sili: '#d4a84a', yu: '#c19a3b', ji: '#3a5a8a', qing: '#5a8a8a',
      yan: '#8a5a3a', xu: '#6a8a3a', yang: '#2a7a4a', jing: '#7a4a8a',
      liang: '#b8442e', bing: '#5a4a8a', you: '#3a5a3a', yi: '#3a7d4a',
      jiao: '#5a8a4a',
    };
    for (const c of Object.values(cities)) {
      // Use the global PROVINCE_BY_CITY lookup at runtime.
      // To avoid hard-coding here we map by city id prefix heuristic — see provinces data.
      // This is a presentation-only overlay so an approximate match is fine.
      const pid = (window as unknown as { __provinceByCity?: Record<string, string> }).__provinceByCity?.[c.id];
      const color = pid ? provinceColor[pid] : '#5a4530';
      ctx.fillStyle = color + 'aa';
      ctx.beginPath();
      ctx.arc(c.coords.x, c.coords.y, 22, 0, Math.PI * 2);
      ctx.fill();
    }
    return;
  }
  const values = Object.values(cities).map((c) =>
    mode === 'gold' ? c.gold
    : mode === 'food' ? c.food
    : mode === 'troops' ? c.troops
    : c.loyalty,
  );
  const max = Math.max(...values, 1);
  for (const c of Object.values(cities)) {
    const v =
      mode === 'gold' ? c.gold
      : mode === 'food' ? c.food
      : mode === 'troops' ? c.troops
      : c.loyalty;
    const t = Math.min(1, v / max);
    // Hot color = red→yellow→green for "good" metrics; loyalty: low=red, high=blue.
    let r = 0, g = 0, b = 0;
    if (mode === 'loyalty') {
      // 0=red, 50=yellow, 100=blue
      if (t < 0.5) { r = 220; g = Math.floor(220 * (t * 2)); b = 60; }
      else { r = Math.floor(220 * (1 - (t - 0.5) * 2)); g = 200; b = Math.floor(220 * (t - 0.5) * 2); }
    } else {
      // 0=dark, 1=bright gold
      r = Math.floor(60 + 180 * t);
      g = Math.floor(40 + 130 * t);
      b = Math.floor(30 + 30 * t);
    }
    ctx.fillStyle = `rgba(${r},${g},${b},0.6)`;
    ctx.beginPath();
    ctx.arc(c.coords.x, c.coords.y, 22, 0, Math.PI * 2);
    ctx.fill();
    // Value label
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 10px ui-monospace, monospace';
    ctx.textAlign = 'center';
    ctx.shadowColor = '#000';
    ctx.shadowBlur = 4;
    const label =
      mode === 'loyalty' ? `${v}` :
      v >= 10000 ? `${Math.round(v / 1000)}k` :
      `${v}`;
    ctx.fillText(label, c.coords.x, c.coords.y + 3);
    ctx.shadowBlur = 0;
  }
}

function clamp(lo: number, hi: number, v: number): number {
  return Math.max(lo, Math.min(hi, v));
}

function drawOverlay(ctx: CanvasRenderingContext2D, date: GameDate) {
  // Season particles (snow/petals/leaves/haze) — RTK13PK-style ambient mood
  drawSeasonParticles(ctx, date.season);
  // These are fixed UI chrome — they don't move with the viewport.
  drawCompassRose(ctx, 65, 95);
  drawBorder(ctx);
}

// ──────────────────────────────────────────────────────────────────────
// China map geography (rough Han-dynasty outline, in canvas coords)
// ──────────────────────────────────────────────────────────────────────

// Land polygon — clockwise from northwest, sized for 1000×720.
// Coast outline tuned so every city in cities.ts plots on land.
// Going clockwise from the NW: north steppes → Liaodong → east coast →
// south coast (including Nanhai/Hepu/Cangwu) → SW Nanman frontier
// (Yongchang/Yunnan) → west (Qinling/Hexi corridor) → back to NW.
const CHINA_LAND: Array<[number, number]> = [
  [70, 125],
  // North edge — steppes & Liaodong corner
  [200, 90], [380, 75], [560, 70], [700, 85], [800, 100], [880, 105],
  [920, 135], [905, 180],
  // East coast — Bohai → Qingzhou → Jiangsu → Yangzhou
  [895, 240], [880, 310], [870, 380], [870, 445], [880, 490], [895, 535],
  [885, 580], [855, 615],
  // South coast — Lingnan / Jiao province
  [810, 645], [760, 670], [710, 685], [660, 695], [600, 700], [555, 700],
  // SW — Yongchang / Yunnan frontier
  [495, 700], [430, 695], [360, 690], [300, 680], [240, 685], [180, 675],
  [150, 640], [165, 580],
  // West coast — Yi mountains, Hexi corridor
  [195, 510], [220, 450], [185, 390], [155, 325], [125, 255], [100, 195],
  [70, 125],
];

// Decorative islands
const HAINAN_ISLAND: Array<[number, number]> = [
  [615, 685], [645, 680], [650, 700], [630, 715], [605, 710], [600, 695],
];
const TAIWAN_ISLAND: Array<[number, number]> = [
  [855, 555], [870, 565], [880, 600], [870, 625], [855, 620], [850, 585],
];

// Great Wall — zigzag along the northern frontier, ending at Shanhai Pass
// near Liaodong corner.
const GREAT_WALL: Array<[number, number]> = [
  [100, 165], [180, 145], [260, 160], [340, 145], [420, 160], [500, 145],
  [580, 155], [660, 145], [740, 160], [810, 145], [875, 160],
];

// Yellow River — control points along central China.
const YELLOW_RIVER: Array<[number, number]> = [
  [200, 320], [290, 300], [380, 330], [475, 315], [580, 340], [675, 325],
  [755, 340], [830, 330],
];

// Yangtze — flows from Yi province east to the Wu coast at Jianye.
const YANGTZE: Array<[number, number]> = [
  [250, 500], [350, 480], [445, 510], [555, 495], [650, 520], [720, 510],
  [785, 500], [850, 515], [890, 540],
];

// Mountain accents in the west (Tibetan plateau / Qinling) and SW (Yunnan).
const MOUNTAIN_PEAKS: Array<{ x: number; y: number; h: number }> = [
  // Qinling / west
  { x: 160, y: 340, h: 20 },
  { x: 200, y: 380, h: 24 },
  { x: 245, y: 360, h: 18 },
  { x: 180, y: 425, h: 22 },
  { x: 260, y: 425, h: 20 },
  { x: 305, y: 465, h: 24 },
  { x: 225, y: 475, h: 18 },
  { x: 340, y: 410, h: 20 },
  { x: 400, y: 445, h: 16 },
  // SW Yunnan / Nanman highlands
  { x: 215, y: 590, h: 18 },
  { x: 265, y: 615, h: 16 },
  { x: 175, y: 555, h: 20 },
  { x: 330, y: 600, h: 16 },
];

// Faint province labels.
const PROVINCE_LABELS: Array<{ x: number; y: number; zh: string; en: string }> = [
  { x: 760, y: 160, zh: '幽州', en: 'You'   },
  { x: 540, y: 225, zh: '并州', en: 'Bing'  },
  { x: 685, y: 260, zh: '冀州', en: 'Ji'    },
  { x: 360, y: 290, zh: '涼州', en: 'Liang' },
  { x: 525, y: 335, zh: '司隸', en: 'Sili'  },
  { x: 685, y: 350, zh: '兗州', en: 'Yan'   },
  { x: 800, y: 425, zh: '徐州', en: 'Xu'    },
  { x: 360, y: 510, zh: '益州', en: 'Yi'    },
  { x: 590, y: 415, zh: '荊州', en: 'Jing'  },
  { x: 800, y: 565, zh: '揚州', en: 'Yang'  },
  { x: 670, y: 660, zh: '交州', en: 'Jiao'  },
];

function drawMap(
  ctx: CanvasRenderingContext2D,
  cities: Record<EntityId, City>,
  forces: Record<EntityId, Force>,
  officers: Record<EntityId, Officer>,
  territoryOwnership: Record<EntityId, EntityId | null>,
  selectedCityId: EntityId | null,
  pendingCommands: Record<EntityId, Command>,
  date: GameDate,
  bgImage: HTMLImageElement | null,
  scale: number,
  selectedArmyId: EntityId | null,
) {
  // Sea / void
  ctx.fillStyle = '#0a0e16';
  ctx.fillRect(0, 0, MAP_WIDTH, MAP_HEIGHT);

  // ── Public-domain 1903 base map (Path 1+5) ──
  if (bgImage) {
    drawAntiqueBaseMap(ctx, bgImage);
    // Skip procedurally-drawn sea/land/wall/rivers/mountains/province-labels
    // — the photo already has all of those. Jump straight to the overlays.
    drawSeasonTint(ctx, date.season);
    drawCloudShadows(ctx);
    drawTerritoryOverlay(ctx, cities, forces, territoryOwnership);
    drawProvinceTints(ctx, cities);
    drawTerrainGlyphs(ctx, cities);
    // Roads + march arrows + cities are drawn by the shared block below.
    drawCityLayer(ctx, cities, forces, officers, selectedCityId, pendingCommands, scale, selectedArmyId);
    return;
  }

  // Subtle sea texture (horizontal lines)
  ctx.strokeStyle = 'rgba(58, 95, 145, 0.08)';
  ctx.lineWidth = 1;
  for (let y = 0; y < MAP_HEIGHT; y += 14) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(MAP_WIDTH, y);
    ctx.stroke();
  }

  // Wave hatching along the sea
  ctx.strokeStyle = 'rgba(74, 132, 178, 0.10)';
  ctx.lineWidth = 0.8;
  for (let y = 80; y < MAP_HEIGHT - 20; y += 22) {
    for (let x = 30; x < MAP_WIDTH - 30; x += 36) {
      ctx.beginPath();
      ctx.arc(x, y, 6, Math.PI, 0, false);
      ctx.stroke();
    }
  }

  // Land mass
  drawPolygon(ctx, CHINA_LAND, true);
  const landGrad = ctx.createRadialGradient(
    MAP_WIDTH * 0.55,
    MAP_HEIGHT * 0.4,
    0,
    MAP_WIDTH * 0.55,
    MAP_HEIGHT * 0.4,
    MAP_WIDTH * 0.7,
  );
  landGrad.addColorStop(0, '#3a2d1d');
  landGrad.addColorStop(0.6, '#2a221a');
  landGrad.addColorStop(1, '#1a1410');
  ctx.fillStyle = landGrad;
  ctx.fill();
  ctx.strokeStyle = '#5a4530';
  ctx.lineWidth = 2;
  ctx.stroke();

  // Decorative islands
  drawPolygon(ctx, HAINAN_ISLAND, true);
  ctx.fillStyle = '#2a221a';
  ctx.fill();
  ctx.strokeStyle = '#5a4530';
  ctx.lineWidth = 1.2;
  ctx.stroke();
  ctx.font = 'italic 9px "Songti SC", "Noto Serif SC", serif';
  ctx.fillStyle = 'rgba(138, 112, 80, 0.7)';
  ctx.textAlign = 'center';
  ctx.fillText('海南', 625, 700);

  drawPolygon(ctx, TAIWAN_ISLAND, true);
  ctx.fillStyle = '#2a221a';
  ctx.fill();
  ctx.strokeStyle = '#5a4530';
  ctx.stroke();
  ctx.fillStyle = 'rgba(138, 112, 80, 0.7)';
  ctx.fillText('夷洲', 867, 595);

  // Great Wall — stylized crenellated line
  ctx.strokeStyle = 'rgba(180, 140, 90, 0.7)';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(GREAT_WALL[0][0], GREAT_WALL[0][1]);
  for (let i = 1; i < GREAT_WALL.length; i++) {
    ctx.lineTo(GREAT_WALL[i][0], GREAT_WALL[i][1]);
  }
  ctx.stroke();
  // Crenellation ticks
  ctx.strokeStyle = 'rgba(180, 140, 90, 0.55)';
  ctx.lineWidth = 1.5;
  for (const [x, y] of GREAT_WALL) {
    ctx.beginPath();
    ctx.moveTo(x, y - 6);
    ctx.lineTo(x, y);
    ctx.stroke();
  }
  ctx.font = 'italic 11px "Songti SC", "Noto Serif SC", serif';
  ctx.fillStyle = 'rgba(180, 140, 90, 0.85)';
  ctx.textAlign = 'center';
  ctx.fillText('長城', 450, 132);

  // Province labels — very faint, drawn before rivers so rivers cross them.
  ctx.font = '11px "Songti SC", "Noto Serif SC", serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  for (const p of PROVINCE_LABELS) {
    ctx.fillStyle = 'rgba(138, 112, 80, 0.30)';
    ctx.font = 'bold 18px "Songti SC", "Noto Serif SC", serif';
    ctx.fillText(p.zh, p.x, p.y);
    ctx.fillStyle = 'rgba(138, 112, 80, 0.22)';
    ctx.font = '9px ui-monospace, monospace';
    ctx.fillText(p.en, p.x, p.y + 16);
  }

  // Mountains
  for (const m of MOUNTAIN_PEAKS) {
    ctx.beginPath();
    ctx.moveTo(m.x - m.h * 0.8, m.y);
    ctx.lineTo(m.x, m.y - m.h);
    ctx.lineTo(m.x + m.h * 0.8, m.y);
    ctx.closePath();
    ctx.fillStyle = 'rgba(60, 50, 40, 0.6)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(138, 112, 80, 0.4)';
    ctx.lineWidth = 0.8;
    ctx.stroke();
    // Snow cap
    ctx.beginPath();
    ctx.moveTo(m.x - m.h * 0.25, m.y - m.h * 0.7);
    ctx.lineTo(m.x, m.y - m.h);
    ctx.lineTo(m.x + m.h * 0.25, m.y - m.h * 0.7);
    ctx.closePath();
    ctx.fillStyle = 'rgba(212, 168, 74, 0.4)';
    ctx.fill();
  }

  // Yellow River (黃河) — gold-tinted
  drawRiver(ctx, YELLOW_RIVER, 'rgba(196, 152, 50, 0.55)', 3);
  // Yangtze (長江) — blue-tinted
  drawRiver(ctx, YANGTZE, 'rgba(74, 132, 178, 0.55)', 3);

  // River labels
  ctx.font = 'italic 11px "Songti SC", "Noto Serif SC", serif';
  ctx.fillStyle = 'rgba(196, 152, 50, 0.7)';
  ctx.fillText('黃河', 430, 295);
  ctx.fillStyle = 'rgba(118, 168, 220, 0.7)';
  ctx.fillText('長江', 430, 475);

  // ── Season-tinted overlay across the canvas ──
  drawSeasonTint(ctx, date.season);

  // ── Drifting cloud shadows above the land ──
  drawCloudShadows(ctx);

  // ── Territory ownership tint (Phase 3a — Voronoi by territory) ──
  drawTerritoryOverlay(ctx, cities, forces, territoryOwnership);

  // ── Province color tints (RTK13PK-style soft regional shading) ──
  drawProvinceTints(ctx, cities);

  // ── Ambient terrain glyphs near each city ──
  drawTerrainGlyphs(ctx, cities);

  drawCityLayer(ctx, cities, forces, officers, selectedCityId, pendingCommands, scale, selectedArmyId);

  // (Compass rose and decorative border are drawn separately in
  //  drawOverlay so they don't pan/zoom with the map.)
}

/** Roads + march arrows + city markers — shared by procedural and image-backed renders. */
function drawCityLayer(
  ctx: CanvasRenderingContext2D,
  cities: Record<EntityId, City>,
  forces: Record<EntityId, Force>,
  officers: Record<EntityId, Officer>,
  selectedCityId: EntityId | null,
  pendingCommands: Record<EntityId, Command>,
  viewScale: number,
  selectedArmyId: EntityId | null,
) {
  // Adjacency lines — curving Bezier "trade roads" instead of straight lines.
  ctx.strokeStyle = 'rgba(180, 140, 90, 0.55)';
  ctx.lineWidth = 1.6;
  ctx.lineCap = 'round';
  for (const city of Object.values(cities)) {
    for (const adjId of city.adjacentCityIds) {
      if (city.id >= adjId) continue;
      const adj = cities[adjId];
      if (!adj) continue;
      drawCurvedRoad(ctx, city.coords.x, city.coords.y, adj.coords.x, adj.coords.y, city.id + adjId);
    }
  }

  // March arrows + in-transit unit markers. Armies follow a terrain-
  // weighted route (bends around mountains, through passes).
  for (const cmd of Object.values(pendingCommands)) {
    if (cmd.type !== 'march') continue;
    const from = cities[cmd.cityId];
    const dest = marchDestCoords(cmd, cities);
    if (!from || !dest) continue;
    const to = cities[cmd.targetCityId];
    const fromForce = from.ownerForceId ? forces[from.ownerForceId] : null;
    const hostile = !cmd.targetX && to ? to.ownerForceId !== from.ownerForceId : false;
    const color = hostile ? '#b8442e' : fromForce?.color ?? '#d4a84a';

    const selected = cmd.officerId === selectedArmyId;
    const route = terrainRoute(from.coords.x, from.coords.y, dest.x, dest.y);
    drawRoutePolyline(ctx, route, selected ? '#fff4d0' : color);

    const commander = officers[cmd.officerId];
    if (commander) {
      const total = Math.max(1, cmd.totalSeasons ?? 1);
      const remaining = cmd.seasonsRemaining ?? 1;
      const elapsed = total - remaining;
      // Snap the army to the hex it occupies this season — it sits on a
      // cell and steps cell-to-cell across seasons (RTK-XIV grid march).
      const t = Math.min(0.95, Math.max(0.05, (elapsed + 0.5) / total));
      const raw = positionAlongRoute(route, t);
      const { x: ux, y: uy } = snapToHexCenter(raw.x, raw.y);
      const unitTag = UNIT_TAG_2D[deriveWeaponType(commander)];
      drawOccupiedHex(ctx, ux, uy, color);
      // Selection ring — pulsing bright halo around the chosen army.
      if (selected) {
        const r = 13 + Math.sin(Date.now() / 250) * 2;
        ctx.save();
        ctx.beginPath();
        ctx.arc(ux, uy, r, 0, Math.PI * 2);
        ctx.strokeStyle = '#fff4d0';
        ctx.lineWidth = 2;
        ctx.shadowColor = '#fff4d0';
        ctx.shadowBlur = 10;
        ctx.stroke();
        ctx.restore();
      }
      drawMarchUnit(ctx, ux, uy, color, commander.name.zh, cmd.troops, remaining, total, unitTag, !!cmd.holding);
    }
  }

  // Cities
  for (const city of Object.values(cities)) {
    const force = city.ownerForceId ? forces[city.ownerForceId] : null;
    const color = force?.color ?? NEUTRAL_COLOR;
    const isSelected = city.id === selectedCityId;
    const cx = city.coords.x;
    const cy = city.coords.y;
    const isCapital = !!force && force.capitalCityId === city.id;
    const scale = Math.max(0.85, Math.min(1.4, 0.6 + city.population / 200_000));

    if (isCapital) {
      const t = (Math.sin(Date.now() / 600) + 1) / 2;
      const glowR = 18 + t * 8;
      const grad = ctx.createRadialGradient(cx, cy, 2, cx, cy, glowR);
      grad.addColorStop(0, color + '88');
      grad.addColorStop(1, color + '00');
      ctx.fillStyle = grad;
      ctx.fillRect(cx - glowR, cy - glowR, glowR * 2, glowR * 2);
    }

    drawWalledCity(ctx, cx, cy, color, isSelected, !!city.ownerForceId, scale);

    // Capital ◆ stamp — small, diagonally above
    if (isCapital) {
      drawCapitalSeal(ctx, cx + 7, cy - 7);
    }

    // Permanent city label — sized by importance so the map stays readable
    // at default zoom. Capitals biggest, then large cities, then ordinary
    // ones. Heavy outline keeps labels legible over busy terrain.
    const labelSize = isCapital ? 17 : city.population >= 150_000 ? 14 : 12;
    const labelColor = isCapital ? '#ffe9a8' : '#f0e0b0';
    // Keep labels a constant screen size once zoomed in (viewScale > 1) so
    // they don't balloon; below 1× they shrink with the map as usual.
    const effLabel = labelSize / Math.max(1, viewScale);
    drawCalligraphyLabel(ctx, city.name.zh, cx, cy + 10, effLabel, labelColor);
  }
}

/**
 * Render the base map image with a light darkening pass so that city flags
 * and labels pop above it. Tuned for the painted parchment map.
 */
// Background image scale factor. >1 zooms in (painted geography fills more
// of the canvas), <1 zooms out. Adjust if cities don't line up with the
// painted landmass.
const BG_SCALE = 1.0;
const BG_OFFSET_X = 0;  // positive = shift image right (so we see more of left side)
const BG_OFFSET_Y = 0;  // positive = shift image down

function drawAntiqueBaseMap(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
) {
  ctx.save();
  // Light parchment ink-style map — moderate darken to make gold labels pop,
  // keep the cream paper tone intact.
  ctx.filter = 'saturate(1.05) brightness(0.62) contrast(1.10)';
  // Draw scaled and centered. With BG_SCALE > 1 the image overflows the
  // canvas slightly, making the painted features bigger relative to city
  // coords — better alignment when AI-painted "China" was smaller than the
  // canvas allowed.
  const dw = MAP_WIDTH * BG_SCALE;
  const dh = MAP_HEIGHT * BG_SCALE;
  const dx = (MAP_WIDTH - dw) / 2 + BG_OFFSET_X;
  const dy = (MAP_HEIGHT - dh) / 2 + BG_OFFSET_Y;
  ctx.drawImage(img, dx, dy, dw, dh);
  ctx.filter = 'none';

  // Warm amber wash to unify tone with the rest of the UI.
  ctx.fillStyle = 'rgba(50, 32, 18, 0.18)';
  ctx.fillRect(0, 0, MAP_WIDTH, MAP_HEIGHT);

  // Vignette darkening edges so attention pulls toward the center.
  const vig = ctx.createRadialGradient(
    MAP_WIDTH / 2, MAP_HEIGHT / 2, MAP_WIDTH * 0.35,
    MAP_WIDTH / 2, MAP_HEIGHT / 2, MAP_WIDTH * 0.7,
  );
  vig.addColorStop(0, 'rgba(0, 0, 0, 0)');
  vig.addColorStop(1, 'rgba(10, 8, 6, 0.50)');
  ctx.fillStyle = vig;
  ctx.fillRect(0, 0, MAP_WIDTH, MAP_HEIGHT);

  ctx.restore();
}

/**
 * Draw a small walled-city icon: shadow + walls + crenellations + banner.
 * The banner takes the force color. Selected cities get a gold pulse ring.
 */
/**
 * RTK14-style minimal city marker: a small force-colored disc with thin
 * dark outline. No castle sprite, no flag, no merlons — keeps the painted
 * map readable and avoids visual clutter when many cities cluster.
 */
function drawWalledCity(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  color: string,
  isSelected: boolean,
  isOwned: boolean,
  scale: number = 1,
) {
  const r = 5 * scale;  // small disc (was 9px walled-city sprite)

  if (isSelected) {
    const pulse = 1 + Math.sin(Date.now() / 350) * 0.18;
    ctx.beginPath();
    ctx.arc(cx, cy, (r + 5) * pulse, 0, Math.PI * 2);
    ctx.strokeStyle = '#d4a84a';
    ctx.lineWidth = 1.8;
    ctx.stroke();
  }

  // Soft shadow drop for depth on busy backgrounds
  ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
  ctx.beginPath();
  ctx.arc(cx + 0.8, cy + 0.8, r, 0, Math.PI * 2);
  ctx.fill();

  // Force-colored disc (neutral cities just slightly muted)
  ctx.fillStyle = isOwned ? color : '#5a4530';
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();

  // Thin dark outline
  ctx.strokeStyle = '#1a1410';
  ctx.lineWidth = 1.1;
  ctx.stroke();

  // Inner highlight ring for owned cities — subtle 3D pop
  if (isOwned) {
    ctx.beginPath();
    ctx.arc(cx, cy, r - 1.5, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
    ctx.lineWidth = 0.8;
    ctx.stroke();
  }
}

function drawPolygon(
  ctx: CanvasRenderingContext2D,
  points: Array<[number, number]>,
  close: boolean,
) {
  if (points.length === 0) return;
  ctx.beginPath();
  ctx.moveTo(points[0][0], points[0][1]);
  for (let i = 1; i < points.length; i++) {
    ctx.lineTo(points[i][0], points[i][1]);
  }
  if (close) ctx.closePath();
}

function drawCompassRose(ctx: CanvasRenderingContext2D, x: number, y: number) {
  const r = 30;
  // Outer ring
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.strokeStyle = 'rgba(212, 168, 74, 0.5)';
  ctx.lineWidth = 1.2;
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(x, y, r - 4, 0, Math.PI * 2);
  ctx.stroke();
  // Four-point star
  const starColor = 'rgba(212, 168, 74, 0.75)';
  ctx.fillStyle = starColor;
  ctx.beginPath();
  ctx.moveTo(x, y - r + 2);
  ctx.lineTo(x + 5, y);
  ctx.lineTo(x, y + r - 2);
  ctx.lineTo(x - 5, y);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(x + r - 2, y);
  ctx.lineTo(x, y + 5);
  ctx.lineTo(x - r + 2, y);
  ctx.lineTo(x, y - 5);
  ctx.closePath();
  ctx.fill();
  // N S E W labels
  ctx.font = 'bold 10px "Songti SC", "Noto Serif SC", serif';
  ctx.fillStyle = 'rgba(232, 217, 176, 0.85)';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('北', x, y - r - 8);
  ctx.fillText('南', x, y + r + 8);
  ctx.fillText('東', x + r + 8, y);
  ctx.fillText('西', x - r - 8, y);
}

function drawBorder(ctx: CanvasRenderingContext2D) {
  // Inner gold border
  ctx.strokeStyle = 'rgba(212, 168, 74, 0.4)';
  ctx.lineWidth = 2;
  ctx.strokeRect(8, 8, MAP_WIDTH - 16, MAP_HEIGHT - 16);
  // Corner flourishes
  const cornerLen = 30;
  ctx.strokeStyle = 'rgba(212, 168, 74, 0.8)';
  ctx.lineWidth = 3;
  const corners: Array<[number, number, number, number]> = [
    [4, 4, 4 + cornerLen, 4], [4, 4, 4, 4 + cornerLen],
    [MAP_WIDTH - 4, 4, MAP_WIDTH - 4 - cornerLen, 4], [MAP_WIDTH - 4, 4, MAP_WIDTH - 4, 4 + cornerLen],
    [4, MAP_HEIGHT - 4, 4 + cornerLen, MAP_HEIGHT - 4], [4, MAP_HEIGHT - 4, 4, MAP_HEIGHT - 4 - cornerLen],
    [MAP_WIDTH - 4, MAP_HEIGHT - 4, MAP_WIDTH - 4 - cornerLen, MAP_HEIGHT - 4], [MAP_WIDTH - 4, MAP_HEIGHT - 4, MAP_WIDTH - 4, MAP_HEIGHT - 4 - cornerLen],
  ];
  for (const [x1, y1, x2, y2] of corners) {
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
  }
}

function drawRiver(
  ctx: CanvasRenderingContext2D,
  points: Array<[number, number]>,
  color: string,
  width: number,
) {
  if (points.length < 2) return;
  ctx.beginPath();
  ctx.moveTo(points[0][0], points[0][1]);
  for (let i = 1; i < points.length - 1; i++) {
    const [cx, cy] = points[i];
    const [nx, ny] = points[i + 1];
    const mx = (cx + nx) / 2;
    const my = (cy + ny) / 2;
    ctx.quadraticCurveTo(cx, cy, mx, my);
  }
  const last = points[points.length - 1];
  ctx.lineTo(last[0], last[1]);
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.lineCap = 'round';
  ctx.stroke();
}

/** Animated poly-line route through territory waypoints (Phase 3b). */
function drawRoutePolyline(
  ctx: CanvasRenderingContext2D,
  route: Array<{ x: number; y: number }>,
  color: string,
) {
  if (route.length < 2) return;
  ctx.save();
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = 2.5;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.shadowColor = color;
  ctx.shadowBlur = 6;
  // Animated dashes so the route reads as a moving column.
  const phase = (Date.now() / 70) % 14;
  ctx.setLineDash([7, 7]);
  ctx.lineDashOffset = -phase;
  ctx.beginPath();
  ctx.moveTo(route[0].x, route[0].y);
  for (let i = 1; i < route.length; i++) ctx.lineTo(route[i].x, route[i].y);
  ctx.stroke();
  ctx.setLineDash([]);
  // Arrowhead at the destination end.
  const last = route[route.length - 1];
  const prev = route[route.length - 2];
  const dx = last.x - prev.x;
  const dy = last.y - prev.y;
  const len = Math.hypot(dx, dy) || 1;
  const ux = dx / len, uy = dy / len;
  const tipX = last.x - ux * 10;
  const tipY = last.y - uy * 10;
  const headSize = 9;
  ctx.beginPath();
  ctx.moveTo(tipX, tipY);
  ctx.lineTo(tipX - ux * headSize + uy * headSize * 0.5,
             tipY - uy * headSize - ux * headSize * 0.5);
  ctx.lineTo(tipX - ux * headSize - uy * headSize * 0.5,
             tipY - uy * headSize + ux * headSize * 0.5);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

/** Highlight the hex cell an army currently occupies (Phase 格子走). */
function drawOccupiedHex(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  color: string,
) {
  const c = hexCorners(cx, cy);
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(c[0][0], c[0][1]);
  for (let i = 1; i < 6; i++) ctx.lineTo(c[i][0], c[i][1]);
  ctx.closePath();
  // Pulsing fill + bright rim so the occupied cell pops.
  const pulse = 0.18 + 0.10 * (0.5 + 0.5 * Math.sin(Date.now() / 350));
  ctx.globalAlpha = pulse;
  ctx.fillStyle = color;
  ctx.fill();
  ctx.globalAlpha = 0.95;
  ctx.lineWidth = 2;
  ctx.lineJoin = 'round';
  ctx.strokeStyle = color;
  ctx.shadowColor = color;
  ctx.shadowBlur = 8;
  ctx.stroke();
  ctx.restore();
}

/** In-transit army marker: pennant on a pole with commander + troop label.
 *  When `holding`, the column is dug in — draw a small tented camp with a
 *  banner instead of the marching pennant. */
function drawMarchUnit(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  color: string,
  commanderName: string,
  troops: number,
  seasonsRemaining: number,
  totalSeasons: number,
  unitTag: string,
  holding: boolean = false,
) {
  ctx.save();
  // Marching columns bob; a dug-in camp sits still.
  const bob = holding ? 0 : Math.sin(Date.now() / 300) * 0.6;
  const cy = y + bob;

  if (holding) {
    // ── Field camp: two canvas tents + a centre banner pole/flag. ──
    const tent = (tx: number, baseY: number, w: number, h: number, fill: string) => {
      ctx.beginPath();
      ctx.moveTo(tx, baseY - h);
      ctx.lineTo(tx + w, baseY);
      ctx.lineTo(tx - w, baseY);
      ctx.closePath();
      ctx.fillStyle = fill;
      ctx.fill();
      ctx.strokeStyle = 'rgba(0,0,0,0.55)';
      ctx.lineWidth = 1;
      ctx.stroke();
    };
    tent(x - 6, cy + 6, 4.5, 7, '#c4b187');
    tent(x + 6, cy + 6, 4.5, 7, '#c4b187');
    tent(x, cy + 7, 5.5, 9, '#d8c79a');
    // Banner pole + flag in the force colour.
    ctx.strokeStyle = '#3a2818';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(x, cy + 7);
    ctx.lineTo(x, cy - 12);
    ctx.stroke();
    ctx.fillStyle = color;
    ctx.strokeStyle = 'rgba(0,0,0,0.6)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x, cy - 12);
    ctx.lineTo(x + 10, cy - 9.5);
    ctx.lineTo(x, cy - 7);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    // Unit-type glyph badge at the flag root.
    ctx.fillStyle = '#1a120a';
    ctx.font = 'bold 7px "Songti SC", serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(unitTag, x, cy - 9.5);
  } else {
  // Banner pole
  ctx.strokeStyle = '#3a2818';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(x, cy + 7);
  ctx.lineTo(x, cy - 11);
  ctx.stroke();

  // Pennant
  ctx.fillStyle = color;
  ctx.strokeStyle = 'rgba(0,0,0,0.6)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(x, cy - 11);
  ctx.lineTo(x + 11, cy - 8);
  ctx.lineTo(x, cy - 5);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Round base showing the force color, with the unit-type glyph on it.
  ctx.fillStyle = color;
  ctx.strokeStyle = '#000';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(x, cy + 4, 6, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#1a120a';
  ctx.font = 'bold 8px "Songti SC", serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(unitTag, x, cy + 4.5);
  }

  // Commander name + troop count, stacked below the marker
  ctx.font = 'bold 10px "Ma Shan Zheng", "Songti SC", "Noto Serif SC", serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.strokeStyle = 'rgba(0,0,0,0.85)';
  ctx.lineWidth = 3;
  ctx.lineJoin = 'round';
  ctx.fillStyle = '#ffe9a8';
  ctx.strokeText(commanderName, x, cy + 11);
  ctx.fillText(commanderName, x, cy + 11);

  ctx.font = '9px ui-monospace, monospace';
  const troopLabel = troops >= 1000 ? `${(troops / 1000).toFixed(1)}k` : `${troops}`;
  // Append ETA for multi-season marches so the player can read remaining seasons.
  const eta = holding ? '  駐守' : totalSeasons > 1 ? `  ${seasonsRemaining}/${totalSeasons}季` : '';
  const fullLabel = `${troopLabel}${eta}`;
  ctx.fillStyle = '#f0e0b0';
  ctx.strokeText(fullLabel, x, cy + 23);
  ctx.fillText(fullLabel, x, cy + 23);
  ctx.restore();
}


function hitTestCity(
  x: number,
  y: number,
  cities: Record<EntityId, City>,
): EntityId | null {
  for (const city of Object.values(cities)) {
    const dx = city.coords.x - x;
    const dy = city.coords.y - y;
    if (dx * dx + dy * dy <= CITY_RADIUS * CITY_RADIUS + 30) {
      return city.id;
    }
  }
  return null;
}

// ──────────────────────────────────────────────────────────────────────
// RTK13PK-style enhancements
// ──────────────────────────────────────────────────────────────────────

/** Deterministic hash → float in [0, 1) from a string. */
function hashStr(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return ((h >>> 0) % 10000) / 10000;
}

/** Province color tints — soft radial blobs per province, behind everything. */
function drawProvinceTints(
  ctx: CanvasRenderingContext2D,
  cities: Record<EntityId, City>,
) {
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  for (const p of PROVINCES) {
    const pts = p.cityIds
      .map((cid) => cities[cid])
      .filter((c): c is City => !!c)
      .map((c) => c.coords);
    if (pts.length === 0) continue;
    for (const pt of pts) {
      const grad = ctx.createRadialGradient(pt.x, pt.y, 0, pt.x, pt.y, 65);
      grad.addColorStop(0, p.color + '22');
      grad.addColorStop(1, p.color + '00');
      ctx.fillStyle = grad;
      ctx.fillRect(pt.x - 65, pt.y - 65, 130, 130);
    }
  }
  ctx.restore();
}

/** Curved road between two cities — deterministic perpendicular offset. */
function drawCurvedRoad(
  ctx: CanvasRenderingContext2D,
  x1: number, y1: number,
  x2: number, y2: number,
  seed: string,
) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const len = Math.hypot(dx, dy);
  if (len < 1) return;
  // Perpendicular direction
  const px = -dy / len;
  const py = dx / len;
  // Deterministic curve magnitude (10–25% of length, signed by hash)
  const h = hashStr(seed);
  const curveSign = h < 0.5 ? -1 : 1;
  const curveAmt = (0.10 + (h % 0.15)) * len * curveSign;
  const mx = (x1 + x2) / 2 + px * curveAmt;
  const my = (y1 + y2) / 2 + py * curveAmt;

  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.quadraticCurveTo(mx, my, x2, y2);
  ctx.stroke();
}

/** Capital seal — small red lacquer ◆ stamp. */
function drawCapitalSeal(ctx: CanvasRenderingContext2D, x: number, y: number) {
  ctx.save();
  ctx.translate(x, y);
  // Outer red square (rotated 45°)
  ctx.rotate(Math.PI / 4);
  ctx.fillStyle = '#a8222c';
  ctx.strokeStyle = '#1a1410';
  ctx.lineWidth = 0.8;
  ctx.fillRect(-5, -5, 10, 10);
  ctx.strokeRect(-5, -5, 10, 10);
  ctx.rotate(-Math.PI / 4);
  // Single character "都" (capital) — too small to read but conveys the idea
  ctx.font = 'bold 7px "Songti SC", serif';
  ctx.fillStyle = '#f4e0c0';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('都', 0, 0);
  ctx.restore();
}

/** Calligraphy-style city label with stronger shadow. */
function drawCalligraphyLabel(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number, y: number,
  size: number,
  color: string,
) {
  ctx.font = `bold ${size}px "Ma Shan Zheng", "Songti SC", "Noto Serif SC", serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  // Heavy outline
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.85)';
  ctx.lineWidth = 3;
  ctx.lineJoin = 'round';
  ctx.strokeText(text, x, y);
  // Inner color
  ctx.fillStyle = color;
  ctx.fillText(text, x, y);
}

/** Ambient terrain glyphs — tiny icons placed near each city based on terrain. */
function drawTerrainGlyphs(
  ctx: CanvasRenderingContext2D,
  cities: Record<EntityId, City>,
) {
  ctx.save();
  for (const city of Object.values(cities)) {
    const t = city.terrain;
    if (!t || t === 'plain') continue;
    // Pick deterministic offset around the city
    const h = hashStr(city.id);
    const angle = h * Math.PI * 2;
    const dist = 22 + h * 8;
    const gx = city.coords.x + Math.cos(angle) * dist;
    const gy = city.coords.y + Math.sin(angle) * dist;
    drawTerrainGlyph(ctx, gx, gy, t);
  }
  ctx.restore();
}

function drawTerrainGlyph(
  ctx: CanvasRenderingContext2D,
  x: number, y: number,
  terrain: NonNullable<City['terrain']>,
) {
  ctx.save();
  ctx.globalAlpha = 0.55;
  ctx.lineWidth = 1;
  switch (terrain) {
    case 'mountain': {
      // Two triangles + snow tip
      ctx.fillStyle = '#5a4530';
      ctx.strokeStyle = '#7a5a3a';
      ctx.beginPath();
      ctx.moveTo(x - 5, y + 3);
      ctx.lineTo(x - 1, y - 4);
      ctx.lineTo(x + 3, y + 3);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(x + 1, y + 3);
      ctx.lineTo(x + 4, y - 2);
      ctx.lineTo(x + 7, y + 3);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = 'rgba(232, 217, 176, 0.6)';
      ctx.beginPath();
      ctx.moveTo(x - 2, y - 2);
      ctx.lineTo(x - 1, y - 4);
      ctx.lineTo(x, y - 2);
      ctx.fill();
      break;
    }
    case 'forest': {
      // Three small tree shapes
      ctx.fillStyle = '#3a5a3a';
      ctx.strokeStyle = '#5a7a5a';
      for (const dx of [-4, 0, 4]) {
        ctx.beginPath();
        ctx.arc(x + dx, y - 1, 2.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        // Trunk
        ctx.fillStyle = '#3a2d20';
        ctx.fillRect(x + dx - 0.5, y + 1, 1, 2);
        ctx.fillStyle = '#3a5a3a';
      }
      break;
    }
    case 'water': {
      // Wave glyph ~~
      ctx.strokeStyle = '#5a8aa8';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(x - 5, y);
      ctx.quadraticCurveTo(x - 2.5, y - 3, x, y);
      ctx.quadraticCurveTo(x + 2.5, y + 3, x + 5, y);
      ctx.stroke();
      break;
    }
    case 'desert': {
      // Dune curve + dots
      ctx.fillStyle = '#b89048';
      ctx.strokeStyle = '#c19a3b';
      ctx.beginPath();
      ctx.moveTo(x - 5, y + 2);
      ctx.quadraticCurveTo(x, y - 3, x + 5, y + 2);
      ctx.lineTo(x - 5, y + 2);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = 'rgba(232, 217, 176, 0.5)';
      ctx.fillRect(x - 1, y + 3, 1, 1);
      ctx.fillRect(x + 2, y + 3, 1, 1);
      break;
    }
    case 'wetland': {
      // Cattails / reeds
      ctx.strokeStyle = '#5a8a7a';
      ctx.fillStyle = '#5a8a7a';
      ctx.lineWidth = 1;
      for (const dx of [-3, 0, 3]) {
        ctx.beginPath();
        ctx.moveTo(x + dx, y + 3);
        ctx.lineTo(x + dx, y - 4);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(x + dx, y - 4, 1.2, 0, Math.PI * 2);
        ctx.fill();
      }
      break;
    }
    case 'pass': {
      // Gate / fortress glyph ⛩
      ctx.fillStyle = '#a8442e';
      ctx.strokeStyle = '#5a2a1c';
      ctx.fillRect(x - 4, y - 3, 8, 1.5);
      ctx.strokeRect(x - 4, y - 3, 8, 1.5);
      ctx.fillRect(x - 4, y - 1, 2, 4);
      ctx.fillRect(x + 2, y - 1, 2, 4);
      ctx.strokeRect(x - 4, y - 1, 2, 4);
      ctx.strokeRect(x + 2, y - 1, 2, 4);
      break;
    }
  }
  ctx.restore();
}

/** Subtle full-canvas tint by season — warms in autumn, chills in winter. */
function drawSeasonTint(
  ctx: CanvasRenderingContext2D,
  season: GameDate['season'],
) {
  let color: string;
  switch (season) {
    case 'spring': color = 'rgba(255, 200, 220, 0.04)'; break; // very faint pink
    case 'summer': color = 'rgba(255, 220, 130, 0.05)'; break; // warm gold
    case 'autumn': color = 'rgba(212, 130, 60, 0.07)';  break; // amber
    case 'winter': color = 'rgba(140, 170, 220, 0.08)'; break; // cool blue
  }
  ctx.save();
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, MAP_WIDTH, MAP_HEIGHT);
  ctx.restore();
}

/** Drifting cloud shadows — slow horizontal movement. */
const CLOUD_SHADOWS: Array<{ x: number; y: number; w: number; h: number; speed: number }> = [
  { x: 120, y: 200, w: 180, h: 80, speed: 0.04 },
  { x: 500, y: 380, w: 220, h: 90, speed: 0.03 },
  { x: 780, y: 280, w: 160, h: 70, speed: 0.05 },
  { x: 300, y: 540, w: 200, h: 80, speed: 0.035 },
  { x: 700, y: 600, w: 180, h: 70, speed: 0.045 },
];
function drawCloudShadows(ctx: CanvasRenderingContext2D) {
  ctx.save();
  ctx.fillStyle = 'rgba(20, 14, 10, 0.07)';
  const dt = Date.now() / 1000;
  for (const c of CLOUD_SHADOWS) {
    const x = ((c.x + dt * c.speed * 60) % (MAP_WIDTH + c.w)) - c.w;
    ctx.beginPath();
    ctx.ellipse(x, c.y, c.w, c.h, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

// Season particle state (mutable so particles persist across renders).
type Particle = { x: number; y: number; vx: number; vy: number; size: number; life: number };
const SEASON_PARTICLES: Record<GameDate['season'], Particle[]> = {
  spring: [],
  summer: [],
  autumn: [],
  winter: [],
};
let lastParticleSeason: GameDate['season'] | null = null;

function drawSeasonParticles(
  ctx: CanvasRenderingContext2D,
  season: GameDate['season'],
) {
  // Reset particles when season changes
  if (lastParticleSeason !== season) {
    for (const k of Object.keys(SEASON_PARTICLES) as GameDate['season'][]) {
      SEASON_PARTICLES[k] = [];
    }
    lastParticleSeason = season;
  }
  const arr = SEASON_PARTICLES[season];

  const config = (() => {
    switch (season) {
      case 'spring': return { color: 'rgba(232, 188, 210, 0.7)', maxCount: 35, sizeMin: 2, sizeMax: 3.5, vxRange: 0.6, vyMin: 0.3, vyMax: 0.8, shape: 'petal' as const };
      case 'summer': return { color: 'rgba(200, 200, 100, 0.25)', maxCount: 14, sizeMin: 1, sizeMax: 1.5, vxRange: 0.1, vyMin: -0.05, vyMax: 0.05, shape: 'dot' as const };
      case 'autumn': return { color: 'rgba(212, 130, 60, 0.7)', maxCount: 30, sizeMin: 2, sizeMax: 3, vxRange: 0.5, vyMin: 0.4, vyMax: 0.9, shape: 'leaf' as const };
      case 'winter': return { color: 'rgba(240, 245, 255, 0.85)', maxCount: 70, sizeMin: 1, sizeMax: 2.5, vxRange: 0.3, vyMin: 0.4, vyMax: 1.1, shape: 'snow' as const };
    }
  })();

  // Spawn new particles up to max
  while (arr.length < config.maxCount) {
    arr.push({
      x: Math.random() * MAP_WIDTH,
      y: -10 - Math.random() * 30,
      vx: (Math.random() - 0.5) * config.vxRange * 2,
      vy: config.vyMin + Math.random() * (config.vyMax - config.vyMin),
      size: config.sizeMin + Math.random() * (config.sizeMax - config.sizeMin),
      life: 1,
    });
  }

  // Step + draw
  ctx.save();
  ctx.fillStyle = config.color;
  for (const p of arr) {
    p.x += p.vx;
    p.y += p.vy;
    if (p.y > MAP_HEIGHT + 10) {
      p.x = Math.random() * MAP_WIDTH;
      p.y = -10;
      p.vx = (Math.random() - 0.5) * config.vxRange * 2;
      p.vy = config.vyMin + Math.random() * (config.vyMax - config.vyMin);
    }
    if (config.shape === 'snow' || config.shape === 'dot') {
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    } else if (config.shape === 'petal') {
      // Cherry petal — small ellipse rotated by drift
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.vx * 2);
      ctx.beginPath();
      ctx.ellipse(0, 0, p.size, p.size * 0.5, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    } else {
      // Leaf — small triangle
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.vx * 3);
      ctx.beginPath();
      ctx.moveTo(0, -p.size);
      ctx.lineTo(p.size * 0.8, p.size);
      ctx.lineTo(-p.size * 0.8, p.size);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }
  }
  ctx.restore();
}

// ── Burning city: animated flame glyph on cities that fell this/last turn ──
function drawBurningCities(
  ctx: CanvasRenderingContext2D,
  cities: Record<EntityId, City>,
  burning: Array<{ cityId: EntityId; seasonsLeft: number }>,
) {
  if (burning.length === 0) return;
  const t = Date.now() / 180;
  ctx.save();
  for (const b of burning) {
    const city = cities[b.cityId];
    if (!city) continue;
    const cx = city.coords.x;
    const cy = city.coords.y;
    const flicker = 1 + Math.sin(t + b.cityId.length) * 0.18;
    // Smoke plume
    ctx.globalAlpha = 0.35;
    ctx.fillStyle = '#1a1410';
    ctx.beginPath();
    ctx.ellipse(cx + Math.sin(t * 0.4) * 1.5, cy - 16, 5, 9, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(cx + Math.sin(t * 0.3 + 1) * 2, cy - 24, 7, 12, 0, 0, Math.PI * 2);
    ctx.fill();
    // Flame core — orange/red triangle
    ctx.globalAlpha = 0.85 * flicker;
    const grad = ctx.createRadialGradient(cx, cy - 4, 1, cx, cy - 4, 9);
    grad.addColorStop(0, '#ffd060');
    grad.addColorStop(0.5, '#e8602a');
    grad.addColorStop(1, '#7a1a08');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(cx, cy - 12 * flicker);
    ctx.quadraticCurveTo(cx + 5, cy - 6, cx + 3, cy - 1);
    ctx.quadraticCurveTo(cx, cy - 4, cx - 3, cy - 1);
    ctx.quadraticCurveTo(cx - 5, cy - 6, cx, cy - 12 * flicker);
    ctx.closePath();
    ctx.fill();
    // Spark sparkles
    ctx.globalAlpha = 0.6;
    ctx.fillStyle = '#ffe6a8';
    for (let i = 0; i < 3; i++) {
      const sx = cx + Math.sin(t * 0.6 + i * 2) * 4;
      const sy = cy - 12 - Math.abs(Math.sin(t * 0.5 + i)) * 8;
      ctx.beginPath();
      ctx.arc(sx, sy, 0.6, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.restore();
}

// ── Weather overlay: rain streaks, snow flakes, or strong-wind dust ──
function drawWeatherOverlay(ctx: CanvasRenderingContext2D, weather: Weather) {
  if (weather.kind === 'clear' || weather.kind === 'drought') return;
  const W = 1000, H = 720;
  const t = Date.now() / 100;
  ctx.save();
  if (weather.kind === 'rain') {
    ctx.strokeStyle = 'rgba(120, 150, 200, 0.35)';
    ctx.lineWidth = 0.8;
    // Wind tilt — east wind => streaks tilted SW→NE
    const dx = windOffset(weather, 4);
    const dy = 14;
    for (let i = 0; i < 90; i++) {
      const seed = (i * 9301 + 7) % 9999;
      const x = ((seed * 13 + t * 6) % W);
      const y = ((seed * 17 + t * 10) % H);
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + dx, y + dy);
      ctx.stroke();
    }
  } else if (weather.kind === 'snow') {
    ctx.fillStyle = 'rgba(240, 240, 250, 0.6)';
    const dx = windOffset(weather, 1);
    for (let i = 0; i < 70; i++) {
      const seed = (i * 9301 + 49) % 9999;
      const x = ((seed * 11 + t * 3 + dx * t * 0.05) % W);
      const y = ((seed * 23 + t * 4) % H);
      ctx.beginPath();
      ctx.arc(x, y, 1.2, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (weather.kind === 'wind' && weather.windPower >= 2) {
    ctx.strokeStyle = 'rgba(200, 180, 130, 0.18)';
    ctx.lineWidth = 0.7;
    const dx = windOffset(weather, 18);
    for (let i = 0; i < 36; i++) {
      const seed = (i * 7919) % 9999;
      const x = ((seed * 5 + t * 8) % W);
      const y = ((seed * 13 + i * 19) % H);
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + dx, y - 1);
      ctx.stroke();
    }
  }
  ctx.restore();
}

function windOffset(w: Weather, mag: number): number {
  // Positive dx = moves right (east wind blows things east).
  // east wind comes FROM the east, so visually streaks move toward the WEST → negative dx.
  if (w.wind === 'east')  return -mag * w.windPower;
  if (w.wind === 'west')  return  mag * w.windPower;
  return 0;
}
