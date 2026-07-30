import { useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

/**
 * 大地圖的日照與陰影 — a sun whose shadow camera follows the view.
 *
 * ## 為什麼這張圖以前完全沒有陰影
 *
 * The map's shadow camera used to span the whole world: `left=-MAP_W`,
 * `right=+MAP_W`, i.e. **416 world units across a 2048 shadow map** — 0.20
 * units per texel, when a hex prism is about one unit wide. At that texel
 * size the depth comparison is wrong nearly everywhere, and the symptom was
 * spectacular: whole hexes rendered pure black (near-black pixels 0.15% →
 * 4.01% at a pinned camera).
 *
 * That was mistaken for "shadows are broken on this map" and they were turned
 * off entirely, which is how the strategic view ended up flat-lit — mountains,
 * walls and armies with no contact darkening at all. It had in fact never
 * rendered a correct shadow: the whole time before that, drei's `<SoftShadows>`
 * was failing to link the shader (PCSS vs three 0.184's `sampler2DShadow`) and
 * quietly suppressing the pass.
 *
 * ## 修法
 *
 * Nothing about the shadow *pass* was wrong — only the frustum. This rig
 * re-aims the light every frame at the point the camera is actually looking
 * at, and sizes the ortho box to what is on screen (±10…26 units, scaled by
 * camera height) — about 0.025 units per texel, an **eight-fold** improvement.
 *
 * The numbers were walked in, not guessed. ±45 with normalBias 0.03 still left
 * 2.12% near-black pixels (the bug was 4.01%, shadowless 0.15%); ±26 with
 * bias −0.0009 / normalBias 0.15 measures 0.00%. normalBias is in WORLD units,
 * so on a map whose terrain quads are ~0.9 units across, the 0.06 tried during
 * the original investigation was far too small to bite — which is why that
 * round concluded the pass itself was broken.
 *
 * Two things this buys beyond correctness:
 *  - the shadow camera now culls almost every caster on the map, so the pass
 *    costs a fraction of what the world-sized frustum did;
 *  - `castShadow` can be gated purely on zoom tier (near only), because at mid
 *    and far a city is a handful of pixels and its shadow is not resolvable.
 *
 * ## 別回頭把 frustum 放大
 *
 * Widening the box to "cover more" walks straight back into the black hexes.
 * If distant shadows are ever wanted, that is a cascade (CSM) — several
 * cameras each with a tight box — not one big one.
 */
export function MapSunShadow({ sunPos, intensity, color, castShadow }: {
  /** Sun direction (a preset offset, not a world position). */
  sunPos: [number, number, number];
  intensity: number;
  color: string;
  castShadow: boolean;
}) {
  const lightRef = useRef<THREE.DirectionalLight>(null);
  const targetRef = useRef<THREE.Object3D>(null);
  const camera = useThree((s) => s.camera);

  // Scratch vectors — this runs every frame.
  const focus = useRef(new THREE.Vector3());
  const dir = useRef(new THREE.Vector3());
  const sunDir = useRef(new THREE.Vector3());
  const lastExtent = useRef(0);

  useFrame(() => {
    const light = lightRef.current, target = targetRef.current;
    if (!light || !target) return;
    // Bind here, not as a prop: on the first render the ref is still null and
    // r3f would never re-render to pick it up, leaving the light aimed at the
    // world origin (and the shadow box permanently off-screen).
    if (light.target !== target) light.target = target;

    // 視線落點 — where the camera's ray meets the ground plane. This is what
    // the player is looking at, and therefore the only place a shadow needs
    // to be right. (OrbitControls' own target would do, but deriving it from
    // the camera keeps this component free of a controls ref.)
    camera.getWorldDirection(dir.current);
    const t = dir.current.y < -1e-4 ? -camera.position.y / dir.current.y : 0;
    focus.current.copy(camera.position).addScaledVector(dir.current, Math.min(Math.max(t, 0), 400));

    // The box tracks how much ground is on screen; clamped so a very low or
    // very high camera cannot blow the texel budget again.
    const extent = Math.min(26, Math.max(10, camera.position.y * 0.7));
    sunDir.current.set(sunPos[0], sunPos[1], sunPos[2]).normalize();

    light.position.copy(focus.current).addScaledVector(sunDir.current, 70);
    target.position.copy(focus.current);
    target.updateMatrixWorld();

    if (Math.abs(extent - lastExtent.current) > 0.5) {
      const c = light.shadow.camera;
      c.left = -extent; c.right = extent; c.top = extent; c.bottom = -extent;
      c.near = 1; c.far = 160;
      c.updateProjectionMatrix();
      lastExtent.current = extent;
      // 量測鉤子 — mapShadows.spec asserts on this. The near-black pixel count
      // alone cannot tell "the acne is fixed" from "shadows never turned on".
      console.debug(`[MapSunShadow] casting=${light.castShadow} extent=${extent.toFixed(1)} texels/unit=${(2048 / (extent * 2)).toFixed(1)}`);
    }
  });

  return (
    <>
      <directionalLight
        ref={lightRef}
        position={sunPos}
        intensity={intensity}
        color={color}
        castShadow={castShadow}
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        // Tight frustum → the classic acne biases work at their usual scale.
        shadow-bias={-0.0009}
        shadow-normalBias={0.15}
      />
      <object3D ref={targetRef} />
    </>
  );
}
