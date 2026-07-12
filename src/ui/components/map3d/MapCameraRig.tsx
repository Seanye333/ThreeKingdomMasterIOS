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

/* ─── 標籤分級 — when the camera is pulled far out, the ~120 city name+bar
   labels turn into noise (and DOM cost). A tiny in-canvas tracker quantizes
   camera distance into near/far; far hides labels of ordinary cities, keeping
   capitals and the selection readable. */
export const ZoomLODCtx = createContext<'near' | 'far'>('near');
// Zoom gauged by camera HEIGHT (pan-independent — distance-from-origin flips
// erratically once you pan off-centre). City names show below this height.
const LOD_FAR_DIST = 220;
export function ZoomLODTracker({ onChange }: { onChange: (lod: 'near' | 'far') => void }) {
  const { camera } = useThree();
  const last = useRef<'near' | 'far'>('near');
  useFrame(() => {
    // Camera height = clean zoom proxy (independent of panning). Wide
    // hysteresis band so labels don't flicker right on the threshold.
    const d = camera.position.y;
    const next = last.current === 'far'
      ? (d < LOD_FAR_DIST - 14 ? 'near' : 'far')
      : (d > LOD_FAR_DIST + 14 ? 'far' : 'near');
    if (next !== last.current) {
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
      const fwd = new THREE.Vector3();
      camera.getWorldDirection(fwd);
      fwd.y = 0;
      if (fwd.lengthSq() > 1e-6) {
        fwd.normalize();
        const right = new THREE.Vector3().crossVectors(fwd, GROUND_UP).normalize();
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
