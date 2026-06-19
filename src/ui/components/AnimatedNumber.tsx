import { useEffect, useRef, useState, type CSSProperties } from 'react';

interface Props {
  value: number;
  /** Formatter for the (possibly fractional, mid-tween) display value. */
  format?: (v: number) => string;
  /** Flash green on an increase, red on a decrease, fading back. */
  flash?: boolean;
  durationMs?: number;
  style?: CSSProperties;
}

const reducedMotion = (): boolean =>
  typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

/**
 * A number that rolls from its previous value to the new one whenever it
 * changes (easeOutCubic, ~0.6s) instead of snapping — so resource changes read
 * as motion. Optionally flashes green/red by direction. Honours
 * prefers-reduced-motion (snaps, no flash).
 */
export function AnimatedNumber({ value, format = (v) => Math.round(v).toLocaleString(), flash, durationMs = 600, style }: Props) {
  const [display, setDisplay] = useState(value);
  const fromRef = useRef(value);
  const rafRef = useRef(0);
  const popRef = useRef(0);
  const [dir, setDir] = useState<-1 | 0 | 1>(0);
  // A quick scale-pop on change — only on flashing numbers, so the busy
  // per-city stats stay calm while the headline figures get a little life.
  const [pop, setPop] = useState(false);

  useEffect(() => {
    if (value === fromRef.current) return;
    if (reducedMotion()) { fromRef.current = value; setDisplay(value); return; }
    cancelAnimationFrame(rafRef.current);
    const from = fromRef.current;
    const to = value;
    setDir(to > from ? 1 : -1);
    if (flash) {
      setPop(true);
      window.clearTimeout(popRef.current);
      popRef.current = window.setTimeout(() => setPop(false), 190);
    }
    const start = performance.now();
    const tick = (now: number) => {
      // Clamp to [0,1] — the first rAF timestamp can read a hair before our
      // performance.now() start, which would make p (and the eased value) go
      // negative and briefly overshoot below `from`.
      const p = Math.min(1, Math.max(0, (now - start) / durationMs));
      const eased = 1 - Math.pow(1 - p, 3); // easeOutCubic
      const v = from + (to - from) * eased;
      fromRef.current = v;
      setDisplay(v);
      if (p < 1) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        fromRef.current = to;
        setDisplay(to);
        window.setTimeout(() => setDir(0), 450);
      }
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [value, durationMs, flash]);

  useEffect(() => () => window.clearTimeout(popRef.current), []);

  const color = flash && dir > 0 ? '#7ed68a' : flash && dir < 0 ? '#e2706a' : undefined;
  return (
    <span
      style={{
        ...style,
        color: color ?? style?.color,
        // inline-block so the pop transform can actually take (and animate both
        // ways); harmless for a numeric run.
        display: style?.display ?? 'inline-block',
        transform: pop ? 'scale(1.16)' : 'scale(1)',
        transition: 'color 0.5s ease, transform 0.19s cubic-bezier(0.34, 1.56, 0.64, 1)',
      }}
    >
      {format(display)}
    </span>
  );
}
