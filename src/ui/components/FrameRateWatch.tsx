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
 * ## 暖機期 — 別拿開場那幾秒當樣本(2026-07-30 修)
 *
 * 原本從第一幀就開始取樣,而一個 3D 場景**開頭幾秒必然最慢**:貼圖上傳、
 * 著色器編譯、幾百個網格建立、靜態合批第一次烘。大地圖實測開局是
 * 3.8 → 7.9 → 15.4 fps,而 `badSeconds = 3` 正好被這段打滿 —— 於是**後處理
 * 整棧在開局就被永久卸掉**(降級是單向的),玩家整局都看不到色調映射、
 * 四時之色與暗角,而那正是這批畫面工作的主體。
 *
 * 所以取樣從 `warmupSeconds` 之後才開始,這段時間**完全不計**:場景還沒蓋完
 * 的幀率不是這台機器的幀率,它只是「還在載入」。
 *
 * Must be rendered INSIDE a <Canvas> (it hooks useFrame).
 */
export function FrameRateWatch({
  onDegrade,
  fpsFloor = 26,
  badSeconds = 3,
  warmupSeconds = 6,
}: {
  /** Called once, when the frame rate has stayed under the floor. */
  onDegrade: () => void;
  /** Frames per second below which a sampled second counts as "bad". */
  fpsFloor?: number;
  /** Consecutive bad seconds required before degrading. */
  badSeconds?: number;
  /**
   * Seconds ignored entirely after mount — texture uploads, shader compiles
   * and the first batch bake all land here, and none of them say anything
   * about how this machine runs the scene once it is built.
   */
  warmupSeconds?: number;
}) {
  const acc = useRef({ warm: 0, t: 0, n: 0, bad: 0, fired: false });
  useFrame((_, delta) => {
    const a = acc.current;
    if (a.fired) return;
    if (a.warm < warmupSeconds) {
      // Clamp the per-frame contribution: one 2-second stall (a shader compile)
      // must not fast-forward through the whole warm-up.
      a.warm += Math.min(delta, 0.1);
      return;
    }
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
