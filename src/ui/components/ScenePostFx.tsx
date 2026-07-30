import {
  EffectComposer, Bloom, N8AO, ToneMapping, Vignette, SMAA,
  HueSaturation, BrightnessContrast, DepthOfField,
} from '@react-three/postprocessing';
import { ToneMappingMode } from 'postprocessing';
import { RENDER_HI, GFX } from '../renderQuality';

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
}

export function ScenePostFx({
  mobile = false,
  ao = null,
  bloom = { threshold: 0.8, intensity: 0.4 },
  dof = null,
  grade = null,
  vignette = null,
}: PostFxOptions) {
  if (!RENDER_HI || !GFX.postfx) return null;
  // N8AO needs the normal pass; asking for it when AO is off wastes a target.
  const wantAO = !!ao && !mobile;
  const wantDoF = !!dof && !mobile;
  return (
    <EffectComposer enableNormalPass={wantAO} multisampling={0}>
      {wantAO ? (
        <N8AO
          aoRadius={ao!.radius}
          intensity={ao!.intensity}
          distanceFalloff={1.0}
          quality="performance"
          halfRes
        />
      ) : <></>}
      {bloom ? (
        <Bloom luminanceThreshold={bloom.threshold} intensity={bloom.intensity} mipmapBlur />
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
      {vignette ? (
        <Vignette eskil={false} offset={vignette.offset} darkness={vignette.darkness} />
      ) : <></>}
      <ToneMapping mode={ToneMappingMode.AGX} />
      <SMAA />
    </EffectComposer>
  );
}
