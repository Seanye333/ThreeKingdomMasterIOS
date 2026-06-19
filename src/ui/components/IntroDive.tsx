// ─── Zoom-in transition ─────────────────────────────────────────────────
// On entering a city map or a battle board, the camera swoops down from high
// overhead (the vantage of the layer you came from) to the scene's normal
// framing — so descending through the layers feels like one continuous world.
// Lives inside a <Canvas>; disables orbit controls until the dive completes.

import { useLayoutEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

const REDUCED = typeof window !== 'undefined'
  && window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;

export function IntroDive({
  start, end, target, duration = 0.95, onDone, mode = 'in',
}: {
  start: [number, number, number];
  end: [number, number, number];
  target: [number, number, number];
  duration?: number;
  onDone?: () => void;
  /** 'in' swoops from `start` (high) down to `end`; 'out' rises from wherever
   *  the camera is now back up to `start` (then onDone unmounts the scene). */
  mode?: 'in' | 'out';
}) {
  const { camera } = useThree();
  const t = useRef(0);
  const done = useRef(false);
  const startV = useRef(new THREE.Vector3(...start));
  const endV = useRef(new THREE.Vector3(...end));
  const targetV = useRef(new THREE.Vector3(...target));
  const fromV = useRef(new THREE.Vector3());
  const toV = useRef(new THREE.Vector3());

  // Decide endpoints (and place the camera at the start) before the first paint.
  useLayoutEffect(() => {
    fromV.current.copy(mode === 'out' ? camera.position : startV.current);
    toV.current.copy(mode === 'out' ? startV.current : endV.current);
    if (REDUCED) {
      camera.position.copy(toV.current);
      camera.lookAt(targetV.current);
      done.current = true;
      onDone?.();
    } else {
      camera.position.copy(fromV.current);
      camera.lookAt(targetV.current);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useFrame((_, delta) => {
    if (done.current) return;
    t.current = Math.min(1, t.current + delta / duration);
    const e = mode === 'out' ? t.current * t.current : 1 - Math.pow(1 - t.current, 3);
    camera.position.lerpVectors(fromV.current, toV.current, e);
    camera.lookAt(targetV.current);
    if (t.current >= 1) {
      done.current = true;
      onDone?.();
    }
  });

  return null;
}
