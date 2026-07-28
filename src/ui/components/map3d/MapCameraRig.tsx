/** 鏡頭吊裝 — the strategic map's camera machinery, extracted verbatim from
 * StrategicMap3D.tsx (pure mechanical split): zoom-LOD tracking, the corner
 * minimap rig, and the imperative pan/zoom/fly controller (MapCamApi). */
import { createContext, useEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { PIXEL_TO_WORLD, MAP_W, MAP_D, pxToWorld, sampleTerrainHeight } from './shared';

export const MAP_FOV_DEG = 45;     // matches the <Canvas camera fov>
export const MAP_MAX_DIST =
  (Math.hypot(MAP_W / 2, MAP_D / 2) / Math.sin((MAP_FOV_DEG / 2) * Math.PI / 180)) * 1.15;

/* ─── 縮放分級 — one quantized camera height, two very different jobs.
 *
 * `far` is about LABELS: pulled right out, ~120 city name+bar pills are noise
 * and DOM cost.
 *
 * `mid` is about GEOMETRY, and it is the one that decides whether the map is
 * playable. Each city is a couple of dozen separate meshes (wall, gate tower,
 * pagoda storeys, corner towers, side halls, a ring of suburb huts), and the
 * map draws them for every city on the board. At the DEFAULT camera height of
 * MAP_D×0.9 ≈ 135 a large city measures **under four pixels across** — every
 * one of those meshes is a draw call spent on something nobody can see. The
 * profile said so plainly: 10,514 draw calls a frame at rest, ~30 FPS, with
 * the CPU sitting in renderBufferDirect/uniformMatrix4fv — the signature of
 * draw-call count, not triangle count (the whole map is only ~1.3M tris).
 *
 * So the tiers are gauged by what a city is WORTH at that height:
 *
 *   near (< 45)  city ≳ 11 px — you deliberately zoomed in; render it all
 *   mid  (45+)   city ≲ 11 px — silhouette only: wall, one pagoda, banner
 *   far  (220+)  labels start costing more than they inform
 *
 * The default view sits in `mid`, which is the point: the expensive tier is
 * the one you opt into, not the one you land in.
 */
export const ZoomLODCtx = createContext<'near' | 'mid' | 'far'>('near');
// Zoom gauged by camera HEIGHT (pan-independent — distance-from-origin flips
// erratically once you pan off-centre).
const LOD_FAR_DIST = 220;
const LOD_MID_DIST = 45;
export function ZoomLODTracker({ onChange }: { onChange: (lod: 'near' | 'mid' | 'far') => void }) {
  const { camera } = useThree();
  const last = useRef<'near' | 'mid' | 'far'>('near');
  useFrame(() => {
    // Hysteresis on both thresholds so detail doesn't strobe when the camera
    // drifts across a boundary — a rebuild of ~120 cities' meshes per flip
    // would cost far more than the detail is worth.
    const d = camera.position.y;
    const cur = last.current;
    const farOn = cur === 'far' ? LOD_FAR_DIST - 14 : LOD_FAR_DIST + 14;
    const midOn = cur === 'near' ? LOD_MID_DIST + 6 : LOD_MID_DIST - 6;
    const next: 'near' | 'mid' | 'far' = d > farOn ? 'far' : d > midOn ? 'mid' : 'near';
    if (next !== cur) {
      last.current = next;
      onChange(next);
    }
  });
  return null;
}

/** 迷你導航 — tracks the camera's view window for the corner minimap, and
 *  executes click-to-jump requests (camera keeps its current offset). */
export function MiniNavRig({ controlsRef, onView, jump }: {
  controlsRef: React.RefObject<{ target: THREE.Vector3; update: () => void } | null>;
  onView: (v: { cx: number; cy: number; span: number }) => void;
  jump: { px: number; py: number; seq: number } | null;
}) {
  const { camera } = useThree();
  const lastReport = useRef(0);
  const lastSeq = useRef(0);
  useFrame(({ clock }) => {
    const ctrl = controlsRef.current;
    if (jump && jump.seq !== lastSeq.current && ctrl) {
      lastSeq.current = jump.seq;
      const [wx, wz] = pxToWorld(jump.px, jump.py);
      const offset = camera.position.clone().sub(ctrl.target);
      ctrl.target.set(wx, sampleTerrainHeight(wx, wz), wz);
      camera.position.copy(ctrl.target).add(offset);
      ctrl.update();
    }
    if (clock.elapsedTime - lastReport.current < 0.25) return;
    lastReport.current = clock.elapsedTime;
    const tgt = ctrl?.target ?? new THREE.Vector3();
    const cx = (tgt.x + MAP_W / 2) / PIXEL_TO_WORLD;
    const cy = (tgt.z + MAP_D / 2) / PIXEL_TO_WORLD;
    const span = camera.position.distanceTo(tgt) * 0.9 / PIXEL_TO_WORLD;
    onView({ cx: Math.round(cx), cy: Math.round(cy), span: Math.round(span) });
  });
  return null;
}


const GROUND_UP = new THREE.Vector3(0, 1, 0);
export type CamApi = {
  zoomBy: (factor: number) => void;
  recenter: () => void;
  /** Fly to a ground point. dist = fixed focus distance (idle-jump); omit for
   *  the progressive "zoom in a notch" double-click behaviour. */
  flyTo: (wx: number, wz: number, dist?: number) => void;
};

/* ─── 鏡頭 API — the map's one camera controller. Publishes imperative
   zoom / recenter / flyTo for the DOM buttons & double-click, and each frame
   applies held keyboard / screen-edge panning, then clamps the look-at point
   to the map. All of it sits OUTSIDE OrbitControls but inside the Canvas. ── */
export function MapCamApi({ apiRef, controlsRef, panInputRef }: {
  apiRef: React.MutableRefObject<CamApi | null>;
  controlsRef: React.MutableRefObject<{ target: THREE.Vector3; update: () => void; enabled: boolean } | null>;
  panInputRef: React.MutableRefObject<{ x: number; z: number }>;
}) {
  const { camera } = useThree();
  // Active double-click fly — eased lerp of camera+target, owns the camera
  // until it settles.
  const fly = useRef<null | {
    t: number; dur: number;
    fromP: THREE.Vector3; toP: THREE.Vector3; fromT: THREE.Vector3; toT: THREE.Vector3;
  }>(null);

  useEffect(() => {
    apiRef.current = {
      // factor < 1 zooms in, > 1 zooms out — scales the camera→target distance,
      // clamped to OrbitControls' OWN live min/max (read off the instance, so a
      // battle's closer 0.9 floor is honoured and '+' never jumps backward).
      zoomBy: (factor) => {
        fly.current = null;
        const ctrl = controlsRef.current as unknown as
          ({ target: THREE.Vector3; update: () => void; minDistance?: number; maxDistance?: number } | null);
        if (!ctrl) return;
        const offset = camera.position.clone().sub(ctrl.target);
        const min = ctrl.minDistance ?? 3;
        const max = ctrl.maxDistance ?? MAP_MAX_DIST;
        const dist = THREE.MathUtils.clamp(offset.length() * factor, min, max);
        camera.position.copy(ctrl.target).add(offset.setLength(dist));
        ctrl.update();
      },
      // Snap back to the opening overview (map centre, default height/angle).
      recenter: () => {
        fly.current = null;
        const ctrl = controlsRef.current;
        if (!ctrl) return;
        ctrl.target.set(0, 0, 0);
        camera.position.set(0, MAP_D * 0.9, MAP_D * 0.7);
        ctrl.update();
      },
      // 雙擊飛鏡 — ease the camera over the double-clicked point and zoom in a
      // notch, keeping the current viewing direction so it never disorients.
      flyTo: (wx, wz, dist) => {
        const ctrl = controlsRef.current as unknown as
          ({ target: THREE.Vector3; update: () => void; minDistance?: number } | null);
        if (!ctrl) return;
        const toT = new THREE.Vector3(wx, sampleTerrainHeight(wx, wz), wz);
        const dir = camera.position.clone().sub(ctrl.target);
        const curDist = dir.length() || 1;
        dir.normalize();
        const min = ctrl.minDistance ?? 3;
        // dist given (idle-jump → consistent city view); else zoom in a notch.
        const want = dist ?? Math.min(curDist * 0.55, MAP_D * 0.5);
        const focusDist = THREE.MathUtils.clamp(want, min, MAP_MAX_DIST);
        const toP = toT.clone().add(dir.multiplyScalar(focusDist));
        fly.current = { t: 0, dur: 0.5, fromP: camera.position.clone(), toP, fromT: ctrl.target.clone(), toT };
      },
    };
    return () => { apiRef.current = null; };
  }, [camera, apiRef, controlsRef]);

  /** Reused pan vectors — see the allocation note in the pan branch below. */
  const panScratch = useRef({ fwd: new THREE.Vector3(), right: new THREE.Vector3() });

  useFrame((_, delta) => {
    const ctrl = controlsRef.current;
    if (!ctrl) return;
    // dt is clamped — a long stall (tab backgrounded) shouldn't teleport.
    const dt = Math.min(delta, 0.05);

    // 1) A double-click fly takes over the camera until it lands.
    const a = fly.current;
    if (a) {
      a.t = Math.min(1, a.t + dt / a.dur);
      const e = a.t < 0.5 ? 2 * a.t * a.t : 1 - Math.pow(-2 * a.t + 2, 2) / 2;
      camera.position.lerpVectors(a.fromP, a.toP, e);
      ctrl.target.lerpVectors(a.fromT, a.toT, e);
      ctrl.update();
      if (a.t >= 1) fly.current = null;
      return;
    }

    // 2) Held keyboard / screen-edge panning — glide target+camera across the
    //    ground plane, faster the further you're zoomed out.
    const inp = panInputRef.current;
    if (inp && (inp.x !== 0 || inp.z !== 0)) {
      const speed = camera.position.distanceTo(ctrl.target) * 0.6 * dt;
      // 每幀不再配置 — panning holds for as long as a key is down, so these two
      // vectors were being minted and discarded 60× a second for the whole
      // gesture. Scratch values, never read across frames.
      const fwd = panScratch.current.fwd;
      camera.getWorldDirection(fwd);
      fwd.y = 0;
      if (fwd.lengthSq() > 1e-6) {
        fwd.normalize();
        const right = panScratch.current.right.crossVectors(fwd, GROUND_UP).normalize();
        const move = right.multiplyScalar(inp.x * speed).add(fwd.multiplyScalar(inp.z * speed));
        camera.position.add(move);
        ctrl.target.add(move);
        ctrl.update();
      }
    }

    // 3) 平移邊界 — keep the look-at point inside the map so a pan can't drag
    //    the land off into open water/sky. A pan moves target AND camera in
    //    lockstep, so we shift the camera by the same delta we clamp off the
    //    target — the view simply stops dead at the coastline. Target can still
    //    reach the very edge, so every coastal city can sit centre-screen.
    const t = ctrl.target;
    const cx = THREE.MathUtils.clamp(t.x, -MAP_W / 2, MAP_W / 2);
    const cz = THREE.MathUtils.clamp(t.z, -MAP_D / 2, MAP_D / 2);
    if (cx !== t.x || cz !== t.z) {
      camera.position.x += cx - t.x;
      camera.position.z += cz - t.z;
      t.x = cx;
      t.z = cz;
    }
  });
  return null;
}
