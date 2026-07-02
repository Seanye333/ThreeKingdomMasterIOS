import { useEffect, useRef, useState } from 'react';

/**
 * 幀率計 — a featherweight FPS readout for performance work. Enabled by
 * `?fps=1` in the URL or localStorage 'tkm-fps' = '1' (Settings toggle).
 * Pure rAF sampling — no three.js hooks, so it works over every screen
 * (map, battle, city) and costs nothing when hidden.
 */
export function FpsMeter() {
  const [on] = useState(() =>
    typeof window !== 'undefined' &&
    (new URLSearchParams(window.location.search).get('fps') === '1' ||
      localStorage.getItem('tkm-fps') === '1'));
  const [fps, setFps] = useState(0);
  const frames = useRef(0);
  const last = useRef(performance.now());
  useEffect(() => {
    if (!on) return;
    let raf = 0;
    const loop = () => {
      frames.current++;
      const now = performance.now();
      if (now - last.current >= 500) {
        setFps(Math.round((frames.current * 1000) / (now - last.current)));
        frames.current = 0;
        last.current = now;
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [on]);
  if (!on) return null;
  const color = fps >= 50 ? '#7ed68a' : fps >= 30 ? '#e8c15a' : '#ff7a5e';
  return (
    <div style={{
      position: 'fixed', top: 'calc(0.4rem + var(--tkm-safe-top))', left: '50%', transform: 'translateX(-50%)',
      zIndex: 2000, pointerEvents: 'none',
      background: 'rgba(10, 14, 18, 0.75)', border: `1px solid ${color}`, borderRadius: 5,
      padding: '0.05rem 0.45rem', color, fontFamily: 'ui-monospace, monospace', fontSize: '0.72rem',
    }}>{fps} fps</div>
  );
}
