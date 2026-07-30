/* 自訂後處理效果 — colour-grade (色溫/色調/提黑/增益) and heat-haze (熱浪扭曲).
 *
 * postprocessing's stock passes stop at saturation/contrast; a believable
 * 四時之色 needs temperature (winter's steel blue, autumn's amber) and a
 * gentle lift/gain so the grade behaves like a LUT without shipping LUT
 * textures. Both effects are ~a dozen shader instructions — cheap enough to
 * run wherever the composer runs.
 *
 * Plain classes + factory functions (no React) so Fast Refresh stays happy;
 * ScenePostFx wraps them in <primitive>. */

import { Effect, BlendFunction } from 'postprocessing';
import { Uniform } from 'three';

/* ─── 色溫分級 ─────────────────────────────────────────────────────── */

const GRADE_FRAG = /* glsl */ `
  uniform float uTemp;   // −1 寒 … +1 暖
  uniform float uTint;   // −1 洋紅 … +1 綠
  uniform float uLift;   // 黑位抬升
  uniform float uGain;   // 整體增益

  void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {
    vec3 c = inputColor.rgb;
    c.r += uTemp * 0.075;
    c.b -= uTemp * 0.085;
    c.g += uTint * 0.05;
    c = c * uGain + vec3(uLift);
    outputColor = vec4(c, inputColor.a);
  }
`;

export interface ToneGrade {
  /** −1 (寒/青) … +1 (暖/金)。 */
  temperature: number;
  tint?: number;
  lift?: number;
  gain?: number;
}

export class ColorGradeEffect extends Effect {
  constructor({ temperature = 0, tint = 0, lift = 0, gain = 1 }: ToneGrade) {
    super('ColorGradeEffect', GRADE_FRAG, {
      blendFunction: BlendFunction.SRC,
      uniforms: new Map<string, Uniform>([
        ['uTemp', new Uniform(temperature)],
        ['uTint', new Uniform(tint)],
        ['uLift', new Uniform(lift)],
        ['uGain', new Uniform(gain)],
      ]),
    });
  }

  set(t: ToneGrade): void {
    this.uniforms.get('uTemp')!.value = t.temperature;
    this.uniforms.get('uTint')!.value = t.tint ?? 0;
    this.uniforms.get('uLift')!.value = t.lift ?? 0;
    this.uniforms.get('uGain')!.value = t.gain ?? 1;
  }
}

/* ─── 熱浪扭曲 ─────────────────────────────────────────────────────── */

const HAZE_FRAG = /* glsl */ `
  uniform float uTime;
  uniform float uHaze;   // 0 關 … 1 全開

  void mainUv(inout vec2 uv) {
    // 熱氣自地面升騰 — the wobble concentrates on the lower two thirds of the
    // frame and fades to nothing at the sky line.
    float mask = smoothstep(0.05, 0.6, 1.0 - uv.y);
    float w1 = sin(uv.y * 62.0 + uTime * 3.1) * cos(uv.x * 41.0 + uTime * 2.3);
    float w2 = cos(uv.y * 53.0 - uTime * 2.6);
    uv.x += w1 * 0.0016 * uHaze * mask;
    uv.y += w2 * 0.0010 * uHaze * mask;
  }
`;

export class HeatHazeEffect extends Effect {
  constructor(intensity = 1) {
    super('HeatHazeEffect', HAZE_FRAG, {
      uniforms: new Map<string, Uniform>([
        ['uTime', new Uniform(0)],
        ['uHaze', new Uniform(intensity)],
      ]),
    });
  }

  override update(_renderer: unknown, _inputBuffer: unknown, deltaTime?: number): void {
    this.uniforms.get('uTime')!.value += deltaTime ?? 0.016;
  }

  setIntensity(v: number): void {
    this.uniforms.get('uHaze')!.value = v;
  }
}

/* ─── 鏡頭光暈 ─────────────────────────────────────────────────────────
 *
 * Hand-rolled rather than @react-three/postprocessing's <LensFlare>, for two
 * separate reasons — both worth remembering before anyone "simplifies" this
 * back to the library component:
 *
 * 1. **It crashes.** That wrapper is built by the library's generic props
 *    factory, whose memo key is `JSON.stringify(props)`. Our flare position
 *    is derived from scene objects, and anything reachable from an Object3D
 *    closes a `children → parent` cycle: `TypeError: Converting circular
 *    structure to JSON`, thrown during render, taking the whole app down at
 *    campaign start. (Bisected 2026-07-29: tone/heatHaze clean, flare fatal.)
 * 2. **The same factory re-creates the effect on every render**, because the
 *    memo deps are the props object itself.
 *
 * This version is ~40 instructions of screen-space maths with the sun's UV fed
 * in from the CPU (see ScenePostFx), so it costs one pass and nothing else.
 */

const FLARE_FRAG = /* glsl */ `
  uniform vec2  uSunUv;     // sun in screen UV
  uniform float uFlare;     // 0 off … 1 full
  uniform vec3  uFlareColor;
  uniform float uAspect;

  void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {
    vec3 c = inputColor.rgb;
    if (uFlare > 0.001) {
      // Work in aspect-corrected space so ghosts stay round.
      vec2 p = (uv - 0.5) * vec2(uAspect, 1.0);
      vec2 s = (uSunUv - 0.5) * vec2(uAspect, 1.0);

      // 光斑 — the bloom around the disc itself.
      float glare = exp(-length(p - s) * 13.0) * 0.5;

      // 橫向拉絲 — the anamorphic streak a wide lens throws.
      float streak = exp(-abs(p.y - s.y) * 110.0) * exp(-abs(p.x - s.x) * 1.7) * 0.3;

      // 鬼影 — internal reflections march back through the frame centre.
      float ghosts = 0.0;
      for (int i = 1; i <= 5; i++) {
        vec2 gp = s * (-0.42 * float(i));
        float r = 0.05 + float(i) * 0.022;
        ghosts += smoothstep(r, 0.0, length(p - gp)) * (0.14 / float(i));
      }

      // 光環 — a faint ring opposite the sun.
      float halo = smoothstep(0.05, 0.0, abs(length(p + s * 0.55) - 0.26)) * 0.1;

      c += uFlareColor * (glare + streak + ghosts + halo) * uFlare;
    }
    outputColor = vec4(c, inputColor.a);
  }
`;

export class SunFlareEffect extends Effect {
  constructor() {
    super('SunFlareEffect', FLARE_FRAG, {
      blendFunction: BlendFunction.SRC,
      uniforms: new Map<string, Uniform>([
        ['uSunUv', new Uniform({ x: 0.5, y: 0.5 })],
        ['uFlare', new Uniform(0)],
        ['uFlareColor', new Uniform({ r: 1, g: 0.95, b: 0.85 })],
        ['uAspect', new Uniform(1.78)],
      ]),
    });
  }

  /** Called from a useFrame in ScenePostFx once the sun is projected. */
  setSun(uvX: number, uvY: number, intensity: number, aspect: number): void {
    const uv = this.uniforms.get('uSunUv')!.value as { x: number; y: number };
    uv.x = uvX; uv.y = uvY;
    this.uniforms.get('uFlare')!.value = intensity;
    this.uniforms.get('uAspect')!.value = aspect;
  }

  setColor(r: number, g: number, b: number): void {
    const c = this.uniforms.get('uFlareColor')!.value as { r: number; g: number; b: number };
    c.r = r; c.g = g; c.b = b;
  }
}
