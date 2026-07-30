import {
  EffectComposer, Bloom, N8AO, ToneMapping, Vignette, SMAA,
  HueSaturation, BrightnessContrast, DepthOfField, Outline,
} from '@react-three/postprocessing';
import { ToneMappingMode, GodRaysEffect, KernelSize } from 'postprocessing';
import { useEffect, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { RENDER_HI, GFX } from '../renderQuality';
import { ColorGradeEffect, HeatHazeEffect, SunFlareEffect, type ToneGrade } from './postfxEffects';

/**
 * 三圖共用的後處理棧 — ambient occlusion, bloom, grading, tone mapping and
 * anti-aliasing in one place.
 *
 * The battle screen had grown a full modern pipeline (N8AO + Bloom + DoF +
 * AgX + Vignette + SMAA) while the world map and the city scene still had
 * nothing but a lone Bloom: no contact shadows, no tone mapping (so highlights
 * blew out white), no edge AA, and three scenes that did not look like they
 * came from the same game. Same shape of problem as the GL-recovery split —
 * a good thing installed on exactly one of the three.
 *
 * ## Cost gating
 *
 * `RENDER_HI` alone is NOT enough for the heavy passes: a modern iPhone
 * resolves RENDER_HI to true, and a sustained full-screen AO pass is exactly
 * the kind of pressure that made iOS WKWebView drop the GL context (see
 * useGLRecovery). So AO and depth-of-field additionally require `!mobile`,
 * while the cheap passes (grading, tone mapping, vignette, SMAA) run wherever
 * the composer runs.
 *
 * The host is expected to unmount this entirely when FrameRateWatch degrades
 * — a full-screen post stack is the single biggest thing worth dropping.
 */

export interface PostFxOptions {
  /** Skip the passes that cost real fill rate (phones). */
  mobile?: boolean;
  /** 環境光遮蔽 — contact darkening in the creases. Omit to skip. */
  ao?: { radius: number; intensity: number } | null;
  /** Glow threshold/intensity; night scenes open this up. */
  bloom?: { threshold: number; intensity: number } | null;
  /** 景深 — focus point in world space plus lens settings. Omit to skip. */
  dof?: { target: [number, number, number]; focalLength: number; bokehScale: number } | null;
  /** 色彩分級 — season/time-of-day grade. */
  grade?: { saturation: number; contrast: number; brightness?: number } | null;
  /** Corner darkening. Omit to skip. */
  vignette?: { offset: number; darkness: number } | null;
  /** 色溫分級 — LUT-like temperature/tint/lift/gain on top of `grade`. */
  tone?: ToneGrade | null;
  /** 熱浪扭曲 0..1 — drought / firestorm shimmer rising off the ground. */
  heatHaze?: number | null;
  /** 體積光 — screen-space god rays from a mounted sun mesh. Pass the RESOLVED
   *  mesh (callback-ref state), not a ref object: the pass needs it at mount.
   *  Heavy — additionally gated on `!mobile`. */
  godRaysSun?: THREE.Mesh | null;
  /** 鏡頭光暈 — polygon ghosts + halo at a world position. `!mobile` only. */
  flare?: { position: [number, number, number]; color?: string } | null;
  /** 描邊高亮 — glowing outline around whatever a <Select> subtree registers.
   *  The host must wrap its scene (composer included) in <Selection>. */
  outline?: { visibleColor: string; hiddenColor?: string; strength?: number } | null;
}

export function ScenePostFx({
  mobile = false,
  ao = null,
  bloom = { threshold: 0.8, intensity: 0.4 },
  dof = null,
  grade = null,
  vignette = null,
  tone = null,
  outline = null,
  heatHaze = null,
  godRaysSun = null,
  flare = null,
}: PostFxOptions) {
  // Hooks before the early return (rules of hooks) — all cheap to build.
  const camera = useThree((s) => s.camera);
  const size = useThree((s) => s.size);

  const gradeFx = useMemo(() => new ColorGradeEffect(tone ?? { temperature: 0 }), []);
  useEffect(() => { if (tone) gradeFx.set(tone); }, [gradeFx, tone]);
  const hazeFx = useMemo(() => new HeatHazeEffect(heatHaze ?? 0), []);
  useEffect(() => { hazeFx.setIntensity(heatHaze ?? 0); }, [hazeFx, heatHaze]);

  /* 體積光 — built by hand rather than via <GodRays>: that wrapper's memo deps
     are its own props object, so it allocates a fresh GodRaysEffect (and its
     render targets) on EVERY render of this component. */
  const godRaysFx = useMemo(() => {
    if (!godRaysSun || mobile) return null;
    return new GodRaysEffect(camera, godRaysSun, {
      samples: 48, density: 0.94, decay: 0.93, weight: 0.3, exposure: 0.32,
      clampMax: 1, blur: true, kernelSize: KernelSize.SMALL, resolutionScale: 0.5,
    });
  }, [camera, godRaysSun, mobile]);
  useEffect(() => () => godRaysFx?.dispose(), [godRaysFx]);

  /* 鏡頭光暈 — see SunFlareEffect for why this is not <LensFlare>. */
  const flareFx = useMemo(() => new SunFlareEffect(), []);
  const flarePos = useMemo(
    () => (flare ? new THREE.Vector3(...flare.position) : null),
    [flare?.position[0], flare?.position[1], flare?.position[2]],
  );
  useEffect(() => {
    if (!flare?.color) return;
    const c = new THREE.Color(flare.color);
    flareFx.setColor(c.r, c.g, c.b);
  }, [flareFx, flare?.color]);

  const wantFlare = !!flare && !!flarePos && !mobile;
  useFrame(() => {
    if (!wantFlare || !flarePos) { flareFx.setSun(0.5, 0.5, 0, 1); return; }
    // Project the sun; fade out behind the camera and off the edges so the
    // ghosts never pop in at the frame border.
    const v = flarePos.clone().project(camera);
    const behind = v.z > 1;
    const edge = Math.max(Math.abs(v.x), Math.abs(v.y));
    const vis = behind ? 0 : Math.max(0, 1 - Math.max(0, edge - 0.55) / 0.75);
    flareFx.setSun((v.x + 1) / 2, (v.y + 1) / 2, vis, Math.max(0.2, size.width / Math.max(1, size.height)));
  });

  if (!RENDER_HI || !GFX.postfx) return null;
  const wantAO = !!ao && !mobile;
  const wantDoF = !!dof && !mobile;
  // enableNormalPass={false} 是刻意的,別「修」回 wantAO ——
  // composer 的 NormalPass **把整個場景再畫一遍**(城內實測 +1,494 次 draw,
  // 比合批後的整座城還貴),而我們唯一的 AO 是 N8AO,它是獨立 Pass:
  // `new N8AOPostPass(scene, camera)` 自己算深度與法線,從來沒讀過那張圖。
  // 要加回來的前提是換用真的吃 normalPass 的效果(SSAO / DepthDownsampling),
  // 否則就是白付一趟場景重繪。
  return (
    <EffectComposer enableNormalPass={false} multisampling={0}>
      {wantAO ? (
        <N8AO
          aoRadius={ao!.radius}
          intensity={ao!.intensity}
          distanceFalloff={1.0}
          quality="performance"
          halfRes
        />
      ) : <></>}
      {/* 體積光 — before bloom so the shafts feed the glow, not the reverse. */}
      {godRaysFx ? <primitive object={godRaysFx} dispose={null} /> : <></>}
      {bloom ? (
        <Bloom luminanceThreshold={bloom.threshold} intensity={bloom.intensity} mipmapBlur />
      ) : <></>}
      {wantFlare ? <primitive object={flareFx} dispose={null} /> : <></>}
      {/* 描邊 — only the <Select enabled> subtree renders into the outline
          buffer, so this costs a handful of draws, not a scene pass. */}
      {outline ? (
        <Outline
          visibleEdgeColor={Number(`0x${outline.visibleColor.replace('#', '')}`)}
          hiddenEdgeColor={Number(`0x${(outline.hiddenColor ?? outline.visibleColor).replace('#', '')}`)}
          edgeStrength={outline.strength ?? 4}
          blur
          xRay
        />
      ) : <></>}
      {wantDoF ? (
        <DepthOfField
          target={dof!.target}
          focalLength={dof!.focalLength}
          bokehScale={dof!.bokehScale}
          height={480}
        />
      ) : <></>}
      {grade ? <HueSaturation saturation={grade.saturation} /> : <></>}
      {grade ? (
        <BrightnessContrast brightness={grade.brightness ?? 0} contrast={grade.contrast} />
      ) : <></>}
      {/* 色溫 — after sat/contrast, before tone mapping (AgX expects linear-ish). */}
      {tone ? <primitive object={gradeFx} dispose={null} /> : <></>}
      {heatHaze != null && heatHaze > 0 ? <primitive object={hazeFx} dispose={null} /> : <></>}
      {vignette ? (
        <Vignette eskil={false} offset={vignette.offset} darkness={vignette.darkness} />
      ) : <></>}
      <ToneMapping mode={ToneMappingMode.AGX} />
      <SMAA />
    </EffectComposer>
  );
}
