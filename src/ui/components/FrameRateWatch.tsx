import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';

/**
 * FPS 自適應 — watch the frame rate from inside a scene and tell the host to
 * shed weight once it stays down.
 *
 * Render quality is otherwise decided ONCE at module load (renderQuality.ts
 * auto/low/high), which cannot know that this particular save has three
 * hundred marching columns, or that the device has been throttled after
 * twenty minutes in the player's pocket. This is the runtime half of that:
 * degrade before the GPU gives out, rather than after.
 *
 * Deliberately ONE-WAY. Toggling effects back on the moment the average
 * recovers produces visible on/off flicker — and the frame budget that was
 * tight enough to trip this is usually tight again a second later. The host
 * keeps its degraded flag until the scene unmounts.
 *
 * Must be rendered INSIDE a <Canvas> (it hooks useFrame).
 */
export function FrameRateWatch({
  onDegrade,
  fpsFloor = 26,
  badSeconds = 3,
}: {
  /** Called once, when the frame rate has stayed under the floor. */
  onDegrade: () => void;
  /** Frames per second below which a sampled second counts as "bad". */
  fpsFloor?: number;
  /** Consecutive bad seconds required before degrading. */
  badSeconds?: number;
}) {
  const acc = useRef({ t: 0, n: 0, bad: 0, fired: false });
  useFrame((_, delta) => {
    const a = acc.current;
    if (a.fired) return;
    a.t += delta; a.n++;
    if (a.t >= 1) {
      const fps = a.n / a.t;
      a.bad = fps < fpsFloor ? a.bad + 1 : 0;
      a.t = 0; a.n = 0;
      if (a.bad >= badSeconds) { a.fired = true; onDegrade(); }
    }
  });
  return null;
}
