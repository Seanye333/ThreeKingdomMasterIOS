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
 * ## ⚠ 已知問題:它拿開場那幾秒當樣本(2026-07-30 查明,**刻意尚未修**)
 *
 * 取樣從第一幀就開始,而一個 3D 場景**開頭幾秒必然最慢** —— 貼圖上傳、著色器
 * 編譯、幾百個網格建立、靜態合批第一次烘。大地圖實測開局是 3.8 → 7.9 →
 * 15.4 fps,而 `badSeconds = 3` 正好被這段打滿,於是**後處理整棧在開局就被
 * 永久卸掉**(降級是單向的),玩家整局都看不到色調映射、光暈、四時之色與暗角。
 *
 * 加一段暖機期(前 6 秒不計)試過,單看它是對的 —— 但它會連鎖出兩件事:
 * 大地圖預設視角的 draw call 從約 6,000 升到 **10,363**(預算 9,000),而且
 * 後處理一旦真的留下來,地圖上會冒出成片純黑的六角格(見 GUIDE「大地圖的
 * 後處理從來沒有顯示過」一節,成因未明)。也就是說這三件事是同一個結:要修
 * 就得連黑格的成因一起查清楚,只上暖機期會讓畫面比現在更糟。
 *
 * 所以這裡**維持原行為**,把分析留在原地,不要看到「從第一幀就取樣」就順手
 * 改掉 —— 先讀 GUIDE 那一節。
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
