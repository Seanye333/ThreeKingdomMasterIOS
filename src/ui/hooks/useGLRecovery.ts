import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * WebGL 上下文丟失恢復 — keep a 3D scene from going permanently black.
 *
 * Under GPU-memory pressure the browser can drop the WebGL context. three.js
 * calls preventDefault() so the browser *may* restore it, and the render loop
 * repaints once it does. But on a hard out-of-memory loss — which is exactly
 * what a long session in iOS WKWebView produces — 'webglcontextrestored' may
 * never fire, and the canvas stays black until the app is killed.
 *
 * This hook closes that hole: if no restore arrives within a grace window, the
 * epoch bumps, the caller keys its <Canvas> off it, and React mounts a brand
 * new GL context. Module-cached textures simply re-upload into the fresh
 * renderer, so nothing else has to know it happened.
 *
 * Usage:
 *   const { glEpoch, attachGLRecovery } = useGLRecovery('CityMapScreen3D');
 *   <Canvas key={glEpoch} onCreated={({ gl }) => attachGLRecovery(gl)}>
 *
 * `tag` only names the scene in the console warning.
 */
export function useGLRecovery(tag: string, graceMs = 1800): {
  glEpoch: number;
  attachGLRecovery: (gl: { domElement: HTMLCanvasElement }) => void;
} {
  const [glEpoch, setGlEpoch] = useState(0);
  const restoreTimer = useRef<number | null>(null);

  useEffect(() => () => {
    if (restoreTimer.current != null) window.clearTimeout(restoreTimer.current);
  }, []);

  const attachGLRecovery = useCallback((gl: { domElement: HTMLCanvasElement }) => {
    const canvas = gl.domElement;
    const onLost = (e: Event) => {
      e.preventDefault();                 // ask the browser to attempt a restore
      if (restoreTimer.current != null) return;
      // A transient loss (tab switch, brief pressure) comes back on its own.
      // If it doesn't, the context is dead for good — hard-remount.
      restoreTimer.current = window.setTimeout(() => {
        restoreTimer.current = null;
        console.warn(`[${tag}] WebGL context not restored — remounting canvas`);
        setGlEpoch((n) => n + 1);
      }, graceMs);
    };
    const onRestored = () => {
      if (restoreTimer.current != null) {
        window.clearTimeout(restoreTimer.current);
        restoreTimer.current = null;
      }
    };
    canvas.addEventListener('webglcontextlost', onLost as EventListener, false);
    canvas.addEventListener('webglcontextrestored', onRestored as EventListener, false);
  }, [tag, graceMs]);

  return { glEpoch, attachGLRecovery };
}
